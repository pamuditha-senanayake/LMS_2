"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Bot, User, Loader2, Users as UsersIcon, MapPin, RotateCcw } from "lucide-react";

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
    campusName?: string;
    building?: string;
    roomNumber?: string;
    storageLocation?: string;
    description?: string;
}

interface ChatMessage {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
    options?: ChatOption[];
    resource?: Resource;
}

interface ChatOption {
    label: string;
    value: string;
}

type BookingStep = "start" | "category" | "type" | "resource" | "recommendation";

const UTILITY_TYPES: ChatOption[] = [
    { label: "Projector", value: "PROJECTOR" },
    { label: "Sound System", value: "SOUND_SYSTEM" },
    { label: "Microphone", value: "MICROPHONE" },
    { label: "Whiteboard", value: "WHITEBOARD" },
    { label: "Flags", value: "FLAGS" },
    { label: "Other", value: "OTHER" },
];

const FACILITY_TYPES: ChatOption[] = [
    { label: "Lecture Hall", value: "LECTURE_HALL" },
    { label: "Lab", value: "LAB" },
    { label: "Meeting Room", value: "MEETING_ROOM" },
    { label: "Auditorium", value: "AUDITORIUM" },
    { label: "Room", value: "ROOM" },
];

interface FacilityBookingChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    onViewResource: (resource: Resource) => void;
    onBookResource: (resource: Resource) => void;
    resources: Resource[];
}

let messageIdCounter = 0;
const generateMessageId = (): string => {
    messageIdCounter += 1;
    return `facility_msg_${Date.now()}_${messageIdCounter}`;
};

