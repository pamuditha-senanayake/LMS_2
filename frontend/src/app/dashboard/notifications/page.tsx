"use client";
 
import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { Trash2, CheckCheck, Bell } from "lucide-react";

export default function Notifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const getAuthHeaders = () => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user.token) {
                return {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                };
            }
        }
        return {
            "Content-Type": "application/json"
        };
    };

    const fetchNotifications = useCallback(async (uId: string) => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/notifications/user/${uId}`, { 
                headers: getAuthHeaders(),
                credentials: "include" 
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            } else {
                console.error("Failed to fetch notifications:", res.status);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const res = await fetch(`${apiUrl}/api/auth/me`, { 
                    headers: getAuthHeaders(),
                    credentials: "include" 
                });
                if (res.ok) {
                    const user = await res.json();
                    if (user.id) {
                        setUserId(user.id);
                        fetchNotifications(user.id);
                    }
                    else setLoading(false);
                } else {
                    // Fallback to local storage if /auth/me fails but user is in storage
                    const storedUser = localStorage.getItem("user");
                    if (storedUser) {
                        const user = JSON.parse(storedUser);
                        const id = user.id || user.userId;
                        if (id) {
                            setUserId(id);
                            fetchNotifications(id);
                            return;
                        }
                    }
                    setLoading(false);
                }
            } catch {
                setLoading(false);
            }
        };
        loadUser();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id: string, e: any) => {
        e.stopPropagation();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/notifications/${id}/read`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                credentials: "include"
            });
            if (res.ok && userId) {
                fetchNotifications(userId);
            } else {
                const errorText = await res.text();
                throw new Error(errorText || "Failed to mark as read");
            }
        } catch (err: any) {
            Swal.fire({ 
                title: "Error", 
                text: err.message || "Network Error", 
                icon: "error", 
                background: 'var(--card-bg)', 
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!userId) {
            Swal.fire({ title: "Error", text: "User not identified", icon: "error" });
            return;
        }
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/notifications/user/${userId}/read-all`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                credentials: "include"
            });
            if (res.ok) {
                fetchNotifications(userId);
                Swal.fire({
                    title: "Success",
                    text: "All notifications marked as read",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                    background: 'var(--card-bg)',
                    color: 'var(--foreground)',
                    customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                });
            } else {
                const errorText = await res.text();
                throw new Error(errorText || "Failed to mark all as read");
            }
        } catch (err: any) {
            Swal.fire({ 
                title: "Error", 
                text: err.message || "Network Error", 
                icon: "error",
                background: 'var(--card-bg)',
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
        }
    };

    const handleDeleteNotification = async (id: string, e: any) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: "Delete Notification?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#ef4444",
            background: 'var(--card-bg)',
            color: 'var(--foreground)',
            customClass: { popup: 'glass-card border-none rounded-[2rem]' }
        });

        if (result.isConfirmed) {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const res = await fetch(`${apiUrl}/api/notifications/${id}`, {
                    method: "DELETE",
                    headers: getAuthHeaders(),
                    credentials: "include"
                });
                if (res.ok && userId) {
                    fetchNotifications(userId);
                } else {
                    const errorText = await res.text();
                    throw new Error(errorText || "Failed to delete notification");
                }
            } catch (err: any) {
                Swal.fire({ 
                    title: "Error", 
                    text: err.message || "Network Error", 
                    icon: "error",
                    background: 'var(--card-bg)',
                    color: 'var(--foreground)',
                    customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                });
            }
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-6 text-foreground max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
                    Alerts & <span className="text-primary">Notifications</span>
                </h1>
                
                {notifications.length > 0 && notifications.some(n => !n.isRead) && (
                    <button 
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl font-bold transition-all active:scale-95 text-sm"
                    >
                        <CheckCheck size={18} />
                        Mark All as Read
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center text-muted py-10 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    Checking notifications...
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {notifications.length === 0 ? (
                        <div className="text-center text-muted p-16 bg-card rounded-[2.5rem] border border-border-main flex flex-col items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center text-muted/30">
                                <Bell size={40} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-xl font-bold text-foreground">All clear!</p>
                                <p>You have no new alerts at the moment.</p>
                            </div>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.id} className={`group p-6 rounded-[2rem] border transition-all duration-300 ${n.isRead ? 'bg-card/40 border-border-main' : 'bg-card border-primary/30 shadow-xl shadow-primary/5 hover:border-primary/50'}`}>
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="flex-1 w-full">
                                        <div className="flex flex-wrap items-center gap-3 mb-3">
                                            {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"></span>}
                                            <h3 className={`text-lg font-black tracking-tight ${n.isRead ? 'text-foreground/60' : 'text-foreground'}`}>{n.title}</h3>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted/60 bg-foreground/5 px-3 py-1 rounded-full transition-colors group-hover:bg-foreground/10">
                                                {formatDate(n.createdAt)}
                                            </span>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${n.isRead ? 'text-foreground/40' : 'text-foreground/70'}`}>{n.message}</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 ml-sm-auto">
                                        {!n.isRead && (
                                            <button 
                                                onClick={(e) => handleMarkAsRead(n.id, e)}
                                                className="px-5 py-2.5 text-xs font-black bg-primary hover:bg-primary-dark text-white rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 whitespace-nowrap uppercase tracking-widest"
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => handleDeleteNotification(n.id, e)}
                                            className="p-3 text-muted/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all active:scale-90"
                                            title="Delete notification"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
