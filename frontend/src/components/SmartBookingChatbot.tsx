"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { X, Bot, User, Loader2, RotateCcw, Calendar, Clock, Users, CheckCircle, Circle, AlertTriangle, Sparkles, ArrowRight, MapPin, MapPinned } from "lucide-react";

interface Resource {
    id?: string;
    _id?: string;
    resourceName?: string;
    name?: string;
    resourceType?: string;
    type?: string;
    category?: "FACILITY" | "UTILITY";
    status?: string;
    capacity?: number;
    location?: string;
    serialNumber?: string;
    campusName?: string;
    building?: string;
    roomNumber?: string;
    storageLocation?: string;
    resourceCode?: string;
    description?: string;
    amenities?: string[];
    campusLocation?: {
        campusName?: string;
        buildingName?: string;
        roomNumber?: string;
    };
}

interface BookingData {
    category: string;
    type: string;
    location: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
    capacityLabel: string;
    amenities: string[];
}

interface ChatMessage {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
    options?: ChatOption[];
    resource?: Resource;
    bookingData?: BookingData;
    isDatePicker?: boolean;
    isTimePicker?: boolean;
    isCapacityPicker?: boolean;
    isAmenityPicker?: boolean;
    isUtilityTypePicker?: boolean;
    isTypePicker?: boolean;
    isLocationPicker?: boolean;
    isStartTimePicker?: boolean;
    isEndTimePicker?: boolean;
    error?: string;
    recommendationReason?: string;
    isBooked?: boolean;
    alternativeResource?: Resource;
}

interface ChatOption {
    label: string;
    value: string;
    description?: string;
}

type BookingStep = 
    | "category"
    | "location"
    | "facilityType"
    | "capacity"
    | "amenities"
    | "utilityType"
    | "date"
    | "startTime"
    | "endTime"
    | "recommendation"
    | "done";

interface SmartBookingChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    onViewResource: (resource: Resource) => void;
    onBookResource: (resource: Resource, bookingData?: BookingData) => void;
    resources: Resource[];
}

const FACILITY_TYPES: ChatOption[] = [
    { label: "Lecture Hall", value: "LECTURE_HALL", description: "Large hall for lectures" },
    { label: "Lab", value: "LAB", description: "Laboratory space" },
    { label: "Meeting Room", value: "MEETING_ROOM", description: "Small to medium meeting space" },
    { label: "Auditorium", value: "AUDITORIUM", description: "Large auditorium" },
    { label: "Room", value: "ROOM", description: "General room" },
];

const UTILITY_TYPES: ChatOption[] = [
    { label: "Projector", value: "PROJECTOR", description: "Display equipment" },
    { label: "Sound System", value: "SOUND_SYSTEM", description: "Audio equipment" },
    { label: "Microphone", value: "MICROPHONE", description: "Microphones" },
    { label: "Whiteboard", value: "WHITEBOARD", description: "Whiteboard/board" },
    { label: "Flags", value: "FLAGS", description: "Display flags" },
];

const AMENITY_OPTIONS: ChatOption[] = [
    { label: "Whiteboard", value: "Whiteboard" },
    { label: "Projector", value: "Projector" },
    { label: "Air Conditioning", value: "Air Conditioning" },
    { label: "Audio System", value: "Audio System" },
    { label: "Video Conferencing", value: "Video Conferencing" },
];

const CAPACITY_OPTIONS: ChatOption[] = [
    { label: "1-10 people", value: "10" },
    { label: "11-20 people", value: "20" },
    { label: "21-50 people", value: "50" },
    { label: "51-100 people", value: "100" },
    { label: "100+ people", value: "200" },
];

const TIME_SLOTS = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

function validateTimeRange(startTime: string, endTime: string): boolean {
    if (!startTime || !endTime) return false;
    const start = parseInt(startTime.split(":")[0]);
    const end = parseInt(endTime.split(":")[0]);
    return end > start;
}

