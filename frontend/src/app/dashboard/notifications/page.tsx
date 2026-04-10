"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function Notifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async (userId: string) => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/notifications/user/${userId}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
        } catch {
            console.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const res = await fetch(`${apiUrl}/api/auth/me`, { credentials: "include" });
                if (res.ok) {
                    const user = await res.json();
                    if (user.id) fetchNotifications(user.id);
                    else setLoading(false);
                } else {
                    setLoading(false);
                }
            } catch {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const handleMarkAsRead = async (id: string, e: any, userId: string) => {
        e.stopPropagation();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/notifications/${id}/read`, {
                method: "PATCH",
                credentials: "include"
            });
            if (res.ok) {
                fetchNotifications(userId);
            }
        } catch {
            Swal.fire({ 
                title: "Error", 
                text: "Network Error", 
                icon: "error", 
                background: 'var(--card-bg)', 
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
        }
    };

    return (
        <div className="p-6 text-foreground max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-10">
                Alerts & <span className="text-primary">Notifications</span>
            </h1>

            {loading ? (
                <div className="text-center text-muted py-10">Checking notifications...</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {notifications.length === 0 ? (
                        <div className="text-center text-muted p-8 bg-card rounded-2xl border border-border-main">
                            All caught up! No notifications.
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.id} className={`p-5 rounded-2xl border transition-all ${n.isRead ? 'bg-card/50 border-border-main' : 'bg-card border-primary/50 shadow-lg shadow-primary/5'}`}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>}
                                            <h3 className={`font-bold ${n.isRead ? 'text-foreground/70' : 'text-primary'}`}>{n.title}</h3>
                                            <span className="text-xs text-muted ml-auto md:ml-2 font-medium">{new Date(n.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-foreground/80 text-sm leading-relaxed">{n.message}</p>
                                    </div>
                                    {!n.isRead && (
                                        <button 
                                            onClick={(e) => {
                                                const user = JSON.parse(localStorage.getItem("user") || "{}");
                                                handleMarkAsRead(n.id, e, user.userId || user.id);
                                            }}
                                            className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-dark text-white rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 whitespace-nowrap"
                                        >
                                            Mark as Read
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
