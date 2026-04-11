"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Activity, RefreshCw, Plus } from "lucide-react";

export default function AdminFacilities() {
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchResources = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            console.log("Fetching from:", `${apiUrl}/api/resources`);
            const res = await fetch(`${apiUrl}/api/resources`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                const transformed = data.reverse().map((r: any) => ({
                    ...r,
                    resourceName: r.resourceName || r.name,
                    resourceType: r.resourceType || r.type,
                    location: r.location || r.building || ""
                }));
                setResources(transformed);
            } else {
                setError("Failed to load resources");
            }
        } catch (err) {
            console.error("Failed to fetch resources", err);
            setError("Backend not reachable. Please start server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        Swal.fire({
            title: 'Delete Resource?',
            text: `Are you sure you want to permanently delete "${name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Yes, delete',
            background: 'var(--card-bg)',
            color: 'var(--foreground)',
            customClass: {
                popup: 'glass-card border-none rounded-[2rem]',
                confirmButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs',
                cancelButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const res = await fetch(`${apiUrl}/api/resources/${id}`, {
                        method: "DELETE",
                        credentials: "include"
                    });
                    if (res.ok) {
                        Swal.fire({
                            title: "Deleted!", 
                            icon: "success", 
                            background: '#1e293b', 
                            color: '#fff',
                            customClass: { popup: 'rounded-2xl' }
                        });
                        fetchResources();
                    }
                } catch {}
            }
        });
    };

    const handleCreateResource = () => {
        Swal.fire({
            title: 'Register New Resource',
            html: `
                <div class="flex flex-col gap-3 text-left">
                    <label class="text-sm font-semibold text-foreground/70">Location</label>
                    <select id="res-location" class="swal2-select !w-11/12 !mx-auto text-sm">
                        <option value="IT">IT</option>
                        <option value="Medicine">Medicine</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Architecture">Architecture</option>
                    </select>
                    
                    <label class="text-sm font-semibold text-foreground/70">Facility Type</label>
                    <select id="res-type" class="swal2-select !w-11/12 !mx-auto text-sm">
                        <option value="Lecture Hall">Lecture Hall</option>
                        <option value="Lab">Lab</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Recreational">Recreational</option>
                    </select>

                    <label class="text-sm font-semibold text-foreground/70">Name</label>
                    <input id="res-name" class="swal2-input !w-11/12 !mx-auto" placeholder="Main Hall Level 2">

                    <label class="text-sm font-semibold text-foreground/70">Description</label>
                    <input id="res-desc" class="swal2-input !w-11/12 !mx-auto" placeholder="Large hall suitable for 200...">

                    <label class="text-sm font-semibold text-foreground/70">Capacity</label>
                    <input type="number" id="res-capacity" class="swal2-input !w-11/12 !mx-auto" placeholder="200" value="50">

                    <label class="text-sm font-semibold text-foreground/70">Initial Status</label>
                    <select id="res-status" class="swal2-select !w-11/12 !mx-auto text-sm">
                        <option value="ACTIVE" selected>ACTIVE - Ready for booking</option>
                        <option value="OUT_OF_SERVICE">OUT OF SERVICE - Under maintenance</option>
                    </select>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: 'var(--primary)',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Deploy Facility',
            background: 'var(--card-bg)',
            color: 'var(--foreground)',
            customClass: {
                popup: 'glass-card border-none rounded-[2rem]',
                confirmButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs',
                cancelButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs'
            },
            preConfirm: () => {
                const name = (document.getElementById('res-name') as HTMLInputElement).value;
                if (!name) { Swal.showValidationMessage("Facility Name is required"); return false; }
                return {
                    resourceName: name,
                    resourceType: (document.getElementById('res-type') as HTMLSelectElement).value,
                    description: (document.getElementById('res-desc') as HTMLInputElement).value,
                    capacity: parseInt((document.getElementById('res-capacity') as HTMLInputElement).value) || 0,
                    status: (document.getElementById('res-status') as HTMLSelectElement).value,
                    resourceCode: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
                    location: (document.getElementById('res-location') as HTMLSelectElement).value,
                    category: "FACILITY"
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const res = await fetch(`${apiUrl}/api/resources`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(result.value)
                    });
                    if (res.ok) {
                        Swal.fire({ 
                            title: "Deployed!", 
                            icon: "success", 
                            background: '#1e293b', 
                            color: '#fff',
                            customClass: { popup: 'rounded-2xl' }
                        });
                        fetchResources();
                    } else {
                        Swal.fire({ 
                            title: "Failed", 
                            text: await res.text(), 
                            icon: "error", 
                            background: 'var(--card-bg)', 
                            color: 'var(--foreground)',
                            customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                        });
                    }
        } catch {}
            }
        });
    };

    const handleToggleStatus = async (resource: any) => {
        const newStatus = resource.status === "ACTIVE" ? "OUT_OF_SERVICE" : "ACTIVE";
        const payload = {
            ...resource,
            status: newStatus,
            type: resource.resourceType || resource.type,
            category: resource.category || (resource.type?.startsWith("PROJECTOR") || resource.type?.startsWith("SOUND") || resource.type?.startsWith("MICROPHONE") || resource.type?.startsWith("WHITEBOARD") || resource.type?.startsWith("FLAGS") || resource.type?.startsWith("OTHER") ? "UTILITY" : "FACILITY"),
        };
        delete (payload as any).resourceType;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/resources/${resource.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            if (res.ok) fetchResources();
        } catch {}
    };

    const stats = {
        total: resources.length,
        active: resources.filter(r => r.status === 'ACTIVE').length,
        maintenance: resources.filter(r => r.status === 'OUT_OF_SERVICE').length,
        lectureHalls: resources.filter(r => r.resourceType?.includes('Lecture')).length,
        labs: resources.filter(r => r.resourceType?.includes('Lab')).length,
    };

    return (
        <div className="p-6 text-foreground max-w-7xl mx-auto space-y-6">
            {/* Hero Banner Section */}
            <div className="relative w-full rounded-3xl overflow-hidden border border-border-main shadow-2xl bg-card group/banner">
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-brand-pink/10 opacity-40 transition-opacity duration-700 group-hover/banner:opacity-60" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] -mr-48 -mt-48 rounded-full" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-pink/10 blur-[120px] -ml-48 -mb-48 rounded-full" />
                
                <div className="relative p-8 md:p-10 flex flex-col items-center text-center space-y-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
                            <Activity size={12} />
                            Institution Facility Management
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase italic leading-none">
                            Facility <span className="text-primary not-italic">Management</span>
                        </h1>
                        <p className="text-muted text-sm md:text-base font-semibold max-w-lg mx-auto leading-relaxed">
                            Deploy, configure, and maintain institution assets. Manage environmental status and capacity for campus resources.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-foreground/5 backdrop-blur-sm rounded-xl p-4 border border-border-main">
                            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                            <div className="text-xs text-muted font-medium">Total</div>
                        </div>
                        <div className="bg-emerald-500/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20">
                            <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
                            <div className="text-xs text-emerald-600/70 font-medium">Active</div>
                        </div>
                        <div className="bg-rose-500/10 backdrop-blur-sm rounded-xl p-4 border border-rose-500/20">
                            <div className="text-2xl font-bold text-rose-600">{stats.maintenance}</div>
                            <div className="text-xs text-rose-600/70 font-medium">Under Repair</div>
                        </div>
                        <div className="bg-primary/10 backdrop-blur-sm rounded-xl p-4 border border-primary/20">
                            <div className="text-2xl font-bold text-primary">{stats.lectureHalls}</div>
                            <div className="text-xs text-primary/70 font-medium">Theatres</div>
                        </div>
                        <div className="bg-brand-peach/10 backdrop-blur-sm rounded-xl p-4 border border-brand-peach/20">
                            <div className="text-2xl font-bold text-brand-peach">{stats.labs}</div>
                            <div className="text-xs text-brand-peach/70 font-medium">Laboratories</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-4">
                        <button 
                            onClick={fetchResources}
                            disabled={loading}
                            className="flex items-center justify-center gap-3 px-8 py-3 bg-card border border-border-main hover:border-primary text-foreground rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            {loading ? "Syncing..." : "Sync Resources"}
                        </button>
                        <button 
                            onClick={handleCreateResource}
                            className="flex items-center justify-center gap-3 px-8 py-3 btn-primary-action rounded-2xl font-bold text-sm"
                        >

                            <Plus size={18} />
                            Deploy New Facility
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-muted py-10 font-medium">Syncing resources...</div>
            ) : error ? (
                <div className="text-center py-16 bg-card rounded-2xl border border-border-main">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Connection Error</h3>
                    <p className="text-muted mb-6">{error}</p>
                    <button 
                        onClick={fetchResources}
                        className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="bg-card rounded-2xl overflow-hidden border border-border-main shadow-xl">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-foreground/5 border-b border-border-main">
                                <th className="p-4 font-bold text-foreground/80">Name / Spec</th>
                                <th className="p-4 font-bold text-foreground/80">Campus</th>
                                <th className="p-4 font-bold text-foreground/80">Condition</th>
                                <th className="p-4 font-bold text-foreground/80 text-right">Administrative Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resources.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted">
                                        No resources registered on campus.
                                    </td>
                                </tr>
                            ) : (
                                resources.map((r) => (
                                    <tr key={r.id} className="border-b border-border-main/50 hover:bg-foreground/5 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-foreground flex items-center gap-2">
                                                {r.resourceName}
                                                <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">{r.resourceCode}</span>
                                            </div>
                                            <div className="text-sm text-foreground/80 mt-1 font-medium leading-relaxed">{r.description || 'No description attached'}</div>
                                            <div className="mt-2 text-xs text-primary font-black uppercase tracking-wider">Type: {r.resourceType} | Cap: {r.capacity}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-foreground/80 text-sm font-medium">{r.location || "N/A"}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-black px-2 py-1 flex items-center w-max gap-1.5 rounded-full border ${r.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                {r.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-3 flex-wrap">
                                                <button 
                                                    onClick={() => handleToggleStatus(r)}
                                                    className="px-3 py-1.5 text-xs font-bold bg-background border border-border-main hover:border-primary text-foreground rounded-xl transition-all active:scale-95"
                                                >
                                                    {r.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(r.id, r.resourceName)}
                                                    className="px-3 py-1.5 text-xs font-bold bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl transition-all border border-rose-500/20 active:scale-95"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
