"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

interface RatingComponentProps {
    ticketId: string;
    userId: string;
    currentRating?: number;
    currentFeedback?: string;
    onRatingSubmitted?: () => void;
    apiUrl: string;
}

export default function RatingComponent({
    ticketId,
    userId,
    currentRating = 0,
    currentFeedback = "",
    onRatingSubmitted,
    apiUrl
}: RatingComponentProps) {
    const [rating, setRating] = useState(currentRating);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState(currentFeedback);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Swal.fire({
                title: "Rating Required",
                text: "Please select a star rating before submitting.",
                icon: "warning",
                background: 'var(--card-bg)',
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${apiUrl}/api/tickets/${ticketId}/rating?userId=${userId}&rating=${rating}&feedback=${encodeURIComponent(feedback)}`, {
                method: "POST",
                credentials: "include"
            });

            if (res.ok) {
                Swal.fire({
                    title: "Thank You!",
                    text: "Your feedback has been submitted successfully.",
                    icon: "success",
                    background: 'var(--card-bg)',
                    color: 'var(--foreground)',
                    customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                });
                onRatingSubmitted?.();
            } else {
                throw new Error("Failed to submit rating");
            }
        } catch {
            Swal.fire({
                title: "Error",
                text: "Failed to submit your feedback. Please try again.",
                icon: "error",
                background: 'var(--card-bg)',
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 p-4 bg-foreground/5 rounded-xl border border-border-main">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Rate Your Experience</h4>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 transition-transform hover:scale-110"
                        >
                            <Star
                                size={28}
                                className={`transition-colors ${
                                    star <= (hoverRating || rating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "fill-transparent text-slate-600"
                                }`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience with this resolution... (optional)"
                rows={3}
                className="w-full px-4 py-3 bg-card border border-border-main rounded-xl text-foreground placeholder-muted text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none"
            />

            <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="w-full px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-yellow-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {submitting ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Submitting...
                    </>
                ) : (
                    <>
                        <Star size={18} className="fill-white" />
                        Submit Rating
                    </>
                )}
            </button>
        </div>
    );
}
