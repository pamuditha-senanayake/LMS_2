"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { X, Bot, User, Loader2, RotateCcw, Calendar, Clock, Users, CheckCircle, Circle, AlertTriangle, Sparkles, ArrowRight, MapPin, MapPinned, ChevronLeft, Info, ExternalLink } from "lucide-react";

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
    bookings?: Booking[];
}

interface Booking {
    id?: string;
    _id?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
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
    purpose?: string;
    quantity?: number;
    amenities?: string[];
}

interface ChatMessage {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
    options?: ChatOption[];
    resource?: Resource;
    resources?: Resource[];
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
    bookedSlot?: { start: string; end: string };
    alternativeResources?: Resource[];
    showDetailsFor?: Resource;
    isDetailsView?: boolean;
}

interface ChatOption {
    label: string;
    value: string;
    description?: string;
}

type BookingStep = 
    | "welcome"
    | "category"
    | "location"
    | "facilityType"
    | "capacity"
    | "utilityType"
    | "date"
    | "startTime"
    | "endTime"
    | "recommendation"
    | "details"
    | "done";

interface SmartBookingChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    onViewResource: (resource: Resource, bookingData?: BookingData) => void;
    onBookResource: (resource: Resource, bookingData?: BookingData) => void;
    resources: Resource[];
}

const FACILITY_TYPES: ChatOption[] = [
    { label: "Meeting Room", value: "MEETING_ROOM", description: "Small to medium meeting space" },
    { label: "Lecture Hall", value: "LECTURE_HALL", description: "Large hall for lectures" },
    { label: "Lab", value: "LAB", description: "Laboratory space" },
    { label: "Auditorium", value: "AUDITORIUM", description: "Large auditorium" },
    { label: "Conference Room", value: "CONFERENCE_ROOM", description: "Professional meeting space" },
    { label: "Study Room", value: "STUDY_ROOM", description: "Quiet study space" },
    { label: "Computer Lab", value: "COMPUTER_LAB", description: "Computer workstations" },
    { label: "Sports Facility", value: "SPORTS_FACILITY", description: "Sports and fitness" },
];

const UTILITY_TYPES: ChatOption[] = [
    { label: "Projector", value: "PROJECTOR", description: "Display equipment" },
    { label: "Sound System", value: "SOUND_SYSTEM", description: "Audio equipment" },
    { label: "Microphone", value: "MICROPHONE", description: "Microphones" },
    { label: "Whiteboard", value: "WHITEBOARD", description: "Whiteboard/board" },
    { label: "Laptop", value: "LAPTOP", description: "Laptop computer" },
    { label: "Camera", value: "CAMERA", description: "Camera equipment" },
    { label: "Table", value: "TABLE", description: "Tables" },
    { label: "Chair", value: "CHAIR", description: "Chairs" },
];

const CAPACITY_OPTIONS: ChatOption[] = [
    { label: "1-5 people", value: "5" },
    { label: "6-10 people", value: "10" },
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
    
    const sortedLocations = Array.from(locationSet)
        .filter(loc => loc && loc.trim())
        .sort();
    
    if (sortedLocations.length === 0) {
        return [
            { label: "Main Campus", value: "Main Campus" },
            { label: "IT Building", value: "IT Building" },
            { label: "Engineering Building", value: "Engineering Building" },
            { label: "Medical Center", value: "Medical Center" },
            { label: "Library", value: "Library" },
        ];
    }
    
    return sortedLocations.map(loc => ({ label: loc, value: loc }));
}

function checkTimeOverlap(requestStart: string, requestEnd: string, bookedStart: string, bookedEnd: string): boolean {
    const reqStart = parseInt(requestStart.split(":")[0]);
    const reqEnd = parseInt(requestEnd.split(":")[0]);
    const bookStart = parseInt(bookedStart.split(":")[0]);
    const bookEnd = parseInt(bookedEnd.split(":")[0]);
    
    return reqStart < bookEnd && reqEnd > bookStart;
}