function getValidEndTimes(startTime: string): string[] {
    if (!startTime) return [];
    const startHour = parseInt(startTime.split(":")[0]);
    return TIME_SLOTS.filter(t => parseInt(t.split(":")[0]) > startHour);
}

function getLocationsFromResources(resources: Resource[]): ChatOption[] {
    const locationSet = new Set<string>();
    
    resources.forEach(r => {
        const campusLoc = r.campusLocation;
        if (r.category === "FACILITY") {
            const campus = campusLoc?.campusName || r.campusName;
            const building = campusLoc?.buildingName || r.building || r.location;
            if (campus) locationSet.add(campus);
            if (building) locationSet.add(building);
        } else {
            const campus = campusLoc?.campusName || r.campusName;
            const storage = campusLoc?.buildingName || r.storageLocation || r.location;
            if (campus) locationSet.add(campus);
            if (storage) locationSet.add(storage);
        }
    });
    
    return Array.from(locationSet)
        .filter(loc => loc && loc.trim())
        .sort()
        .map(loc => ({ label: loc, value: loc }));
}

function getBestFacilityMatch(resources: Resource[], criteria: {
    type?: string;
    location?: string;
    capacity?: number;
    amenities?: string[];
    date?: string;
    startTime?: string;
    endTime?: string;
}): Resource | null {
    let facilities = resources.filter(r => r.category === "FACILITY" && r.status === "ACTIVE");
    
    if (criteria.location) {
        facilities = facilities.filter(r => {
            const campusLoc = r.campusLocation;
            const campus = campusLoc?.campusName || r.campusName || "";
            const building = campusLoc?.buildingName || r.building || r.location || "";
            return campus.toLowerCase() === criteria.location!.toLowerCase() ||
                   building.toLowerCase() === criteria.location!.toLowerCase();
        });
    }
    
    if (criteria.type) {
        const typeFiltered = facilities.filter(r => {
            const rType = r.resourceType || r.type || "";
            return rType.toUpperCase() === criteria.type!.toUpperCase();
        });
        if (typeFiltered.length > 0) {
            return rankAndSelectFacility(typeFiltered, criteria);
        }
    }
    
    return rankAndSelectFacility(facilities, criteria);
}

