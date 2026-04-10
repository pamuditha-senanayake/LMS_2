"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
    LayoutDashboard, 
    Shield, 
    BookOpen, 
    Building, 
    Bell, 
    ArrowRight, 
    Users,
    Zap,
    Globe,
    Cpu,
    ShieldCheck,
    Clock,
    ChevronRight
} from "lucide-react";

export default function Home() {
    const [user, setUser] = useState<{ id: string, name: string, email: string, roles: string[] } | null>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                
                if (userData.id) {
                    fetchNotifications(userData.id);
                }
            } catch {
                // ignore parse errors
            }
        }
    }, []);

    const fetchNotifications = async (userId: string) => {
        setLoadingNotifications(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/notifications/user/${userId}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Get latest 5
                    setNotifications(data.sort((a, b) => 
                        new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
                    ).slice(0, 5));
                }
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        } finally {
            setLoadingNotifications(false);
        }
    };

    const features = [
        {
            title: "Facility Hub",
            desc: "Dynamic booking system for lecture halls, laboratories, and specialized study spaces.",
            icon: Building,
            color: "text-primary"
        },
        {
            title: "Support Tickets",
            desc: "Direct line for institutional support. Log, track, and resolve campus issues efficiently.",
            icon: BookOpen,
            color: "text-brand-pink"
        },
        {
            title: "Smart Alerts",
            desc: "Real-time notifications for schedule adjustments, venue changes, and campus news.",
            icon: Bell,
            color: "text-brand-peach"
        },
        {
            title: "Unified Registry",
            desc: "A centralized catalogue for all institutional assets, facilities, and academic resources.",
            icon: Shield,
            color: "text-primary-light"
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-foreground overflow-x-hidden transition-colors duration-500">
            {/* Background Decorations */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-dark/10 blur-[150px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>


            <main className="relative z-10 pt-32">
                {user && (
                    <div className="max-w-7xl mx-auto px-8 mb-20 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        {/* Welcome Compartment */}
                        <div className="relative rounded-[2.5rem] p-8 md:p-10 border border-border-main bg-card backdrop-blur-3xl shadow-xl overflow-hidden group transition-all">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                                    <div className="w-20 h-20 rounded-[1.8rem] bg-background border border-border-main flex items-center justify-center p-1 shadow-xl relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-primary-light/10" />
                                        <div className="w-full h-full rounded-[1.6rem] bg-primary flex items-center justify-center overflow-hidden border border-white/20">
                                            <span className="text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="inline-flex items-center rounded-lg bg-emerald-500/10 px-3 py-1 border border-emerald-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2.5"></div>
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Service Status: Online</span>
                                        </div>
                                        <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
                                            Welcome back, <span className="text-primary">{user.name.split(' ')[0]}</span>
                                        </h2>
                                        <p className="text-muted text-sm font-medium opacity-80">
                                            Managing institution resources as <span className="text-foreground/80">{user.email}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center md:items-end gap-3 text-center md:text-right">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/50 border border-border-main">
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
                    </div>
                )}

                {/* Hero Section */}
                <section className="px-8 pt-10 pb-32 max-w-7xl mx-auto flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Zap size={14} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">v2.0 Performance Update is Live</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] text-foreground mb-8 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 uppercase italic">
                        Unified Campus <span className="text-foreground not-italic">Resource Hub</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-muted font-medium max-w-2xl balance leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
                        The central ecosystem for faculty and students. Manage facility bookings, academic assets, and support tickets from a single high-performance interface.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
                        {user ? (
                            null
                        ) : (
                            <>
                                <Link 
                                    href="/register"
                                    className="group relative bg-primary text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-2xl shadow-primary/20 overflow-hidden hover:bg-primary-dark active:scale-95"
                                >
                                    <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    <span className="relative">Start Institutional Account</span>
                                </Link>
                                <Link 
                                    href="/login"
                                    className="bg-card backdrop-blur-xl border border-border-main text-foreground px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-background transition-all duration-300"
                                >
                                    Sign In to Platform
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-32 w-full max-w-5xl">
                        {[
                            { val: "99.9%", label: "Uptime" },
                            { val: "50k+", label: "Active Users" },
                            { val: "20ms", label: "Latency" },
                            { val: "24/7", label: "Support" }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 group">
                                <span className="text-3xl font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{stat.val}</span>
                                <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Notifications Compartment */}
                {user && (
                    <div className="max-w-7xl mx-auto px-8 mb-20 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        <div className="relative rounded-[2.5rem] border border-border-main bg-card backdrop-blur-3xl shadow-xl overflow-hidden p-8 md:p-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <Bell size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">Latest Notifications</h3>
                                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">Stay updated with your activities</p>
                                    </div>
                                </div>
                                <Link href="/dashboard/notifications" className="text-[10px] font-bold text-primary hover:text-primary-light transition-colors uppercase tracking-[0.2em] flex items-center gap-2 group">
                                    View All <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            {loadingNotifications ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-4 opacity-50">
                                    <div className="w-8 h-8 border-2 border-border-main border-t-primary rounded-full animate-spin" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Syncing Feed...</span>
                                </div>
                            ) : notifications.length > 0 ? (
                                <div className="space-y-4">
                                    {notifications.map((notif, i) => (
                                        <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-foreground/5 border border-border-main hover:bg-foreground/[0.08] transition-all group">
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.isRead ? 'bg-muted/40' : 'bg-primary shadow-[0_0_10px_var(--primary)]'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground/90 font-medium leading-relaxed">{notif.message}</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                                                        {notif.type || 'Activity'}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-border-main" />
                                                    <span className="text-[10px] font-bold text-muted opacity-60 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Clock size={10} />
                                                        {new Date(notif.createdAt || notif.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-3xl bg-background border border-border-main flex items-center justify-center mb-4 text-muted">
                                        <Bell size={24} />
                                    </div>
                                    <h4 className="text-foreground font-bold mb-1">All Caught Up!</h4>
                                    <p className="text-sm text-muted">You don&apos;t have any recent notifications.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Features Section */}
                <section id="features" className="px-8 py-32 bg-foreground/2 border-y border-border-main">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col items-center text-center mb-20">
                            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 uppercase tracking-tight">Core Infrastructure</h2>
                            <p className="text-muted max-w-xl font-medium">Built on top of a resilient microservices architecture, CourseFlow provides the backbone for modern academic operations.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {features.map((f, i) => {
                                const Icon = f.icon;
                                return (
                                    <div key={i} className="glass-card p-8 rounded-3xl border border-border-main hover:border-primary/30 transition-all duration-500 group overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-primary/10 transition-colors" />
                                        <div className={`w-14 h-14 rounded-2xl bg-background border border-border-main flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 ${f.color}`}>
                                            <Icon size={28} />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
                                        <p className="text-muted text-sm leading-relaxed mb-6">{f.desc}</p>
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                                            Learn More <ArrowRight size={14} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Ecosystem Section */}
                <section id="ecosystem" className="px-8 py-32 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="relative">
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-pink/10 blur-3xl rounded-full" />
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full" />
                            <div className="glass-card p-8 rounded-[40px] border border-border-main shadow-2xl relative overflow-hidden bg-background/40">
                                <div className="grid grid-cols-2 gap-4">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="aspect-square rounded-3xl bg-background border border-border-main flex items-center justify-center group hover:border-primary/30 transition-all">
                                            {i === 1 && <Cpu className="text-primary-light" size={32} />}
                                            {i === 2 && <Globe className="text-primary" size={32} />}
                                            {i === 3 && <Users className="text-emerald-500" size={32} />}
                                            {i === 4 && <LayoutDashboard className="text-brand-pink" size={32} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight uppercase tracking-tight">Unified <br/><span className="text-primary">Ecosystem</span></h2>
                                <p className="text-muted text-lg leading-relaxed font-medium">
                                    Manage everything from one place. CourseFlow integrates disparate campus services into a single, high-performance interface, reducing operational friction by up to 60%.
                                </p>
                            </div>
                            
                            <ul className="space-y-4">
                                {[
                                    "Real-time resource availability tracking",
                                    "Automated conflict resolution in scheduling",
                                    "Secure multi-factor faculty authentication",
                                    "Integrated student ticketing and support"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-4 text-foreground/80 font-semibold group">
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                            <div className="w-1.5 h-1.5 bg-primary group-hover:bg-white rounded-full" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 active:scale-95">
                                Explore Architecture
                            </button>
                        </div>
                    </div>
                </section>

                <footer id="support" className="px-8 py-20 border-t border-border-main text-center">
                    <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
                        <div className="w-12 h-12 rounded-2xl bg-background border border-border-main flex items-center justify-center p-2">
                            <img src="/A.png" alt="Logo" className="w-full h-full object-contain grayscale opacity-30" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted">© 2026 Academic Systems Corp. All Technical Rights Reserved.</p>
                        <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-muted opacity-60">
                            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                            <a href="#" className="hover:text-primary transition-colors">Compliance</a>
                            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
