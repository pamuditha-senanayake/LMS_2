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
    const [isTyping, setIsTyping] = useState(false);
    const [input, setInput] = useState("");
    const [conversationStarted, setConversationStarted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const generateMessageId = () => Math.random().toString(36).substring(7);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (!conversationStarted && isOpen) {
            setMessages([
                {
                    id: generateMessageId(),
                    text: "Hello! I'm FitFinder, your AI-powered booking assistant. 🤖\n\nI can help you find facilities, check availability, and suggest the best spots for your events across the campus.\n\nHow can I help you today?",
                    sender: "bot",
                    timestamp: new Date(),
                }
            ]);
            setConversationStarted(true);
        }
    }, [isOpen, conversationStarted]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMessageText = input.trim();
        const userMsg: ChatMessage = {
            id: generateMessageId(),
            text: userMessageText,
            sender: "user",
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/chatbot/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessageText }),
                credentials: "include"
            });

            if (!res.ok) throw new Error("Failed to reach AI service");

            const data = await res.json();
            
            // Transform resources and extract booking metadata
            const transformedResources = (data.resources || []).map((r: any) => ({
                ...r,
                resourceName: r.resourceName || r.name,
                resourceType: r.resourceType || r.type,
                location: r.location || r.campusLocation?.buildingName || r.building || "",
                campusLocation: r.campusLocation || {
                    campusName: r.campusName || "",
                    buildingName: r.building || "",
                    roomNumber: r.roomNumber || "",
                },
            }));

            // Create bookingData if date/time info was extracted by the AI
            let bookingData: BookingData | undefined = undefined;
            if (data.date && data.startTime && data.endTime) {
                bookingData = {
                    date: data.date,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    category: transformedResources[0]?.category || "FACILITY",
                    type: transformedResources[0]?.resourceType || "GENERAL",
                    location: transformedResources[0]?.location || "",
                    capacity: 0,
                    capacityLabel: "",
                };
            }

            const botMsg: ChatMessage = {
                id: generateMessageId(),
                text: data.response || "I found some results for you:",
                sender: "bot",
                timestamp: new Date(),
                resources: transformedResources,
                bookingData: bookingData,
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error: any) {
            const errorMsg: ChatMessage = {
                id: generateMessageId(),
                text: "I'm having a bit of trouble connecting to my AI core. 🔌 Please make sure the backend is running and try again.",
                sender: "bot",
                timestamp: new Date(),
                error: error.message
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleViewDetails = (resource: Resource, bookingData?: BookingData) => {
        onViewResource(resource, bookingData);
    };

    const handleBookNow = (resource: Resource, bookingData?: BookingData) => {
        onBookResource(resource, bookingData);
    };

    const handleStartOver = () => {
        setMessages([
            {
                id: generateMessageId(),
                text: "Hello! I'm FitFinder, your AI-powered booking assistant. 🤖\n\nI can help you find facilities, check availability, and suggest the best spots for your events across the campus.\n\nHow can I help you today?",
                sender: "bot",
                timestamp: new Date(),
            }
        ]);
    };

    const getEndTimeOptions = (): string[] => {
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
                                onClick={() => handleViewDetails(resource, msg.bookingData)}
                                className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Info className="w-3.5 h-3.5" />
                                Details
                            </button>
                            <button
                                onClick={() => handleBookNow(resource, msg.bookingData)}
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
                                        onClick={() => handleViewDetails(resource, msg.bookingData)}
                                        className="flex-1 px-2 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded-lg"
                                    >
                                        Details
                                    </button>
                                    <button
                                        onClick={() => handleBookNow(resource, msg.bookingData)}
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
                                        : "bg-slate-700 text-slate-100 rounded-bl-md shadow-sm border border-slate-600/50"
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

                        {msg.sender === "bot" && msg.resources && msg.resources.length > 0 && renderRecommendationCards(msg)}
                        {msg.sender === "bot" && msg.isBooked && renderBookedRecommendation(msg)}
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="flex items-end gap-2">
                            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-700 border border-slate-600/50">
                                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-slate-800 border-t border-slate-700 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your request here..."
                        disabled={isTyping}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="p-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 text-white rounded-xl transition-all shadow-lg"
                        title="Send message"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex justify-between items-center px-1">
                    <button
                        onClick={handleStartOver}
                        disabled={isTyping}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset Chat
                    </button>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        AI Powered Assistant
                    </div>
                </div>
            </div>
        </div>
    );
}