function rankAndSelectFacility(resources: Resource[], criteria: {
    capacity?: number;
    amenities?: string[];
}): Resource | null {
    if (resources.length === 0) return null;
    
    const scored = resources.map(resource => {
        let score = 0;
        
        if (criteria.capacity && resource.capacity) {
            if (resource.capacity >= criteria.capacity) {
                score += 50;
                if (resource.capacity <= criteria.capacity * 1.5) {
                    score += 20;
                }
            } else {
                score -= 100;
            }
        } else {
            score += 25;
        }
        
        if (criteria.amenities && criteria.amenities.length > 0 && resource.amenities) {
            const resourceAmenities = resource.amenities.map(a => a.toLowerCase());
            const matched = criteria.amenities.filter(a => 
                resourceAmenities.includes(a.toLowerCase())
            ).length;
            score += matched * 15;
        }
        
        return { resource, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    return scored[0].resource;
}

function getBestUtilityMatch(resources: Resource[], criteria: {
    type?: string;
    location?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
}): Resource | null {
    let utilities = resources.filter(r => r.category === "UTILITY" && r.status === "ACTIVE");
    
    if (criteria.location) {
        utilities = utilities.filter(r => {
            const campusLoc = r.campusLocation;
            const campus = campusLoc?.campusName || r.campusName || "";
            const storage = campusLoc?.buildingName || r.storageLocation || r.location || "";
            return campus.toLowerCase() === criteria.location!.toLowerCase() ||
                   storage.toLowerCase() === criteria.location!.toLowerCase();
        });
    }
    
    if (criteria.type) {
        const filtered = utilities.filter(r => {
            const rType = r.resourceType || r.type || "";
            return rType.toUpperCase() === criteria.type!.toUpperCase();
        });
        if (filtered.length > 0) return filtered[0];
    }
    
    return utilities.length > 0 ? utilities[0] : null;
}

function getSameCategoryAlternatives(resources: Resource[], excludedId: string, criteria: {
    category?: string;
    type?: string;
    location?: string;
    capacity?: number;
    amenities?: string[];
}): Resource | null {
    let filtered = resources.filter(r => 
        r.status === "ACTIVE" && 
        (r.id || r._id) !== excludedId
    );
    
    if (criteria.category) {
        filtered = filtered.filter(r => r.category === criteria.category);
    }
    
    if (criteria.type) {
        filtered = filtered.filter(r => {
            const rType = r.resourceType || r.type || "";
            return rType.toUpperCase() === criteria.type!.toUpperCase();
        });
    }
    
    if (criteria.location) {
        filtered = filtered.filter(r => {
            const campusLoc = r.campusLocation;
            if (criteria.category === "FACILITY") {
                const campus = campusLoc?.campusName || r.campusName || "";
                const building = campusLoc?.buildingName || r.building || r.location || "";
                return campus.toLowerCase() === criteria.location!.toLowerCase() ||
                       building.toLowerCase() === criteria.location!.toLowerCase();
            } else {
                const campus = campusLoc?.campusName || r.campusName || "";
                const storage = campusLoc?.buildingName || r.storageLocation || r.location || "";
                return campus.toLowerCase() === criteria.location!.toLowerCase() ||
                       storage.toLowerCase() === criteria.location!.toLowerCase();
            }
        });
    }
    
    if (filtered.length > 0) {
        return rankAndSelectFacility(filtered, {
            capacity: criteria.capacity,
            amenities: criteria.amenities,
        });
    }
    
    if (criteria.category && criteria.type) {
        filtered = resources.filter(r => 
            r.status === "ACTIVE" && 
            r.category === criteria.category &&
            (r.id || r._id) !== excludedId
        );
        const typeFiltered = filtered.filter(r => {
            const rType = r.resourceType || r.type || "";
            return rType.toUpperCase() === criteria.type!.toUpperCase();
        });
        if (typeFiltered.length > 0) {
            return rankAndSelectFacility(typeFiltered, {
                capacity: criteria.capacity,
                amenities: criteria.amenities,
            });
        }
    }
    
    return null;
}

function buildCapacityRequirementLabel(capacityLabel: string): string {
    if (!capacityLabel) return "";
    return capacityLabel.replace(" people", "");
}

function buildRecommendationReason(resource: Resource, criteria: {
    category?: string;
    type?: string;
    location?: string;
    capacityLabel?: string;
    amenities?: string[];
}): string {
    const reasons: string[] = [];
    
    if (criteria.category === "FACILITY") {
        if (criteria.location) {
            reasons.push(`is located at ${criteria.location}`);
        }
        reasons.push("matches your selected facility type");
        
        if (criteria.capacityLabel) {
            const requirement = buildCapacityRequirementLabel(criteria.capacityLabel);
            reasons.push(`fits your requested capacity of ${requirement} people`);
        }
        
        if (criteria.amenities && criteria.amenities.length > 0 && resource.amenities) {
            const matched = criteria.amenities.filter(a => 
                resource.amenities!.map(am => am.toLowerCase()).includes(a.toLowerCase())
            );
            if (matched.length > 0) {
                reasons.push(`includes ${matched.join(", ")}`);
            }
        }
        
        reasons.push("is available for your selected time");
    } else {
        if (criteria.location) {
            reasons.push(`is available at ${criteria.location}`);
        }
        reasons.push("matches your selected utility type");
        reasons.push("is available for booking");
    }
    
    return "This is the best option because " + reasons.join(", ") + ".";
}

function formatType(type: string): string {
    if (type?.startsWith("OTHER:")) {
        return type.replace("OTHER:", "");
    }
    return type?.replace(/_/g, ' ') || 'Unknown';
}

function getLocationDisplay(resource: Resource): string {
    const campusLoc = resource.campusLocation;
    if (resource.category === "FACILITY") {
        const parts = [];
        if (campusLoc?.campusName || resource.campusName) {
            parts.push(campusLoc?.campusName || resource.campusName);
        }
        if (campusLoc?.buildingName || resource.building || resource.location) {
            parts.push(campusLoc?.buildingName || resource.building || resource.location);
        }
        return parts.join(" - ") || resource.location || "N/A";
    } else {
        const campus = campusLoc?.campusName || resource.campusName;
        const storage = campusLoc?.buildingName || resource.storageLocation || resource.location;
        if (campus && storage) return `${campus} - ${storage}`;
        return campus || storage || "N/A";
    }
}

let messageIdCounter = 0;
const generateMessageId = (): string => {
    messageIdCounter += 1;
    return `msg_${Date.now()}_${messageIdCounter}`;
};

export default function SmartBookingChatbot({ isOpen, onClose, onViewResource, onBookResource, resources }: SmartBookingChatbotProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentStep, setCurrentStep] = useState<BookingStep>("category");
    const [bookingData, setBookingData] = useState<BookingData>({
        category: "",
        type: "",
        location: "",
        date: "",
        startTime: "",
        endTime: "",
        capacity: 0,
        capacityLabel: "",
        amenities: [],
    });
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [timeError, setTimeError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const bookingDataRef = useRef(bookingData);
    
    useEffect(() => {
        bookingDataRef.current = bookingData;
    }, [bookingData]);
    
    const locationOptions = useMemo(() => getLocationsFromResources(resources), [resources]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const startConversation = useCallback(() => {
        const welcomeMsg: ChatMessage = {
            id: generateMessageId(),
            text: "What would you like to book?",
            sender: "bot",
            timestamp: new Date(),
            options: [
                { label: "Facilities", value: "FACILITY", description: "Rooms, halls, labs" },
                { label: "Utilities", value: "UTILITY", description: "Equipment, AV systems" },
            ],
        };
        setMessages([welcomeMsg]);
        setCurrentStep("category");
        setBookingData({ category: "", type: "", location: "", date: "", startTime: "", endTime: "", capacity: 0, capacityLabel: "", amenities: [] });
        setSelectedAmenities([]);
        setTimeError(null);
    }, []);

    const resetConversation = useCallback(() => {
        setMessages([]);
        setCurrentStep("category");
        setBookingData({ category: "", type: "", location: "", date: "", startTime: "", endTime: "", capacity: 0, capacityLabel: "", amenities: [] });
        setSelectedAmenities([]);
        setTimeError(null);
        setTimeout(startConversation, 300);
    }, [startConversation]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            startConversation();
        }
    }, [isOpen, startConversation, messages.length]);

    const processSelection = useCallback(async (option: ChatOption) => {
        const shouldSimulateBooked = Math.random() < 0.3;
        
        const userMsg: ChatMessage = {
            id: generateMessageId(),
            text: option.label,
            sender: "user",
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
        setTimeError(null);
        await new Promise(resolve => setTimeout(resolve, 600));

        const currentBookingData = bookingDataRef.current;
        let botMsg: ChatMessage;

        if (currentStep === "category") {
            setBookingData(prev => ({ ...prev, category: option.value }));
            botMsg = {
                id: generateMessageId(),
                text: "Where do you need it?",
                sender: "bot",
                timestamp: new Date(),
                isLocationPicker: true,
            };
            setCurrentStep("location");
        } 
        else if (currentStep === "location") {
            const locationVal = option.value;
            setBookingData(prev => ({ ...prev, location: locationVal }));
            
            if (currentBookingData.category === "FACILITY") {
                botMsg = {
                    id: generateMessageId(),
                    text: "What type of facility do you need?",
                    sender: "bot",
                    timestamp: new Date(),
                    isTypePicker: true,
                };
                setCurrentStep("facilityType");
            } else {
                botMsg = {
                    id: generateMessageId(),
                    text: "What type of utility do you need?",
                    sender: "bot",
                    timestamp: new Date(),
                    isUtilityTypePicker: true,
                };
                setCurrentStep("utilityType");
            }
        } 
        else if (currentStep === "facilityType") {
            setBookingData(prev => ({ ...prev, type: option.value }));
            botMsg = {
                id: generateMessageId(),
                text: "How many people will be using this facility?",
                sender: "bot",
                timestamp: new Date(),
                isCapacityPicker: true,
            };
            setCurrentStep("capacity");
        } 
        else if (currentStep === "capacity") {
            const capacityLabel = option.label;
            setBookingData(prev => ({ ...prev, capacity: parseInt(option.value), capacityLabel }));
            botMsg = {
                id: generateMessageId(),
                text: "Which amenities or equipment do you need? (Select all that apply)",
                sender: "bot",
                timestamp: new Date(),
                isAmenityPicker: true,
            };
            setCurrentStep("amenities");
        } 
        else if (currentStep === "amenities") {
            setBookingData(prev => ({ ...prev, amenities: selectedAmenities }));
            botMsg = {
                id: generateMessageId(),
                text: "What date do you need it for?",
                sender: "bot",
                timestamp: new Date(),
                isDatePicker: true,
            };
            setCurrentStep("date");
        } 
        else if (currentStep === "date") {
            const dateVal = option.value;
            setBookingData(prev => ({ ...prev, date: dateVal }));
            botMsg = {
                id: generateMessageId(),
                text: "What start time works for you?",
                sender: "bot",
                timestamp: new Date(),
                isStartTimePicker: true,
            };
            setCurrentStep("startTime");
        } 
        else if (currentStep === "startTime") {
            const startTimeVal = option.value;
            setBookingData(prev => ({ ...prev, startTime: startTimeVal }));
            botMsg = {
                id: generateMessageId(),
                text: "What end time?",
                sender: "bot",
                timestamp: new Date(),
                isEndTimePicker: true,
            };
            setCurrentStep("endTime");
        } 
        else if (currentStep === "endTime") {
            const endTimeVal = option.value;
            
            if (!validateTimeRange(currentBookingData.startTime, endTimeVal)) {
                setTimeError("End time must be later than start time.");
                setIsTyping(false);
                return;
            }
            
            setBookingData(prev => ({ ...prev, endTime: endTimeVal }));
            
            const bestMatch = currentBookingData.category === "FACILITY" 
                ? getBestFacilityMatch(resources, {
                    type: currentBookingData.type,
                    location: currentBookingData.location,
                    capacity: currentBookingData.capacity,
                    amenities: selectedAmenities,
                    date: currentBookingData.date,
                    startTime: currentBookingData.startTime,
                    endTime: endTimeVal,
                })
                : getBestUtilityMatch(resources, {
                    type: currentBookingData.type,
                    location: currentBookingData.location,
                    date: currentBookingData.date,
                    startTime: currentBookingData.startTime,
                    endTime: endTimeVal,
                });
            
            setCurrentStep("recommendation");
            
            if (!bestMatch) {
                botMsg = {
                    id: generateMessageId(),
                    text: `I couldn't find any ${currentBookingData.category === "FACILITY" ? "facility" : "utility"} matching your requirements at this location. Would you like to try a different location or start over?`,
                    sender: "bot",
                    timestamp: new Date(),
                    options: [
                        { label: "Start over", value: "start" },
                    ],
                };
            } else {
                const isBooked = shouldSimulateBooked;
                const reason = buildRecommendationReason(bestMatch, {
                    category: currentBookingData.category,
                    type: currentBookingData.type,
                    location: currentBookingData.location,
                    capacityLabel: currentBookingData.capacityLabel,
                    amenities: selectedAmenities,
                });
                
                if (isBooked) {
                    const altOption = getSameCategoryAlternatives(resources, bestMatch.id || bestMatch._id || "", {
                        category: currentBookingData.category,
                        type: currentBookingData.type,
                        location: currentBookingData.location,
                        capacity: currentBookingData.capacity,
                        amenities: selectedAmenities,
                    });
                    
                    botMsg = {
                        id: generateMessageId(),
                        text: "This is the best match, but it is already booked for your selected time.",
                        sender: "bot",
                        timestamp: new Date(),
                        resource: bestMatch,
                        recommendationReason: reason,
                        isBooked: true,
                        alternativeResource: altOption || undefined,
                    };
                } else {
                    botMsg = {
                        id: generateMessageId(),
                        text: "Perfect! Here's the best option for you:",
                        sender: "bot",
                        timestamp: new Date(),
                        resource: bestMatch,
                        recommendationReason: reason,
                    };
                }
            }
        } 
        else if (currentStep === "utilityType") {
            setBookingData(prev => ({ ...prev, type: option.value }));
            botMsg = {
                id: generateMessageId(),
                text: "What date do you need it for?",
                sender: "bot",
                timestamp: new Date(),
                isDatePicker: true,
            };
            setCurrentStep("date");
        } 
        else if (currentStep === "recommendation") {
            if (option.value === "start") {
                resetConversation();
                setIsTyping(false);
                return;
            } else if (option.value === "view_alternative") {
                const lastMsg = messages[messages.length - 1];
                const altResource = lastMsg?.alternativeResource;
                if (!altResource) {
                    botMsg = {
                        id: generateMessageId(),
                        text: "No alternative available.",
                        sender: "bot",
                        timestamp: new Date(),
                        options: [{ label: "Start over", value: "start" }],
                    };
                } else {
                    const reason = buildRecommendationReason(altResource, {
                        category: currentBookingData.category,
                        type: currentBookingData.type,
                        location: currentBookingData.location,
                        capacityLabel: currentBookingData.capacityLabel,
                        amenities: selectedAmenities,
                    });
                    botMsg = {
                        id: generateMessageId(),
                        text: "Here's an alternative that's available:",
                        sender: "bot",
                        timestamp: new Date(),
                        resource: altResource,
                        recommendationReason: reason,
                    };
                }
            } else {
                botMsg = {
                    id: generateMessageId(),
                    text: "Would you like to start over or try different criteria?",
                    sender: "bot",
                    timestamp: new Date(),
                    options: [
                        { label: "Start over", value: "start" },
                    ],
                };
            }
        }
        else {
            botMsg = {
                id: generateMessageId(),
                text: "Would you like to start over or try different criteria?",
                sender: "bot",
                timestamp: new Date(),
                options: [
                    { label: "Start over", value: "start" },
                ],
            };
        }
        
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    }, [currentStep, selectedAmenities, resources, messages, resetConversation]);

    const handleDateSelect = (date: string) => {
        processSelection({ label: date, value: date });
    };

    const handleStartTimeSelect = (time: string) => {
        processSelection({ label: time, value: time });
    };

    const handleEndTimeSelect = (time: string) => {
        if (!validateTimeRange(bookingData.startTime, time)) {
            setTimeError("End time must be later than start time.");
            return;
        }
        setTimeError(null);
        processSelection({ label: time, value: time });
    };

    const formatDate = (daysFromNow: number): string => {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date.toISOString().split("T")[0];
    };

    const getNextSevenDays = (): ChatOption[] => {
        const options: ChatOption[] = [];
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${days[date.getDay()]}, ${date.getDate()}`;
            options.push({ label, value: formatDate(i) });
        }
        return options;
    };

    const handleAmenityToggle = (amenity: string) => {
        if (selectedAmenities.includes(amenity)) {
            setSelectedAmenities(prev => prev.filter(a => a !== amenity));
        } else {
            setSelectedAmenities(prev => [...prev, amenity]);
        }
    };

    const handleViewDetails = (resource: Resource) => {
        onViewResource(resource);
    };

    const handleBookNow = (resource: Resource) => {
        onBookResource(resource, bookingData);
    };

    const handleStartOver = () => {
        setIsTyping(true);
        setTimeout(() => {
            resetConversation();
            setIsTyping(false);
        }, 300);
    };

    const getEndTimeOptions = (): string[] => {
        if (bookingData.startTime) {
            return getValidEndTimes(bookingData.startTime);
        }
        return [];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[70vh] bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden z-50">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-cyan-600 to-blue-600">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Smart Booking</h3>
                        <p className="text-xs text-white/70">Step-by-step assistant</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                    <X className="w-5 h-5 text-white" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id}>
                        <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`flex items-end gap-2 max-w-[90%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    msg.sender === "user" ? "bg-indigo-500" : "bg-cyan-500"
                                }`}>
                                    {msg.sender === "user" ? (
                                        <User className="w-4 h-4 text-white" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-white" />
                                    )}
                                </div>
                                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                                    msg.sender === "user"
                                        ? "bg-indigo-500 text-white rounded-br-md"
                                        : "bg-slate-700 text-slate-100 rounded-bl-md"
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>

                        {msg.options && msg.options.length > 0 && !msg.isStartTimePicker && !msg.isEndTimePicker && (
                            <div className="mt-3 ml-10 flex flex-wrap gap-2">
                                {msg.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => processSelection(opt)}
                                        disabled={isTyping}
                                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {msg.isLocationPicker && (
                            <div className="mt-3 ml-10">
                                {locationOptions.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {locationOptions.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => processSelection(opt)}
                                                disabled={isTyping}
                                                className="text-left px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-3"
                                            >
                                                <MapPinned className="w-5 h-5 text-slate-400" />
                                                <div>
                                                    <div className="font-medium text-white">{opt.label}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-400">No locations found. Please try again later.</div>
                                )}
                            </div>
                        )}

                        {msg.isDatePicker && (
                            <div className="mt-3 ml-10">
                                <div className="flex flex-wrap gap-2">
                                    {getNextSevenDays().map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleDateSelect(opt.value)}
                                            disabled={isTyping}
                                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {msg.isStartTimePicker && (
                            <div className="mt-3 ml-10">
                                <div className="flex flex-wrap gap-2">
                                    {TIME_SLOTS.map((time, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleStartTimeSelect(time)}
                                            disabled={isTyping}
                                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {msg.isEndTimePicker && (
                            <div className="mt-3 ml-10">
                                {timeError && (
                                    <div className="mb-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        {timeError}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {getEndTimeOptions().map((time, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleEndTimeSelect(time)}
                                            disabled={isTyping}
                                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {msg.isCapacityPicker && (
                            <div className="mt-3 ml-10 flex flex-wrap gap-2">
                                {CAPACITY_OPTIONS.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => processSelection(opt)}
                                        disabled={isTyping}
                                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {msg.isAmenityPicker && (
                            <div className="mt-3 ml-10">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {AMENITY_OPTIONS.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAmenityToggle(opt.value)}
                                            disabled={isTyping}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 ${
                                                selectedAmenities.includes(opt.value)
                                                    ? "bg-cyan-500 text-white"
                                                    : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                                            }`}
                                        >
                                            {selectedAmenities.includes(opt.value) ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <Circle className="w-4 h-4" />
                                            )}
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => processSelection({ label: "Continue", value: "continue" })}
                                    disabled={isTyping}
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                                >
                                    {selectedAmenities.length > 0 ? `Continue (${selectedAmenities.length} selected)` : "Continue without amenities"}
                                </button>
                            </div>
                        )}

                        {msg.isTypePicker && (
                            <div className="mt-3 ml-10">
                                <div className="grid grid-cols-1 gap-2">
                                    {FACILITY_TYPES.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => processSelection(opt)}
                                            disabled={isTyping}
                                            className="text-left px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            <div className="font-medium text-white">{opt.label}</div>
                                            {opt.description && (
                                                <div className="text-xs text-slate-400">{opt.description}</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {msg.isUtilityTypePicker && (
                            <div className="mt-3 ml-10">
                                <div className="grid grid-cols-1 gap-2">
                                    {UTILITY_TYPES.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => processSelection(opt)}
                                            disabled={isTyping}
                                            className="text-left px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            <div className="font-medium text-white">{opt.label}</div>
                                            {opt.description && (
                                                <div className="text-xs text-slate-400">{opt.description}</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {msg.resource && (
                            <div className="mt-3 ml-10">
                                <div className="bg-slate-700/50 rounded-xl border border-slate-600/30 overflow-hidden">
                                    {msg.isBooked && (
                                        <div className="px-4 py-3 bg-amber-500/20 border-b border-amber-500/30 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                                            <span className="text-sm text-amber-400">This option is booked for your selected time</span>
                                        </div>
                                    )}
                                    
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-cyan-400" />
                                                <span className="text-sm font-semibold text-cyan-400">Best option for you</span>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                msg.resource.status === "ACTIVE" 
                                                    ? "bg-emerald-500/20 text-emerald-400" 
                                                    : "bg-red-500/20 text-red-400"
                                            }`}>
                                                {msg.resource.status === "ACTIVE" ? "Available" : msg.resource.status}
                                            </span>
                                        </div>
                                        
                                        <h4 className="text-lg font-bold text-white mb-1">
                                            {msg.resource.resourceName || msg.resource.name}
                                        </h4>
                                        <div className="text-xs text-slate-400 mb-2">
                                            {formatType(msg.resource.resourceType || msg.resource.type || "")} • {msg.resource.category}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm text-slate-300 mb-3">
                                            <MapPin className="w-4 h-4 text-slate-500" />
                                            <span>{getLocationDisplay(msg.resource)}</span>
                                        </div>
                                        
                                        {msg.recommendationReason && (
                                            <div className="text-sm text-slate-300 mb-3 italic">
                                                &quot;{msg.recommendationReason}&quot;
                                            </div>
                                        )}
                                        
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Calendar className="w-4 h-4 text-slate-500" />
                                                <span>{bookingData.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Clock className="w-4 h-4 text-slate-500" />
                                                <span>{bookingData.startTime} - {bookingData.endTime}</span>
                                            </div>
                                            {msg.resource.category === "FACILITY" && (
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <Users className="w-4 h-4 text-slate-500" />
                                                    <span>Capacity: {msg.resource.capacity || "N/A"}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {msg.resource.description && (
                                            <div className="mt-3 text-sm text-slate-400">
                                                {msg.resource.description}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {msg.resource && (
                                    <div className="p-4 pt-0 flex gap-2">
                                        {(() => {
                                            const resource = msg.resource;
                                            return (
                                                <>
                                                    <button
                                                        onClick={() => handleViewDetails(resource)}
                                                        className="flex-1 px-3 py-2.5 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Users className="w-4 h-4" />
                                                        View Details
                                                    </button>
                                                    <button
                                                        onClick={() => handleBookNow(resource)}
                                                        className="flex-1 px-3 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Calendar className="w-4 h-4" />
                                                        Book Now
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    )}
                                    
                                    {msg.isBooked && msg.alternativeResource && (
                                        <div className="p-4 pt-0">
                                            <button
                                                onClick={() => processSelection({ label: "View alternative", value: "view_alternative" })}
                                                className="w-full px-3 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                                Show available alternative
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="flex items-end gap-2">
                            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-700">
                                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {messages.length > 1 && (
                <div className="px-4 py-2 border-t border-slate-700">
                    <button
                        onClick={handleStartOver}
                        disabled={isTyping}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Start Over
                    </button>
                </div>
            )}
        </div>
    );
}
