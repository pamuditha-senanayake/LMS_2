"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { 
    Pencil, 
    Trash2, 
    RotateCw, 
    User as UserIcon, 
    Shield, 
    Mail, 
    Users, 
    Search,
    MoreVertical
} from "lucide-react";

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/users`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                Swal.fire({
                    title: "Error",
                    text: "Failed to fetch users",
                    icon: "error",
                    background: 'var(--card-bg)',
                    color: 'var(--foreground)'
                });
            }
        } catch {
            Swal.fire({
                title: "Error",
                text: "Network error",
                icon: "error",
                background: 'var(--card-bg)',
                color: 'var(--foreground)'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleStyles = (role: string) => {
        switch (role) {
            case "ROLE_ADMIN":
                return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            case "ROLE_LECTURER":
                return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "ROLE_STUDENT":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            default:
                return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
        }
    };

    const handleEdit = (user: any) => {
        Swal.fire({
            html: `
                <div class="flex flex-col items-center gap-4 mb-8 text-center">
                    <img src="/A.png" class="w-16 h-16 rounded-2xl shadow-xl bg-card border border-border-main" />
                    <div>
                        <h2 class="text-2xl font-black text-foreground">Edit User Profile</h2>
                    </div>
                </div>
                <div class="flex flex-col gap-5 text-left px-2">
                    <div class="space-y-1.5">
                        <label class="text-sm font-semibold text-muted ml-1">Full Name</label>
                        <input id="swal-input1" 
                            class="w-full bg-background border border-border-main text-foreground rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-base" 
                            placeholder="Name" 
                            value="${user.name}">
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-sm font-semibold text-muted ml-1">Email Address</label>
                        <input id="swal-input2" 
                            class="w-full bg-background border border-border-main text-foreground rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-base" 
                            placeholder="Email" 
                            value="${user.email}">
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-sm font-semibold text-muted ml-1">Role Selection</label>
                        <select id="swal-input3" 
                            class="w-full bg-background border border-border-main text-foreground rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-base cursor-pointer">

                            <option value="ROLE_STUDENT" ${user.roles?.includes('ROLE_STUDENT') ? 'selected' : ''}>Student</option>
                            <option value="ROLE_LECTURER" ${user.roles?.includes('ROLE_LECTURER') ? 'selected' : ''}>Lecturer</option>
                            <option value="ROLE_ADMIN" ${user.roles?.includes('ROLE_ADMIN') ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Update User',
            cancelButtonText: 'Cancel',
            confirmButtonColor: 'var(--primary)',
            cancelButtonColor: 'transparent',
            background: 'var(--card-bg)',
            color: 'var(--foreground)',
            customClass: {
                popup: 'rounded-[2rem] border border-border-main glass-card p-8',
                confirmButton: 'px-8 py-3 rounded-xl font-bold text-base transition-all active:scale-95',
                cancelButton: 'px-8 py-3 text-muted font-semibold hover:text-foreground transition-all',
                actions: 'mt-8 gap-4'
            },
            preConfirm: () => {
                return {
                    name: (document.getElementById('swal-input1') as HTMLInputElement).value,
                    email: (document.getElementById('swal-input2') as HTMLInputElement).value,
                    roles: [(document.getElementById('swal-input3') as HTMLSelectElement).value]
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { name, email, roles } = result.value;
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const res = await fetch(`${apiUrl}/api/users/${user.id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        credentials: "include",
                        body: JSON.stringify({ name, email, roles })
                    });

                    if (res.ok) {
                        Swal.fire({ 
                            title: "Saved!", 
                            text: "User information updated.", 
                            icon: "success", 
                            background: '#1e293b', 
                            color: '#fff',
                            customClass: { popup: 'rounded-2xl' }
                        });
                        fetchUsers();
                    } else {
                        const errText = await res.text();
                        Swal.fire({ title: "Error", text: errText, icon: "error", background: 'var(--card-bg)', color: 'var(--foreground)' });
                    }
                } catch {
                    Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: 'var(--card-bg)', color: 'var(--foreground)' });
                }
            }
        })
    };

    const handleDelete = (id: string, name: string) => {
        Swal.fire({
            html: `
                <div class="flex flex-col items-center gap-4 py-4 text-center">
                    <img src="/A.png" class="w-20 h-20 rounded-2xl shadow-xl bg-card border border-border-main" />
                    <div class="space-y-2">
                        <h2 class="text-2xl font-bold text-foreground">Delete User</h2>
                        <p class="text-muted font-semibold text-base leading-relaxed px-4">
                            Are you sure you want to delete <span class="text-rose-500 font-bold">${name}</span>? This action cannot be undone.
                        </p>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Delete User',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: 'transparent',
            background: 'var(--card-bg)',
            color: 'var(--foreground)',
            customClass: {
                popup: 'rounded-[2rem] border border-border-main glass-card p-8',
                confirmButton: 'px-8 py-3 rounded-xl font-bold text-base transition-all active:scale-95',
                cancelButton: 'px-8 py-3 text-muted font-semibold hover:text-foreground transition-all',
                actions: 'mt-4 gap-4'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const res = await fetch(`${apiUrl}/api/users/${id}`, {
                        method: "DELETE",
                        credentials: "include"
                    });

                    if (res.ok) {
                        Swal.fire({ 
                            title: "Deleted", 
                            text: "User has been removed successfully.", 
                            icon: "success", 
                            background: '#1e293b', 
                            color: '#fff',
                            customClass: { popup: 'rounded-2xl' }
                        });
                        fetchUsers();
                    } else {
                        const errText = await res.text();
                        Swal.fire({ title: "Error", text: errText, icon: "error", background: 'var(--card-bg)', color: 'var(--foreground)' });
                    }
                } catch {
                    Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: 'var(--card-bg)', color: 'var(--foreground)' });
                }
            }
        });
    };

    return (
        <div className="p-6 pb-32 text-foreground max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Hero Banner Section */}
            <div className="relative w-full rounded-3xl overflow-hidden border border-border-main shadow-2xl bg-card group/banner">
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary-dark/10 to-brand-pink/20 opacity-40 transition-opacity duration-700 group-hover/banner:opacity-60" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 blur-[120px] -mr-48 -mt-48 rounded-full" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-pink/20 blur-[120px] -ml-48 -mb-48 rounded-full" />
                
                <div className="relative p-8 md:p-12 flex flex-col items-center text-center space-y-8">
                    <div className="space-y-4 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
                            <Shield size={12} />
                            Administrative Console
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground flex items-center justify-center gap-4">
                            <img src="/A.png" alt="CourseFlow" className="w-12 h-12 rounded-xl border border-border-main shadow-xl bg-card" />
                            <span>Course<span className="text-primary">Flow</span></span>
                        </h1>
                        <p className="text-muted text-sm md:text-base font-semibold max-w-lg mx-auto leading-relaxed mt-4">
                            Efficiently manage institution-wide access, monitor registry status, and maintain secure platform permissions from one unified platform.
                        </p>
                    </div>

                    {/* Integrated Search & Actions */}
                    <div className="w-full max-w-3xl flex flex-col md:flex-row items-center gap-4">
                        <div className="relative w-full group/search">
                            <div className="absolute inset-0 bg-indigo-500/30 blur-xl opacity-0 group-focus-within/search:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex items-center bg-background border border-border-main group-focus-within/search:border-primary rounded-2xl transition-all duration-300 shadow-2xl">
                                <Search className="absolute left-5 text-muted group-focus-within/search:text-primary" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Search by name, email or identifier..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-4 py-4 bg-transparent outline-none text-foreground placeholder:text-muted/60 text-sm font-bold"
                                />
                                <div className="pr-4 hidden md:flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-foreground/5 border border-border-main rounded text-[10px] font-black text-muted">⌘</kbd>
                                    <kbd className="px-2 py-1 bg-foreground/5 border border-border-main rounded text-[10px] font-black text-muted">K</kbd>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={fetchUsers}
                            disabled={loading}
                            className="shrink-0 flex items-center justify-center gap-3 px-8 py-4 btn-primary-action rounded-2xl font-black text-sm disabled:opacity-50"
                        >

                            <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
                            Reload
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative glass-card rounded-3xl overflow-hidden border border-border-main shadow-2xl bg-card">
                {loading && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <RotateCw className="text-indigo-400 animate-spin" size={40} />
                            <span className="text-xs font-black text-slate-200 uppercase tracking-[0.3em]">Synchronizing Registry</span>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-foreground/5 border-b border-border-main">
                                <th className="p-5 font-bold text-[13px] text-muted uppercase tracking-widest">Identify</th>
                                <th className="p-5 font-bold text-[13px] text-muted uppercase tracking-widest">Connect</th>
                                <th className="p-5 font-bold text-[13px] text-muted uppercase tracking-widest">Access Rights</th>
                                <th className="p-5 font-bold text-[13px] text-muted uppercase tracking-widest text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y border-border-main">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <div className="p-6 bg-foreground/5 rounded-full">
                                                <Users size={48} className="text-muted" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xl font-semibold">No results found</p>
                                                <p className="text-sm">Try adjusting your search query.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-foreground/[0.02] transition-colors duration-150">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-2xl bg-background flex items-center justify-center border border-border-main group-hover:border-primary/30 transition-colors shrink-0">
                                                    <UserIcon size={20} className="text-muted group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-foreground text-base truncate capitalize">{user.name}</span>
                                                    <span className="text-[11px] font-bold text-muted uppercase tracking-tighter">UID: {user.id.slice(-8)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2 text-foreground/80">
                                                    <Mail size={14} className="text-muted" />
                                                    <span className="text-sm font-medium">{user.email}</span>
                                                </div>
                                                <span className="text-[10px] text-muted ml-5 font-bold uppercase tracking-tight">Verified Account</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="inline-flex flex-wrap gap-2">
                                                {(user.roles || ["ROLE_STUDENT"]).map((role: string) => (
                                                    <span 
                                                        key={role} 
                                                        className={`text-[10px] font-black px-2.5 py-1 rounded-[10px] border border-border-main uppercase tracking-widest ${getRoleStyles(role)}`}
                                                    >
                                                        {role.replace("ROLE_", "")}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex justify-end gap-2 transition-all">
                                                <button 
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2.5 bg-foreground/5 hover:bg-primary/20 text-primary border border-border-main rounded-xl transition-all shadow-sm"
                                                    title="Edit Permissions"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(user.id, user.name)}
                                                    className="p-2.5 bg-foreground/5 hover:bg-rose-500/20 text-rose-500 border border-border-main hover:border-rose-500/30 rounded-xl transition-all shadow-sm"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Stats Footer */}
                {!loading && (
                    <div className="bg-foreground/5 p-4 border-t border-border-main flex items-center justify-between">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                            Total Campus Entities: {filteredUsers.length}
                        </p>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-2 text-[10px] font-black text-muted uppercase">
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                                Admins: {users.filter(u => u.roles?.includes("ROLE_ADMIN")).length}
                            </span>
                            <span className="flex items-center gap-2 text-[10px] font-black text-muted uppercase">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                Users: {users.filter(u => !u.roles?.includes("ROLE_ADMIN")).length}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