function getBookedSlotsForResource(resource: Resource, date: string): { start: string; end: string }[] {
    const bookings = resource.bookings || [];
    return bookings
        .filter(b => b.status === "APPROVED" || b.status === "PENDING")
        .filter(b => {
            const bDate = b.startTime?.split('T')[0];
            return bDate === date;
        })
        .map(b => ({
            start: b.startTime?.split('T')[1]?.substring(0, 5) || "00:00",
            end: b.endTime?.split('T')[1]?.substring(0, 5) || "00:00"
        }));
}

async function fetchAndCheckAvailability(
    resourceId: string, 
    date: string
): Promise<{ available: boolean; bookedSlots: { start: string; end: string }[] }> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/resources/${resourceId}/availability?date=${date}`, {
            credentials: "include"
        });
        
        if (!res.ok) {
            return { available: true, bookedSlots: [] };
        }
        
        const data = await res.json();
        const conflicts = data.conflicts || [];
        const bookedSlots = conflicts.map((c: any) => ({
            start: c.startTime || "00:00",
            end: c.endTime || "00:00"
        }));
        
        return {
            available: data.available !== false,
            bookedSlots
        };
    } catch (error) {
        console.error("Failed to fetch availability:", error);
        return { available: true, bookedSlots: [] };
    }
}

function checkAvailabilityWithSlots(
    bookedSlots: { start: string; end: string }[], 
    startTime: string, 
    endTime: string
): { available: boolean; bookedSlot?: { start: string; end: string } } {
    for (const slot of bookedSlots) {
        if (checkTimeOverlap(startTime, endTime, slot.start, slot.end)) {
            return { available: false, bookedSlot: slot };
        }
    }
    
    return { available: true };
}

function checkAvailabilityForSlot(resource: Resource, date: string, startTime: string, endTime: string): { available: boolean; bookedSlot?: { start: string; end: string } } {
    const bookedSlots = getBookedSlotsForResource(resource, date);
    
    for (const slot of bookedSlots) {
        if (checkTimeOverlap(startTime, endTime, slot.start, slot.end)) {
            return { available: false, bookedSlot: slot };
        }
    }
    
    return { available: true };
}

function rankAndSelectFacility(resources: Resource[], criteria: {
    capacity?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
}): Resource[] {
    if (resources.length === 0) return [];
    
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
        
        if (criteria.date && criteria.startTime && criteria.endTime) {
            const availability = checkAvailabilityForSlot(resource, criteria.date, criteria.startTime, criteria.endTime);
            if (!availability.available) {
                score -= 200;
            }
        }
        
        return { resource, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.resource);
}

function findBestMatches(resources: Resource[], criteria: {
    category?: string;
    type?: string;
    location?: string;
    capacity?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
}): { available: Resource[]; booked: Resource[] } {
    let filtered = resources.filter(r => r.status === "ACTIVE");
    
    if (criteria.category) {
        filtered = filtered.filter(r => r.category === criteria.category);
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
    
    if (criteria.type) {
        filtered = filtered.filter(r => {
            const rType = r.resourceType || r.type || "";
            return rType.toUpperCase() === criteria.type!.toUpperCase();
        });
    }
    
    const ranked = rankAndSelectFacility(filtered, criteria);
    
    const available: Resource[] = [];
    const booked: Resource[] = [];
    
    for (const resource of ranked) {
        if (criteria.date && criteria.startTime && criteria.endTime) {
            const availability = checkAvailabilityForSlot(resource, criteria.date, criteria.startTime, criteria.endTime);
            if (availability.available) {
                available.push(resource);
            } else {
                booked.push(resource);
            }
        } else {
            available.push(resource);
        }
    }
    
    return { available: available.slice(0, 5), booked: booked.slice(0, 3) };
}

function findBestMatchesWithConflict(resources: Resource[], criteria: {
    category?: string;
    type?: string;
    location?: string;
    capacity?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
}): { available: Resource[]; booked: Resource[]; conflict: boolean; conflictResource?: { resource: Resource; bookedSlot?: { start: string; end: string } } } {
    let filtered = resources.filter(r => r.status === "ACTIVE");
    
    if (criteria.category) {
        filtered = filtered.filter(r => r.category === criteria.category);
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
    
    if (criteria.type) {
        filtered = filtered.filter(r => {
            const rType = r.resourceType || r.type || "";
            return rType.toUpperCase() === criteria.type!.toUpperCase();
        });
    }
    
    const ranked = rankAndSelectFacility(filtered, { capacity: criteria.capacity });
    
    const available: Resource[] = [];
    const booked: Resource[] = [];
    let conflictResource: { resource: Resource; bookedSlot?: { start: string; end: string } } | undefined;
    
    for (const resource of ranked) {
        if (criteria.date && criteria.startTime && criteria.endTime) {
            const availability = checkAvailabilityForSlot(resource, criteria.date, criteria.startTime, criteria.endTime);
            if (availability.available) {
                available.push(resource);
            } else {
                booked.push(resource);
                if (!conflictResource) {
                    conflictResource = { resource, bookedSlot: availability.bookedSlot };
                }
            }
        } else {
            available.push(resource);
        }
    }
    
    const hasConflict = available.length === 0 && booked.length > 0;
    
    return { 
        available: available.slice(0, 5), 
        booked: booked.slice(0, 3),
        conflict: hasConflict,
        conflictResource 
    };
}

type MatchResult = {
    available: Resource[];
    booked: Resource[];
    conflict: boolean;
    conflictResource?: { resource: Resource; bookedSlot?: { start: string; end: string } };
};

async function findBestMatchesWithAvailabilityCheck(resources: Resource[], criteria: {
    category?: string;
    type?: string;
    location?: string;
    capacity?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
}): Promise<MatchResult> {
    let filtered = resources.filter(r => r.status === "ACTIVE");
    
    if (criteria.category) {
        filtered = filtered.filter(r => r.category === criteria.category);
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
    
    if (criteria.type) {
        filtered = filtered.filter(r => {
            const rType = r.resourceType || r.type || "";
            return rType.toUpperCase() === criteria.type!.toUpperCase();
        });
    }
    
    const ranked = rankAndSelectFacility(filtered, { capacity: criteria.capacity });
    
    const available: Resource[] = [];
    const booked: Resource[] = [];
    let conflictResource: { resource: Resource; bookedSlot?: { start: string; end: string } } | undefined;
    
    for (const resource of ranked) {
        if (criteria.date && criteria.startTime && criteria.endTime && criteria.date !== "") {
            const availability = await fetchAndCheckAvailability(resource.id || resource._id || "", criteria.date);
            const check = checkAvailabilityWithSlots(availability.bookedSlots, criteria.startTime, criteria.endTime);
            if (check.available) {
                available.push(resource);
            } else {
                booked.push(resource);
                if (!conflictResource) {
                    conflictResource = { resource, bookedSlot: check.bookedSlot };
                }
            }
        } else {
            available.push(resource);
        }
    }
    
    const hasConflict = available.length === 0 && booked.length > 0;
    
    return { 
        available: available.slice(0, 5), 
        booked: booked.slice(0, 3),
        conflict: hasConflict,
        conflictResource 
    };
}

function buildRecommendationReason(resource: Resource, criteria: {
    category?: string;
    type?: string;
    location?: string;
    capacityLabel?: string;
}): string {
    const reasons: string[] = [];
    
    if (criteria.location) {
        reasons.push(`located at ${criteria.location}`);
    }
    
    if (criteria.type) {
        const typeLabel = FACILITY_TYPES.find(t => t.value === criteria.type)?.label || 
                         UTILITY_TYPES.find(t => t.value === criteria.type)?.label || 
                         criteria.type.replace(/_/g, ' ');
        reasons.push(`${typeLabel.toLowerCase()} type`);
    }
    
    if (criteria.capacityLabel && resource.capacity) {
        const requirement = criteria.capacityLabel.replace(" people", "").replace("+", "");
        reasons.push(`accommodates ${requirement}+ people`);
    }
    
    if (reasons.length === 0) {
        return "This facility matches your requirements.";
    }
    
    return "Matches your needs: " + reasons.join(", ") + ".";
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
    const [currentStep, setCurrentStep] = useState<BookingStep>("welcome");
    const [bookingData, setBookingData] = useState<BookingData>({
        category: "",
        type: "",
        location: "",
        date: "",
        startTime: "",
        endTime: "",
        capacity: 0,
        capacityLabel: "",
    });
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [timeError, setTimeError] = useState<string | null>(null);
    const [conversationStarted, setConversationStarted] = useState(false);
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
            text: "Hi, I'm FitFinder 👋\n\nI help you find the best-fit facility for your needs.",
            sender: "bot",
            timestamp: new Date(),
        };
        
        const categoryMsg: ChatMessage = {
            id: generateMessageId(),
            text: "What would you like to book?",
            sender: "bot",
            timestamp: new Date(),
            options: [
                { label: "Facilities", value: "FACILITY", description: "Rooms, halls, labs" },
                { label: "Utilities", value: "UTILITY", description: "Equipment, AV systems" },
            ],
        };
        
        setMessages([welcomeMsg, categoryMsg]);
        setCurrentStep("category");
        setBookingData({ category: "", type: "", location: "", date: "", startTime: "", endTime: "", capacity: 0, capacityLabel: "", amenities: [] });
        setSelectedAmenities([]);
        setTimeError(null);
        setConversationStarted(true);
    }, []);

    const resetConversation = useCallback(() => {
        setMessages([]);
        setCurrentStep("welcome");
        setBookingData({ category: "", type: "", location: "", date: "", startTime: "", endTime: "", capacity: 0, capacityLabel: "", amenities: [] });
        setSelectedAmenities([]);
        setTimeError(null);
        setConversationStarted(false);
        setTimeout(startConversation, 300);
    }, [startConversation]);

    useEffect(() => {
        if (!isOpen) {
            setMessages([]);
            setCurrentStep("welcome");
            return;
        }
        
        if (messages.length === 0) {
            startConversation();
        }
    }, [isOpen, startConversation]);

    const goToNextStep = useCallback((nextStep: BookingStep, botMessage: ChatMessage) => {
        setCurrentStep(nextStep);
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
    }, []);

    const processSelection = useCallback(async (option: ChatOption) => {
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
            goToNextStep("location", botMsg);
            setIsTyping(false);
            return;
        }

        if (currentStep === "location") {
            const locationVal = option.value;
            setBookingData(prev => ({ ...prev, location: locationVal }));
            
            if (currentBookingData.category === "FACILITY") {
                botMsg = {
                    id: generateMessageId(),
                    text: "What type of space would you like to book?",
                    sender: "bot",
                    timestamp: new Date(),
                    isTypePicker: true,
                };
                goToNextStep("facilityType", botMsg);
            } else {
                botMsg = {
                    id: generateMessageId(),
                    text: "What type of utility do you need?",
                    sender: "bot",
                    timestamp: new Date(),
                    isUtilityTypePicker: true,
                };
                goToNextStep("utilityType", botMsg);
            }
            setIsTyping(false);
            return;
        }

        if (currentStep === "facilityType") {
            setBookingData(prev => ({ ...prev, type: option.value }));
            botMsg = {
                id: generateMessageId(),
                text: "How many people will be using this facility?",
                sender: "bot",
                timestamp: new Date(),
                isCapacityPicker: true,
            };
            goToNextStep("capacity", botMsg);
            setIsTyping(false);
            return;
        }

        if (currentStep === "capacity") {
            const capacityLabel = option.label;
            setBookingData(prev => ({ ...prev, capacity: parseInt(option.value), capacityLabel }));
            botMsg = {
                id: generateMessageId(),
                text: "What date do you need it for?",
                sender: "bot",
                timestamp: new Date(),
                isDatePicker: true,
            };
            goToNextStep("date", botMsg);
            setIsTyping(false);
            return;
        }

        if (currentStep === "date") {
            const dateVal = option.value;
            setBookingData(prev => ({ ...prev, date: dateVal }));
            botMsg = {
                id: generateMessageId(),
                text: "What start time works for you?",
                sender: "bot",
                timestamp: new Date(),
                isStartTimePicker: true,
            };
            goToNextStep("startTime", botMsg);
            setIsTyping(false);
            return;
        }

        if (currentStep === "startTime") {
            const startTimeVal = option.value;
            
            const today = new Date();
            const todayStr = today.getFullYear() + '-' + 
                String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                String(today.getDate()).padStart(2, '0');
            const isToday = currentBookingData.date === todayStr;
            if (isToday) {
                const currentHour = new Date().getHours();
                const selectedHour = parseInt(startTimeVal.split(':')[0]);
                if (selectedHour <= currentHour) {
                    setTimeError("You cannot select a past time for today. Please choose a future time.");
                    setIsTyping(false);
                    return;
                }
            }
            
            setBookingData(prev => ({ ...prev, startTime: startTimeVal }));
            botMsg = {
                id: generateMessageId(),
                text: "What end time?",
                sender: "bot",
                timestamp: new Date(),
                isEndTimePicker: true,
            };
            goToNextStep("endTime", botMsg);
            setIsTyping(false);
            return;
        }

        if (currentStep === "endTime") {
            const endTimeVal = option.value;
            
            if (!validateTimeRange(currentBookingData.startTime, endTimeVal)) {
                setTimeError("End time must be later than start time.");
                setIsTyping(false);
                return;
}
             
            const today = new Date();
            const todayStr = today.getFullYear() + '-' + 
                String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                String(today.getDate()).padStart(2, '0');
            const isToday = currentBookingData.date === todayStr;
            if (isToday) {
                const currentHour = new Date().getHours();
                const selectedHour = parseInt(endTimeVal.split(':')[0]);
                if (selectedHour <= currentHour) {
                    setTimeError("You cannot select a past time for today. Please choose a future time.");
                    setIsTyping(false);
                    return;
                }
            }
            
            setBookingData(prev => ({ ...prev, endTime: endTimeVal }));
            
            setIsTyping(true);
            const matches = await findBestMatchesWithAvailabilityCheck(resources, {
                category: currentBookingData.category,
                type: currentBookingData.type,
                location: currentBookingData.location,
                capacity: currentBookingData.capacity,
                date: currentBookingData.date,
                startTime: currentBookingData.startTime,
                endTime: endTimeVal,
            });
            
            setCurrentStep("recommendation");
            
            if (matches.conflict) {
                const conflictRes = matches.conflictResource;
                const conflictMsg = conflictRes?.bookedSlot
                    ? `This room is the best option, but it is already booked from ${conflictRes.bookedSlot.start} to ${conflictRes.bookedSlot.end}. It will be free after ${conflictRes.bookedSlot.end}. What would you like to do?`
                    : "This facility is already booked during this time. What would you like to do?";
                botMsg = {
                    id: generateMessageId(),
                    text: conflictMsg,
                    sender: "bot",
                    timestamp: new Date(),
                    isBooked: true,
                    bookedSlot: conflictRes?.bookedSlot,
                    options: [
                        { label: "Try Different Time", value: "retry_time" },
                        { label: "See Alternatives", value: "view_alternative" },
                        { label: "Start Over", value: "start" },
                    ],
                };
                setMessages(prev => [...prev, botMsg]);
                setIsTyping(false);
                return;
            }
            
            if (matches.available.length === 0 && matches.booked.length === 0) {
                botMsg = {
                    id: generateMessageId(),
                    text: `I couldn't find any ${currentBookingData.category === "FACILITY" ? "facility" : "utility"} matching your requirements. Would you like to try a different location or start over?`,
                    sender: "bot",
                    timestamp: new Date(),
                    options: [
                        { label: "Start Over", value: "start" },
                    ],
                };
            } else if (matches.available.length > 0) {
                const topMatch = matches.available[0];
                const reason = buildRecommendationReason(topMatch, {
                    category: currentBookingData.category,
                    type: currentBookingData.type,
                    location: currentBookingData.location,
                    capacityLabel: currentBookingData.capacityLabel,
                });
                
                botMsg = {
                    id: generateMessageId(),
                    text: `Perfect! I found ${matches.available.length} available option${matches.available.length > 1 ? 's' : ''} for you. Here are the best matches:`,
                    sender: "bot",
                    timestamp: new Date(),
                    resources: matches.available,
                    recommendationReason: reason,
                    bookingData: { ...currentBookingData, endTime: endTimeVal },
                    alternativeResources: matches.booked.length > 0 ? matches.booked : undefined,
                };
            } else if (matches.booked.length > 0) {
                const topBooked = matches.booked[0];
                const availability = checkAvailabilityForSlot(topBooked, currentBookingData.date, currentBookingData.startTime, endTimeVal);
                const reason = buildRecommendationReason(topBooked, {
                    category: currentBookingData.category,
                    type: currentBookingData.type,
                    location: currentBookingData.location,
                    capacityLabel: currentBookingData.capacityLabel,
                });
                
                const bookedSlot = availability.bookedSlot;
                const freeAfter = bookedSlot ? bookedSlot.end : "the selected time ends";
                
                botMsg = {
                    id: generateMessageId(),
                    text: bookedSlot 
                        ? `${topBooked.resourceName || topBooked.name} is the best option for your needs, but it is already booked from ${bookedSlot.start} to ${bookedSlot.end}. It will be free after ${freeAfter}. What would you like to do?`
                        : "All matching facilities are booked for your selected time. Here are the options:",
                    sender: "bot",
                    timestamp: new Date(),
                    resources: [],
                    isBooked: true,
                    bookedSlot: bookedSlot,
                    recommendationReason: reason,
                    bookingData: { ...currentBookingData, endTime: endTimeVal, amenities: selectedAmenities },
                    alternativeResources: matches.booked,
                    options: [
                        { label: "Try Different Time", value: "retry_time" },
                        { label: "See Alternatives", value: "view_alternative" },
                        { label: "Start Over", value: "start" },
                    ],
                };
            }
            
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
            return;
        }

        if (currentStep === "recommendation") {
            if (option.value === "start" || option.value === "start_over") {
                resetConversation();
                setIsTyping(false);
                return;
            }

            if (option.value === "retry_time") {
                botMsg = {
                    id: generateMessageId(),
                    text: "Let's choose a different time. What start time works for you?",
                    sender: "bot",
                    timestamp: new Date(),
                    isStartTimePicker: true,
                };
                setCurrentStep("startTime");
                setMessages(prev => [...prev, botMsg]);
                setIsTyping(false);
                return;
            }

            if (option.value === "view_details") {
                const lastMsg = messages[messages.length - 1];
                const resource = lastMsg?.resource || (lastMsg?.resources && lastMsg.resources[0]);
                if (resource) {
                    onViewResource(resource, lastMsg.bookingData);
                }
                setIsTyping(false);
                return;
            }

            if (option.value === "book_now") {
                const lastMsg = messages[messages.length - 1];
                const resource = lastMsg?.resource || (lastMsg?.resources && lastMsg.resources[0]);
                if (resource) {
                    onBookResource(resource, lastMsg.bookingData);
                }
                setIsTyping(false);
                return;
            }

            if (option.value.startsWith("view_resource_")) {
                const resourceId = option.value.replace("view_resource_", "");
                const lastMsg = messages[messages.length - 1];
                const resource = lastMsg?.resources?.find(r => (r.id || r._id) === resourceId);
                if (resource) {
                    onViewResource(resource, lastMsg.bookingData);
                }
                setIsTyping(false);
                return;
            }

            if (option.value.startsWith("book_resource_")) {
                const resourceId = option.value.replace("book_resource_", "");
                const lastMsg = messages[messages.length - 1];
                const resource = lastMsg?.resources?.find(r => (r.id || r._id) === resourceId);
                if (resource) {
                    onBookResource(resource, lastMsg.bookingData);
                }
                setIsTyping(false);
                return;
            }

            if (option.value === "view_alternative") {
                const lastMsg = messages[messages.length - 1];
                const altResources = lastMsg?.alternativeResources;
                if (altResources && altResources.length > 0) {
                    const altResource = altResources[0];
                    const reason = buildRecommendationReason(altResource, {
                        category: currentBookingData.category,
                        type: currentBookingData.type,
                        location: currentBookingData.location,
                        capacityLabel: currentBookingData.capacityLabel,
                    });
                    botMsg = {
                        id: generateMessageId(),
                        text: "Here's an alternative that's available:",
                        sender: "bot",
                        timestamp: new Date(),
                        resource: altResource,
                        recommendationReason: reason,
                    };
                    setMessages(prev => [...prev, botMsg]);
                }
                setIsTyping(false);
                return;
            }

            botMsg = {
                id: generateMessageId(),
                text: "Would you like to start over or try different criteria?",
                sender: "bot",
                timestamp: new Date(),
                options: [
                    { label: "Start Over", value: "start" },
                ],
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
            return;
        }

        setIsTyping(false);
    }, [currentStep, resources, messages, goToNextStep, resetConversation, onViewResource, onBookResource]);

    const handleDateSelect = (date: string) => {
        setTimeError(null);
        processSelection({ label: date, value: date });
    };

    const handleStartTimeSelect = (time: string) => {
        setTimeError(null);
        processSelection({ label: time, value: time });
    };

    const handleEndTimeSelect = (time: string) => {
        if (!validateTimeRange(bookingData.startTime, time)) {
            setTimeError("End time must be later than start time.");
            return;
        }
        
        const isToday = bookingData.date === new Date().toISOString().split('T')[0];
        if (isToday) {
            const currentHour = new Date().getHours();
            const selectedHour = parseInt(time.split(':')[0]);
            if (selectedHour <= currentHour) {
                setTimeError("You cannot select a past time for today. Please choose a future time.");
                return;
            }
        }
        
        setTimeError(null);
        processSelection({ label: time, value: time });
    };

    const getValidStartTimes = (): string[] => {
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + 
            String(today.getMonth() + 1).padStart(2, '0') + '-' + 
            String(today.getDate()).padStart(2, '0');
        const isToday = bookingData.date === todayStr;
        if (!isToday) return TIME_SLOTS;
        
        const currentHour = new Date().getHours();
        return TIME_SLOTS.filter(t => parseInt(t.split(':')[0]) > currentHour);
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

    const handleViewDetails = (resource: Resource) => {
        const lastMsg = messages[messages.length - 1];
        onViewResource(resource, lastMsg?.bookingData);
    };

    const handleBookNow = (resource: Resource) => {
        const lastMsg = messages[messages.length - 1];
        const bookingData = lastMsg?.bookingData;
        
        if (bookingData?.date && bookingData?.startTime && bookingData?.endTime) {
            const availability = checkAvailabilityForSlot(
                resource, 
                bookingData.date, 
                bookingData.startTime, 
                bookingData.endTime
            );
            
            if (!availability.available && availability.bookedSlot) {
                const conflictMsg: ChatMessage = {
                    id: generateMessageId(),
                    text: `${resource.resourceName || resource.name} is the best option for your needs, but it is already booked from ${availability.bookedSlot.start} to ${availability.bookedSlot.end}. It will be free after ${availability.bookedSlot.end}. What would you like to do?`,
                    sender: "bot",
                    timestamp: new Date(),
                    isBooked: true,
                    bookedSlot: availability.bookedSlot,
                    options: [
                        { label: "Try Different Time", value: "retry_time" },
                        { label: "See Alternatives", value: "view_alternative" },
                        { label: "Start Over", value: "start" },
                    ],
                };
                setMessages(prev => [...prev, conflictMsg]);
                return;
            }
        }
        
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

    const renderRecommendationCards = (msg: ChatMessage) => {
        if (!msg.resources || msg.resources.length === 0) return null;

        return (
            <div className="mt-3 ml-10 space-y-3">
                {msg.resources.map((resource, idx) => (
                    <div key={resource.id || resource._id || idx} className="bg-slate-700/50 rounded-xl border border-slate-600/30 overflow-hidden">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-cyan-400" />
                                    <span className="text-xs font-semibold text-cyan-400">
                                        {idx === 0 ? "Best Match" : `Option ${idx + 1}`}
                                    </span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    resource.status === "ACTIVE" 
                                        ? "bg-emerald-500/20 text-emerald-400" 
                                        : "bg-red-500/20 text-red-400"
                                }`}>
                                    {resource.status === "ACTIVE" ? "Available" : resource.status}
                                </span>
                            </div>
                            
                            <h4 className="text-base font-bold text-white mb-1">
                                {resource.resourceName || resource.name}
                            </h4>
                            <div className="text-xs text-slate-400 mb-2">
                                {formatType(resource.resourceType || resource.type || "")} • {resource.category}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                <span>{getLocationDisplay(resource)}</span>
                            </div>
                            
                            {idx === 0 && msg.recommendationReason && (
                                <div className="text-xs text-slate-300 mb-2 italic">
                                    "{msg.recommendationReason}"
                                </div>
                            )}
                            
                            <div className="flex items-center gap-3 text-xs text-slate-300">
                                {msg.bookingData?.date && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-slate-500" />
                                        <span>{msg.bookingData.date}</span>
                                    </div>
                                )}
                                {msg.bookingData?.startTime && msg.bookingData?.endTime && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        <span>{msg.bookingData.startTime} - {msg.bookingData.endTime}</span>
                                    </div>
                                )}
                                {resource.category === "FACILITY" && (
                                    <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3 text-slate-500" />
                                        <span>Cap: {resource.capacity || "N/A"}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-3 pt-0 flex gap-2">
                            <button
                                onClick={() => handleViewDetails(resource)}
                                className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Info className="w-3.5 h-3.5" />
                                Details
                            </button>
                            <button
                                onClick={() => handleBookNow(resource)}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                Book Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderBookedRecommendation = (msg: ChatMessage) => {
        if (!msg.isBooked) return null;

        const hasAlternatives = msg.alternativeResources && msg.alternativeResources.length > 0;
        const bookedSlot = msg.bookedSlot;

        return (
            <div className="mt-3 ml-10">
                {bookedSlot && (
                    <div className="mb-3 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-sm text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                            This room is already booked from {bookedSlot.start} to {bookedSlot.end}. It will be free after {bookedSlot.end}.
                        </span>
                    </div>
                )}
                
                {hasAlternatives && (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-300">
                            {bookedSlot ? "Available alternatives:" : "Available alternatives for your selected time:"}
                        </p>
                        {msg.alternativeResources!.map((resource, idx) => (
                            <div key={resource.id || resource._id || idx} className="bg-slate-700/50 rounded-xl border border-slate-600/30 overflow-hidden">
                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-bold text-white">
                                            {resource.resourceName || resource.name}
                                        </h4>
                                        <span className="text-xs text-emerald-400">Available</span>
                                    </div>
                                    <div className="text-xs text-slate-400 mb-1">
                                        {getLocationDisplay(resource)}
                                    </div>
                                </div>
                                <div className="p-2 pt-0 flex gap-2">
                                    <button
                                        onClick={() => handleViewDetails(resource)}
                                        className="flex-1 px-2 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded-lg"
                                    >
                                        Details
                                    </button>
                                    <button
                                        onClick={() => handleBookNow(resource)}
                                        className="flex-1 px-2 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs rounded-lg"
                                    >
                                        Book
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!hasAlternatives && (
                    <div className="mt-3 p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-sm text-slate-400 text-center">
                            No alternative rooms available for this time slot.
                        </p>
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 w-[420px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[75vh] bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden z-50">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-cyan-600 to-blue-600">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">FitFinder</h3>
                        <p className="text-xs text-white/70">Smart facility assistant</p>
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
                                    {msg.text.split('\n').map((line, i) => (
                                        <span key={i}>
                                            {line}
                                            {i < msg.text.split('\n').length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {msg.sender === "bot" && (
                            <>
                                {msg.options && msg.options.length > 0 && (
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
                                            <div className="grid grid-cols-2 gap-2">
                                                {locationOptions.slice(0, 6).map((opt, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => processSelection(opt)}
                                                        disabled={isTyping}
                                                        className="text-left px-3 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        <MapPinned className="w-4 h-4 text-slate-400 shrink-0" />
                                                        <span className="text-sm text-white truncate">{opt.label}</span>
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
                                        {timeError && (
                                            <div className="mb-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                {timeError}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {getValidStartTimes().map((time, idx) => (
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

                                {msg.resources && msg.resources.length > 0 && renderRecommendationCards(msg)}
                                {msg.isBooked && renderBookedRecommendation(msg)}

                                {msg.resources && msg.resources.length > 0 && (
                                    <div className="mt-3 ml-10">
                                        <button
                                            onClick={() => processSelection({ label: "Start Over", value: "start" })}
                                            disabled={isTyping}
                                            className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Start Over
                                        </button>
                                    </div>
                                )}
                            </>
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

            {conversationStarted && messages.length > 1 && (
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