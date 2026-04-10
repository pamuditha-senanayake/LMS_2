"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
}

const FACILITY_RESPONSES: Record<string, string[]> = {
    "available": [
        "We have various facilities including lecture halls, laboratories, and study spaces. You can browse them on this page!",
        "Our campus has multiple resources available. Check the cards above to see what's currently available for booking.",
    ],
    "book": [
        "To book a facility, click on any facility card and fill in the booking form with your date, time, and purpose.",
        "Booking is easy! Just select a facility, choose your preferred date and time slots, and submit your request.",
    ],
    "booking": [
        "To book a facility, click on any facility card and fill in the booking form with your date, time, and purpose.",
        "Booking requests are typically reviewed within 24 hours. You'll receive an email notification once approved.",
    ],
    "help": [
        "I can help you with:\n• Finding available facilities\n• Understanding booking process\n• Troubleshooting booking issues\n• Resource information",
        "Need help with booking? Just tell me what you're looking for and I'll guide you through the process!",
    ],
    "type": [
        "We have several resource types: Lecture Halls, Labs, Studios, Meeting Rooms, and Study Spaces.",
        "Our facilities include various types like lecture halls for large groups, labs for practical sessions, and quiet study areas.",
    ],
    "time": [
        "Booking time slots are available from 8:00 AM to 6:00 PM. You can select start and end times when booking.",
        "Our facilities are available during operating hours. Select your preferred time slot when making a booking.",
    ],
    "cancel": [
        "To cancel a booking, go to My Bookings page and click delete on your pending request.",
        "You can manage your bookings from the My Bookings page. Pending bookings can be cancelled before they're approved.",
    ],
    "status": [
        "After booking, your request status can be: PENDING (waiting for approval), APPROVED (confirmed), or REJECTED (not available).",
        "Check your booking status in the My Bookings page. Green means approved, yellow means pending!",
    ],
    "problem": [
        "If you're having trouble booking, try: 1) Checking the date is in the future 2) Ensuring the time slot is available 3) Logging in properly",
        "Common booking issues include: overlapping times, insufficient capacity, or the facility being under maintenance.",
    ],
    "capacity": [
        "Each facility has a maximum capacity listed on its card. Make sure your expected attendee count fits!",
        "The capacity shown on each facility is the maximum number of people it can accommodate.",
    ],
    "default": [
        "I'm here to help with facilities and booking! Ask me about:\n• Available resources\n• How to book\n• Booking status\n• Troubleshooting",
        "Thanks for chatting! I can help you find and book facilities on campus. What would you like to know?",
    ],
};

const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [keyword, responses] of Object.entries(FACILITY_RESPONSES)) {
        if (lowerMessage.includes(keyword)) {
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }
    
    return FACILITY_RESPONSES["default"][Math.floor(Math.random() * FACILITY_RESPONSES["default"].length)];
};

interface FacilityChatbotProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FacilityChatbot({ isOpen, onClose }: FacilityChatbotProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: "Hi! I'm your Facilities Assistant. I can help you find resources, understand the booking process, or answer any questions about our facilities. What would you like to know?",
            sender: "bot",
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = () => {
        if (!inputText.trim() || isTyping) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: "user",
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText("");
        setIsTyping(true);

        setTimeout(() => {
            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: getBotResponse(userMessage.text),
                sender: "bot",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        }, 800 + Math.random() * 700);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[70vh] bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden z-50">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Facilities Helper</h3>
                        <p className="text-xs text-white/70">Ask me about booking</p>
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
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`flex items-end gap-2 max-w-[85%] ${
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
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                msg.sender === "user"
                                    ? "bg-indigo-500 text-white rounded-br-md"
                                    : "bg-slate-700 text-slate-100 rounded-bl-md"
                            }`}>
                                {msg.text}
                            </div>
                        </div>
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

            <div className="p-4 border-t border-slate-700">
                <div className="flex items-center gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask about facilities..."
                        disabled={isTyping}
                        className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-sm disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim() || isTyping}
                        className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}