"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
    Users as UsersIcon, 
    Calendar, 
    LifeBuoy, 
    Building2, 
    ChevronRight, 
    ShieldCheck,
    Clock,
    Activity
} from "lucide-react";

export default function Dashboard() {
    const [user, setUser] = useState<{ name: string, email: string, roles: string[] } | null>(null);
    const [metrics, setMetrics] = useState({ users: 0, pendingBookings: 0, openTickets: 0, facilities: 0 });
    const [loadingMetrics, setLoadingMetrics] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUserAndMetrics = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const res = await fetch(apiUrl + "/api/auth/me", { credentials: "include" });
                
                if (!res.ok) throw new Error("Not authenticated");
                const data = await res.json();
                setUser(data);
                localStorage.setItem("user", JSON.stringify(data));

                if (data.roles && data.roles.includes("ROLE_ADMIN")) {
                    try {
                        const [uRes, , tRes, fRes, statsRes] = await Promise.all([
                            fetch(apiUrl + "/api/users", { credentials: "include" }),
                            fetch(apiUrl + "/api/bookings?size=1", { credentials: "include" }),
                            fetch(apiUrl + "/api/tickets?size=1", { credentials: "include" }),
                            fetch(apiUrl + "/api/resources", { credentials: "include" }),
                            fetch(apiUrl + "/api/bookings/stats", { credentials: "include" })
                        ]);

                        const usersData = uRes.ok ? await uRes.json() : [];
                        const ticketsData = tRes.ok ? await tRes.json() : [];
                        const facilitiesData = fRes.ok ? await fRes.json() : [];
                        const statsData = statsRes.ok ? await statsRes.json() : { pending: 0 };

                        const openTickets = Array.isArray(ticketsData) 
                            ? ticketsData.filter((t: any) => !t.status || t.status === "OPEN" || t.status === "IN_PROGRESS").length 
                            : 0;

                        setMetrics({
                            users: Array.isArray(usersData) ? usersData.length : 0,
                            pendingBookings: statsData.pending || 0,
                            openTickets,
                            facilities: Array.isArray(facilitiesData) ? facilitiesData.length : 0
                        });
                    } catch (e) {
                        console.error("Metric sync failed", e);
                    }
                }
            } catch {
                localStorage.removeItem("user");
                router.push("/login");
            } finally {
                setLoadingMetrics(false);
            }
        };

        fetchUserAndMetrics();
    }, [router]);

    if (!user) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading Profile...</div>;

    const isAdmin = user.roles && user.roles.includes("ROLE_ADMIN");

    return (
        <div className="relative min-h-screen w-full flex flex-col p-4 md:p-8 bg-background">
            {/* Background Decorations - Subtle */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-light/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                
                {/* Professional Hero Section */}
                <div className="relative rounded-[2.5rem] p-8 md:p-12 border border-border-main bg-card backdrop-blur-3xl shadow-xl overflow-hidden group">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-brand-peach p-[2px] shadow-xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                <div className="w-full h-full rounded-[2rem] bg-card flex items-center justify-center backdrop-blur-3xl relative">
                                    <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                                    <span className="text-4xl font-black text-primary relative z-10">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="inline-flex items-center rounded-lg bg-emerald-500/10 px-3 py-1 border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2.5"></div>
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Service Status: Online</span>
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
                                    Welcome back, <span className="text-primary">{user.name.split(' ')[0]}</span>
                                </h1>
                                <p className="text-muted text-sm md:text-base font-medium opacity-80">
                                    Managing institution resources as <span className="text-foreground/80">{user.email}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-3 text-center md:text-right">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-border-main">
                                <ShieldCheck size={14} className="text-primary" />
                                <span className="text-[11px] font-bold text-muted uppercase tracking-widest leading-none">
                                    {user.roles && user.roles.length > 0 ? user.roles[0].replace("ROLE_", "") : "USER"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted font-bold uppercase tracking-wider">
                                <Clock size={12} />
                                Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                </div>

                {isAdmin ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-1000 delay-150">
                        <div className="flex items-center gap-4">
                            <Activity size={20} className="text-primary" />
                            <h2 className="text-lg font-bold text-foreground tracking-wide uppercase">Platform Statistics</h2>
                            <div className="flex-1 h-[1px] bg-border-main" />
                        </div>
                        
                        {loadingMetrics ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted">
                                <div className="w-10 h-10 border-2 border-border-main border-t-primary rounded-full animate-spin" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Synchronizing Stats...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: "Total Users", val: metrics.users, color: "blue", path: "/dashboard/users", icon: UsersIcon, bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-500" },
                                    { label: "Bookings Queue", val: metrics.pendingBookings, color: "indigo", path: "/dashboard/admin-bookings", icon: Calendar, bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-500" },
                                    { label: "Resolved Help", val: metrics.openTickets, color: "rose", path: "/dashboard/admin-tickets", icon: LifeBuoy, bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-500" },
                                    { label: "Campus Assets", val: metrics.facilities, color: "emerald", path: "/dashboard/admin-facilities", icon: Building2, bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500" }
                                ].map((m, i) => (
                                    <div 
                                        key={i} 
                                        className="group relative p-6 rounded-[2rem] border border-border-main bg-card hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-lg overflow-hidden"
                                        onClick={() => router.push(m.path)}
                                    >
                                        <div className="relative z-10 flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <div className={`p-3 rounded-2xl bg-background border border-border-main group-hover:border-primary/50 transition-colors`}>
                                                    <m.icon size={20} className={`text-muted group-hover:text-primary transition-colors`} />
                                                </div>
                                                <div className={`p-1 px-2.5 rounded-full ${m.bg} ${m.border} text-[10px] font-black ${m.text} transition-colors uppercase tracking-tighter`}>
                                                    Live
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-3xl font-black text-foreground mb-1">{m.val}</div>
                                                <div className="text-[11px] font-bold text-muted uppercase tracking-widest">{m.label}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {[
                            { title: "Facilities Catalogue", desc: "Browse campus resources, check availability, and manage your booking schedule in one unified portal.", path: "/dashboard/facilities", icon: Building2, color: "indigo" },
                            { title: "Incident Support Hub", desc: "Report issues, request property maintenance, and track the progress of ongoing technical resolutions.", path: "/dashboard/tickets", icon: LifeBuoy, color: "rose" }
                        ].map((item, i) => (
                            <div 
                                key={i}
                                className="group p-10 rounded-[2.5rem] border border-border-main bg-card hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-xl relative overflow-hidden"
                                onClick={() => router.push(item.path)}
                             >
                                <div className="relative z-10 space-y-6">
                                    <div className={`w-12 h-12 rounded-2xl bg-background border border-border-main flex items-center justify-center group-hover:border-primary/50 transition-colors`}>
                                        <item.icon size={24} className={`text-muted group-hover:text-primary`} />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-muted text-base font-medium leading-relaxed opacity-80">
                                            {item.desc}
                                        </p>
                                    </div>
                                    <div className="pt-4 flex items-center gap-3 text-[11px] font-bold text-primary uppercase tracking-widest">
                                        Explore Service <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>


    );
}