export default function FacilityBookingChatbot({ isOpen, onClose, onViewResource, onBookResource, resources }: FacilityBookingChatbotProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentStep, setCurrentStep] = useState<BookingStep>("start");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedType, setSelectedType] = useState<string>("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const selectedCategoryRef = useRef(selectedCategory);
    const selectedTypeRef = useRef(selectedType);

    useEffect(() => {
        selectedCategoryRef.current = selectedCategory;
    }, [selectedCategory]);

    useEffect(() => {
        selectedTypeRef.current = selectedType;
    }, [selectedType]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const startConversation = useCallback(() => {
        const welcomeMsg: ChatMessage = {
            id: generateMessageId(),
            text: "Hi! I'm your Booking Assistant. Let me help you find and book a resource. What would you like to book?",
            sender: "bot",
            timestamp: new Date(),
            options: [
                { label: "Utilities", value: "UTILITY" },
                { label: "Facilities", value: "FACILITY" },
            ],
        };
        setMessages([welcomeMsg]);
        setCurrentStep("category");
    }, []);

    const resetConversation = useCallback(() => {
        setMessages([]);
        setCurrentStep("start");
        setSelectedCategory("");
        setSelectedType("");
        setTimeout(startConversation, 300);
    }, [startConversation]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            startConversation();
        }
    }, [isOpen, startConversation, messages.length]);

    const getFilteredResources = useCallback((type: string): Resource[] => {
        return resources.filter(r => {
            const rType = r.resourceType || r.type || "";
            const matchesType = rType.toUpperCase().includes(type.toUpperCase()) || 
                             type.toUpperCase().includes(rType.toUpperCase().replace("_", " "));
            const isActive = r.status === "ACTIVE";
            return matchesType && isActive;
        });
    }, [resources]);

    const showRecommendation = useCallback((resource: Resource) => {
        const botText = `Great news! Here are the details:`;

        const botMsg: ChatMessage = {
            id: generateMessageId(),
            text: botText,
            sender: "bot",
            timestamp: new Date(),
            resource: resource,
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    }, []);

    const handleOptionSelect = useCallback(async (option: ChatOption) => {
        const userMsg: ChatMessage = {
            id: generateMessageId(),
            text: option.label,
            sender: "user",
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        await new Promise(resolve => setTimeout(resolve, 500));

        if (currentStep === "category") {
            setSelectedCategory(option.value);
            const optOptions = option.value === "UTILITY" ? UTILITY_TYPES : FACILITY_TYPES;
            const botMsg: ChatMessage = {
                id: generateMessageId(),
                text: `Great! What type of ${option.value.toLowerCase()} are you looking for?`,
                sender: "bot",
                timestamp: new Date(),
                options: optOptions,
            };
            setMessages(prev => [...prev, botMsg]);
            setCurrentStep("type");
        } else if (currentStep === "type") {
            setSelectedType(option.value);
            const filteredResources = getFilteredResources(option.value);
            
            if (filteredResources.length === 0) {
                const botMsg: ChatMessage = {
                    id: generateMessageId(),
                    text: `I couldn't find any available ${option.value.replace(/_/g, " ").toLowerCase()} at the moment. Would you like to try a different type?`,
                    sender: "bot",
                    timestamp: new Date(),
                    options: [
                        { label: "Try different type", value: "retry" },
                        { label: "Start over", value: "start" },
                    ],
                };
                setMessages(prev => [...prev, botMsg]);
            } else if (filteredResources.length === 1) {
                const resource = filteredResources[0];
                setCurrentStep("recommendation");
                showRecommendation(resource);
            } else {
                const topResources = filteredResources.slice(0, 3);
                const resourceOptions: ChatOption[] = topResources.map(r => ({
                    label: r.resourceName || r.name || "Unnamed",
                    value: r.id || r._id || "",
                }));
                const botMsg: ChatMessage = {
                    id: generateMessageId(),
                    text: `I found ${filteredResources.length} available ${option.value.replace(/_/g, " ").toLowerCase()}s. Which one interests you?`,
                    sender: "bot",
                    timestamp: new Date(),
                    options: resourceOptions,
                };
                setMessages(prev => [...prev, botMsg]);
                setCurrentStep("resource");
            }
        } else if (currentStep === "resource") {
            const resource = resources.find(r => (r.id || r._id) === option.value);
            if (resource) {
                setCurrentStep("recommendation");
                showRecommendation(resource);
            }
        } else if (currentStep === "recommendation") {
            if (option.value === "retry") {
                setCurrentStep("type");
                const optOptions = selectedCategoryRef.current === "UTILITY" ? UTILITY_TYPES : FACILITY_TYPES;
                const botMsg: ChatMessage = {
                    id: generateMessageId(),
                    text: "Which type would you like to try instead?",
                    sender: "bot",
                    timestamp: new Date(),
                    options: optOptions,
                };
                setMessages(prev => [...prev, botMsg]);
            } else if (option.value === "start") {
                resetConversation();
                setIsTyping(false);
                return;
            }
        }
        
        setIsTyping(false);
    }, [currentStep, getFilteredResources, resources, showRecommendation, resetConversation]);

    const handleViewDetails = useCallback((resource: Resource) => {
        onViewResource(resource);
    }, [onViewResource]);

    const handleBookNow = useCallback((resource: Resource) => {
        onBookResource(resource);
    }, [onBookResource]);

    const handleStartOver = useCallback(() => {
        setIsTyping(true);
        setTimeout(() => {
            resetConversation();
            setIsTyping(false);
        }, 300);
    }, [resetConversation]);

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[70vh] bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden z-50">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Booking Assistant</h3>
                        <p className="text-xs text-white/70">Guided booking</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                    <X className="w-5 h-5 text-white" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id}>
                        <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`flex items-end gap-2 max-w-[90%] ${
                                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                            }`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    msg.sender === "user" 
                                        ? "bg-indigo-500" 
                                        : "bg-emerald-500"
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

                        {msg.options && msg.options.length > 0 && (
                            <div className="mt-3 ml-10 flex flex-wrap gap-2">
                                {msg.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(opt)}
                                        disabled={isTyping}
                                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {msg.resource && (
                            <div className="mt-3 ml-10 bg-slate-700/50 rounded-xl border border-slate-600/30 overflow-hidden">
                                <div className="p-3 border-b border-slate-600/30">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white">{msg.resource.resourceName || msg.resource.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            msg.resource.status === "ACTIVE" 
                                                ? "bg-emerald-500/20 text-emerald-400" 
                                                : "bg-red-500/20 text-red-400"
                                        }`}>
                                            {msg.resource.status === "ACTIVE" ? "Available" : msg.resource.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {msg.resource.resourceType || msg.resource.type} • {msg.resource.category}
                                    </div>
                                </div>
                                <div className="p-3 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <UsersIcon className="w-4 h-4 text-slate-500" />
                                        <span>Capacity: {msg.resource.capacity || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <MapPin className="w-4 h-4 text-slate-500" />
                                        <span>{msg.resource.campusName || msg.resource.building || "Location TBD"}</span>
                                    </div>
                                    {msg.resource.description && (
                                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{msg.resource.description}</p>
                                    )}
                                </div>
                                <div className="p-3 pt-0 flex gap-2">
                                    <button
                                        onClick={() => handleViewDetails(msg.resource!)}
                                        className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => handleBookNow(msg.resource!)}
                                        className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="flex items-end gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-700">
                                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
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
