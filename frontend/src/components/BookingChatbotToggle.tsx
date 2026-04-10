"use client";

import { MessageCircle, X } from "lucide-react";

interface BookingChatbotToggleProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function BookingChatbotToggle({ isOpen, onToggle }: BookingChatbotToggleProps) {
    return (
        <button
            onClick={onToggle}
            className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg z-50 ${
                isOpen
                    ? "bg-slate-700 hover:bg-slate-600"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            } shadow-emerald-500/25 hover:shadow-emerald-500/40`}
        >
            {isOpen ? (
                <X className="w-6 h-6 text-white" />
            ) : (
                <MessageCircle className="w-6 h-6 text-white" />
            )}
        </button>
    );
}