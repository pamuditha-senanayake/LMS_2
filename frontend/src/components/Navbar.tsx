"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { 
    LayoutDashboard, 
    Building, 
    Ticket, 
    Bell, 
    Users, 
    LogOut, 
    Home as HomeIcon, 
    Menu, 
    X,
    ChevronRight,
    ChevronDown,
    LogIn,
    UserPlus,
    User,
    Sun,
    Moon,
    Calendar
} from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    // Sync theme state from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        window.dispatchEvent(new Event("theme-update"));
    };

    const fetchNotifications = () => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                if (userData.id) {
                    fetch(`${apiUrl}/api/notifications/user/${userData.id}`, { credentials: "include" })
                        .then(res => res.json())
                        .then(data => {
                            if (Array.isArray(data)) {
                                setUnreadCount(data.filter((n: any) => !n.isRead).length);
                            }
                        })
                        .catch(() => {});
                }
            } catch {
                // ignore parse errors
            }
        }
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setIsAdmin(userData.roles?.includes("ROLE_ADMIN"));
            } catch {
                // ignore parse errors
            }
        }

        fetchNotifications();
        const notificationInterval = setInterval(fetchNotifications, 10000);

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        window.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("notification-update", fetchNotifications);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("notification-update", fetchNotifications);
            clearInterval(notificationInterval);
        };
    }, [pathname, apiUrl]);

    useEffect(() => {
        if (isAdmin && pathname === "/") {
            router.push("/dashboard");
        }
    }, [isAdmin, pathname, router]);

    const handleLogout = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            await fetch(`${apiUrl}/api/auth/logout`, { method: "POST", credentials: "include" });
        } catch {
            // ignore network errors
        }
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    // Configuration for Links
    const rawLinks = [
        { name: "Home", path: "/", icon: HomeIcon },
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "Facilities", path: "/dashboard/facilities", icon: Building },
        { name: "My Bookings", path: "/dashboard/bookings", icon: Calendar },
        { name: "Support", path: "/dashboard/tickets", icon: Ticket },
        { name: "Alerts", path: "/dashboard/notifications", icon: Bell },
    ];

    // Students/Lecturers don't need "Dashboard" in Navbar (they use the Homepage button/status)
    const navLinks = isAdmin 
        ? rawLinks 
        : rawLinks.filter(link => link.name !== "Dashboard");

    if (isAdmin) {
        navLinks.push({ name: "Management", path: "/dashboard/users", icon: Users });
    }

    // Routing Logic for Visibility
    const isDashboard = pathname.startsWith("/dashboard");
    const isAuthPage = pathname === "/login" || pathname === "/register";

    // Hide Navbar for Admins in Dashboard (they have Sidebar)
    if (isAdmin && isDashboard) return null;
    
    // Hide for Auth Pages
    if (isAuthPage) return null;

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
            scrolled || isDashboard 
            ? "h-20 bg-background/80 backdrop-blur-2xl border-b border-border-main" 
            : "h-24 bg-transparent"
        }`}>
            <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
                {/* Logo Section */}
                <div className="flex items-center gap-10">
                    <Link href="/" className="flex items-center gap-3 group active:scale-95 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border-main flex items-center justify-center p-1.5 shadow-2xl group-hover:border-primary transition-colors">
                            <img src="/A.png" alt="Logo" className="w-[85%] h-[85%] object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl leading-none font-black uppercase tracking-tighter text-foreground transition-colors">
                                CourseFlow
                            </span>
                            <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">Institutional Portal</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.path;
                            const Icon = link.icon;
                            return (
                                <Link 
                                    key={link.path} 
                                    href={link.path}
                                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300
                                    ${isActive 
                                        ? "bg-primary/10 text-primary border border-primary/20" 
                                        : "text-muted hover:text-primary hover:bg-primary/5 border border-transparent"}
                                `}
                                >
                                    <Icon size={16} strokeWidth={2.5} />
                                    {link.name}
                                    {link.name === "Alerts" && unreadCount > 0 && (
                                        <span className="ml-1 bg-rose-500 text-white text-[9px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-black animate-pulse">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all group active:scale-95
                                ${!user 
                                    ? "btn-primary-action border-transparent" 
                                    : (isDropdownOpen 
                                        ? "bg-primary/10 border-primary/40 text-foreground shadow-lg shadow-primary/5" 
                                        : "bg-card border-border-main text-muted hover:border-primary/30 hover:text-primary")
                                }
                            `}
                        >
                            {user ? (
                                <>
                                    <div className="hidden sm:flex flex-col items-end text-right">
                                        <span className="text-xs font-bold leading-tight text-foreground">{user.name}</span>
                                        <span className="text-[9px] font-black opacity-70 uppercase tracking-widest mt-0.5 text-primary">
                                            {isAdmin ? "Administrator" : "Student Portal"}
                                        </span>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors sm:hidden">
                                        <User size={16} />
                                    </div>
                                    <ChevronDown size={14} className={`transition-transform duration-300 text-muted group-hover:text-primary ${isDropdownOpen ? "rotate-180" : ""}`} />
                                </>
                            ) : (
                                <>
                                    <span className="text-xs font-black uppercase tracking-widest text-foreground">Account</span>
                                    <ChevronDown size={14} className={`transition-transform duration-300 text-muted group-hover:text-primary ${isDropdownOpen ? "rotate-180" : ""}`} />
                                </>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-3 w-64 bg-card backdrop-blur-3xl border border-border-main rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 z-[150]">
                                {user ? (
                                    <div className="p-2">
                                        <div className="px-4 py-4 border-b border-border-main mb-1 bg-foreground/5 rounded-t-xl">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1.5 opacity-80">Active Session</p>
                                            <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                                            <p className="text-[10px] text-muted truncate mt-0.5 font-medium">{user.email || 'authenticated'}</p>
                                        </div>
                                        
                                        <div className="h-px bg-border-main my-1 mx-2" />

                                        <button 
                                            onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-all"
                                        >
                                            <LogOut size={18} />
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-2">
                                        <Link 
                                            href="/login" 
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[11px] font-bold text-muted hover:text-primary hover:bg-primary/5 transition-all"
                                        >
                                            <LogIn size={18} />
                                            Sign In
                                        </Link>
                                        <Link 
                                            href="/register" 
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all mt-1 shadow-xl active:scale-95 btn-primary-action"
                                        >
                                            <UserPlus size={18} strokeWidth={3} />
                                            Register Now
                                        </Link>
                                    </div>
                                )}

                                <div className="h-px bg-border-main mx-2 my-1" />
                                <div className="p-2">
                                    <button 
                                        onClick={toggleTheme}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-bold text-muted hover:text-primary hover:bg-primary/5 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                        </div>
                                        <div className={`w-8 h-4 rounded-full p-1 transition-colors duration-300 ${theme === 'light' ? 'bg-primary' : 'bg-border-main'}`}>
                                            <div className={`w-2 h-2 rounded-full bg-white transition-transform duration-300 ${theme === 'light' ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button 
                        className="lg:hidden p-3 bg-card border border-border-main rounded-xl text-foreground hover:bg-primary hover:text-white transition-colors shadow-xl"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[90] bg-background/98 backdrop-blur-3xl pt-28 px-6 lg:hidden animate-in slide-in-from-top duration-500">
                    <div className="flex flex-col gap-3">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.path;
                            const Icon = link.icon;
                            return (
                                <Link 
                                    key={link.path} 
                                    href={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center justify-between p-5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all
                                        ${isActive 
                                            ? "bg-primary text-white shadow-xl shadow-primary/20" 
                                            : "bg-card text-muted hover:text-foreground border border-border-main active:bg-foreground/5"}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <Icon size={20} />
                                        {link.name}
                                    </div>
                                    <ChevronRight size={16} className={isActive ? "opacity-100" : "opacity-30"} />
                                </Link>
                            );
                        })}
                        
                        {!user && (
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <Link 
                                    href="/login" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-5 rounded-2xl bg-card text-center font-bold uppercase text-xs tracking-widest border border-border-main text-foreground"
                                >
                                    Login
                                </Link>
                                <Link 
                                    href="/register" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-5 rounded-2xl bg-white text-black text-center font-bold uppercase text-xs tracking-widest"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                        
                        {user && (
                            <button 
                                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                className="flex items-center gap-4 p-5 rounded-2xl bg-rose-500/10 text-rose-500 font-bold uppercase text-sm tracking-widest border border-rose-500/20 mt-8"
                            >
                                <LogOut size={20} />
                                Sign Out
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
