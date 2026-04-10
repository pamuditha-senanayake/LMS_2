"use client";

import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { Activity, RefreshCw, Plus, Search, Building2, Calendar, Users, Package, BarChart3 } from "lucide-react";

interface Booking {
    id: string;
    resourceId: string;
    resourceName?: string;
    startTime: string;
    endTime: string;
    status: string;
    expectedAttendees: number;
}

interface Resource {
    id: string;
    resourceName: string;
    resourceType?: string;
    type?: string;
    category?: string;
    status?: string;
    capacity?: number;
    location?: string;
    building?: string;
    description?: string;
    amenities?: string[];
}

export default function AdminFacilities() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [locationFilter, setLocationFilter] = useState("ALL");

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const user = JSON.parse(storedUser);
                if (user.token) headers["Authorization"] = `Bearer ${user.token}`;
            }

            const [resourcesRes, bookingsRes] = await Promise.all([
                fetch(`${apiUrl}/api/resources`, { credentials: "include", headers }),
                fetch(`${apiUrl}/api/bookings?size=1000`, { credentials: "include", headers })
            ]);

            if (resourcesRes.ok) {
                const data = await resourcesRes.json();
                const transformed = data.reverse().map((r: any) => ({
                    ...r,
                    resourceName: r.resourceName || r.name,
                    resourceType: r.resourceType || r.type,
                }));
                setResources(transformed);
            }

            if (bookingsRes.ok) {
                const bookingData = await bookingsRes.json();
                setBookings(bookingData.content || []);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
            setError("Backend not reachable. Please start server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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
            background: '#0f172a',
            color: '#f8fafc',
            customClass: {
                popup: 'rounded-2xl border border-slate-700',
                confirmButton: 'px-6 py-2 rounded-lg font-bold text-xs uppercase',
                cancelButton: 'px-6 py-2 rounded-lg font-bold text-xs uppercase'
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
                        Swal.fire({ title: "Deleted!", icon: "success", background: '#0f172a', color: '#f8fafc' });
                        fetchData();
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
                    <label class="text-xs font-semibold text-slate-400">Location</label>
                    <select id="res-location" class="swal2-select text-sm bg-slate-800 text-white border-slate-600">
                        <option value="IT">IT</option>
                        <option value="Medicine">Medicine</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Architecture">Architecture</option>
                    </select>
                    <label class="text-xs font-semibold text-slate-400">Facility Type</label>
                    <select id="res-type" class="swal2-select text-sm bg-slate-800 text-white border-slate-600">
                        <option value="Lecture Hall">Lecture Hall</option>
                        <option value="Lab">Lab</option>
                        <option value="Meeting Room">Meeting Room</option>
                        <option value="Auditorium">Auditorium</option>
                    </select>
                    <label class="text-xs font-semibold text-slate-400">Name</label>
                    <input id="res-name" class="swal2-input text-sm bg-slate-800 text-white border-slate-600" placeholder="Main Hall Level 2">
                    <label class="text-xs font-semibold text-slate-400">Description</label>
                    <input id="res-desc" class="swal2-input text-sm bg-slate-800 text-white border-slate-600" placeholder="Large hall suitable for 200...">
                    <label class="text-xs font-semibold text-slate-400">Capacity</label>
                    <input type="number" id="res-capacity" class="swal2-input text-sm bg-slate-800 text-white border-slate-600" value="50">
                    <label class="text-xs font-semibold text-slate-400">Initial Status</label>
                    <select id="res-status" class="swal2-select text-sm bg-slate-800 text-white border-slate-600">
                        <option value="ACTIVE" selected>ACTIVE</option>
                        <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
                    </select>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#475569',
            confirmButtonText: 'Deploy Resource',
            background: '#0f172a',
            color: '#f8fafc',
            customClass: {
                popup: 'rounded-2xl border border-slate-700',
                confirmButton: 'px-6 py-2 rounded-lg font-bold text-xs uppercase',
                cancelButton: 'px-6 py-2 rounded-lg font-bold text-xs uppercase'
            },
            preConfirm: () => {
                const name = (document.getElementById('res-name') as HTMLInputElement).value;
                if (!name) { Swal.showValidationMessage("Name is required"); return false; }
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
                        Swal.fire({ title: "Deployed!", icon: "success", background: '#0f172a', color: '#f8fafc' });
                        fetchData();
                    } else {
                        Swal.fire({ title: "Failed", text: await res.text(), icon: "error", background: '#0f172a', color: '#f8fafc' });
                    }
                } catch {}
            }
        });
    };

    const handleToggleStatus = async (resource: Resource) => {
        const newStatus = resource.status === "ACTIVE" ? "OUT_OF_SERVICE" : "ACTIVE";
        const payload = {
            ...resource,
            status: newStatus,
            type: resource.resourceType || resource.type,
            category: resource.category || "FACILITY",
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
            if (res.ok) fetchData();
        } catch {}
    };

    const facilityBookingCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        bookings.forEach(b => {
            const id = b.resourceId;
            counts[id] = (counts[id] || 0) + 1;
        });
        return counts;
    }, [bookings]);

    const dayBookingCounts = useMemo(() => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const counts: Record<string, number> = {};
        days.forEach(d => counts[d] = 0);
        
        bookings.forEach(b => {
            if (b.startTime) {
                const date = new Date(b.startTime);
                if (!isNaN(date.getTime())) {
                    const dayName = days[date.getDay()];
                    counts[dayName] = (counts[dayName] || 0) + 1;
                }
            }
        });
        return counts;
    }, [bookings]);

    const topFacilities = useMemo(() => {
        return Object.entries(facilityBookingCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8)
            .map(([id, count]) => {
                const resource = resources.find(r => r.id === id);
                return {
                    id,
                    name: resource?.resourceName || id.slice(0, 8),
                    count
                };
            });
    }, [facilityBookingCounts, resources]);

    const maxFacilityCount = useMemo(() => Math.max(...topFacilities.map(f => f.count), 1), [topFacilities]);
    const maxDayCount = useMemo(() => Math.max(...Object.values(dayBookingCounts), 1), [dayBookingCounts]);

    const stats = {
        totalResources: resources.length,
        active: resources.filter(r => r.status === 'ACTIVE').length,
        maintenance: resources.filter(r => r.status === 'OUT_OF_SERVICE').length,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
    };

    const filteredResources = resources.filter(r => {
        const matchesSearch = !searchQuery || 
            r.resourceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "ALL" || r.resourceType === typeFilter;
        const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
        const matchesLocation = locationFilter === "ALL" || r.location === locationFilter;
        return matchesSearch && matchesType && matchesStatus && matchesLocation;
    });

    const uniqueTypes = useMemo(() => {
        const types = resources.map(r => r.resourceType).filter(Boolean);
        return [...new Set(types)];
    }, [resources]);

    const uniqueLocations = useMemo(() => {
        const locs = resources.map(r => r.location).filter(Boolean);
        return [...new Set(locs)];
    }, [resources]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Admin Facilities</h1>
                    <p className="text-sm text-muted">Module A – Facilities & Assets Catalogue</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border-main hover:border-primary text-foreground rounded-xl font-medium text-sm transition-all"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Sync
                    </button>
                    <button 
                        onClick={handleCreateResource}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium text-sm transition-all"
                    >
                        <Plus size={16} />
                        Add Resource
                    </button>
                </div>
            </div>

            {!loading && !error && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-card rounded-xl p-4 border border-border-main">
                            <div className="flex items-center gap-2 text-muted mb-1">
                                <Building2 size={16} />
                                <span className="text-xs font-medium">Total Resources</span>
                            </div>
                            <div className="text-2xl font-bold text-foreground">{stats.totalResources}</div>
                        </div>
                        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                            <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                <Activity size={16} />
                                <span className="text-xs font-medium">Active</span>
                            </div>
                            <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
                        </div>
                        <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/20">
                            <div className="flex items-center gap-2 text-rose-600 mb-1">
                                <Package size={16} />
                                <span className="text-xs font-medium">Out of Service</span>
                            </div>
                            <div className="text-2xl font-bold text-rose-600">{stats.maintenance}</div>
                        </div>
                        <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                            <div className="flex items-center gap-2 text-primary mb-1">
                                <Calendar size={16} />
                                <span className="text-xs font-medium">Total Bookings</span>
                            </div>
                            <div className="text-2xl font-bold text-primary">{stats.totalBookings}</div>
                        </div>
                        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                            <div className="flex items-center gap-2 text-amber-600 mb-1">
                                <Users size={16} />
                                <span className="text-xs font-medium">Pending</span>
                            </div>
                            <div className="text-2xl font-bold text-amber-600">{stats.pendingBookings}</div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-card rounded-xl p-5 border border-border-main">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 size={18} className="text-primary" />
                                <h3 className="font-semibold text-foreground">Most Booked Facilities</h3>
                            </div>
                            {topFacilities.length === 0 ? (
                                <p className="text-muted text-sm py-8 text-center">No booking data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {topFacilities.map((facility, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <span className="text-xs text-muted w-4">{idx + 1}.</span>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-foreground truncate max-w-[150px]">{facility.name}</span>
                                                    <span className="text-sm font-bold text-primary">{facility.count}</span>
                                                </div>
                                                <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-primary rounded-full transition-all"
                                                        style={{ width: `${(facility.count / maxFacilityCount) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-card rounded-xl p-5 border border-border-main">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar size={18} className="text-primary" />
                                <h3 className="font-semibold text-foreground">Bookings by Day</h3>
                            </div>
                            <div className="flex items-end justify-between gap-2 h-40">
                                {Object.entries(dayBookingCounts).map(([day, count]) => (
                                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-full bg-foreground/10 rounded-t-lg overflow-hidden relative flex-1">
                                            <div 
                                                className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all"
                                                style={{ height: `${(count / maxDayCount) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted truncate w-full text-center">{day.slice(0, 3)}</span>
                                        <span className="text-xs font-bold text-foreground">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="bg-card rounded-xl border border-border-main overflow-hidden">
                <div className="p-4 border-b border-border-main flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search resources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-foreground/5 border border-border-main rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 bg-foreground/5 border border-border-main rounded-lg text-foreground text-sm focus:outline-none"
                    >
                        <option value="ALL">All Types</option>
                        {uniqueTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-foreground/5 border border-border-main rounded-lg text-foreground text-sm focus:outline-none"
                    >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="OUT_OF_SERVICE">Out of Service</option>
                    </select>
                    <select
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="px-3 py-2 bg-foreground/5 border border-border-main rounded-lg text-foreground text-sm focus:outline-none"
                    >
                        <option value="ALL">All Locations</option>
                        {uniqueLocations.map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-muted">Loading...</div>
                ) : error ? (
                    <div className="p-8 text-center text-muted">{error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-foreground/5 border-b border-border-main">
                                    <th className="p-3 text-left text-xs font-semibold text-muted uppercase">Resource</th>
                                    <th className="p-3 text-left text-xs font-semibold text-muted uppercase">Type</th>
                                    <th className="p-3 text-left text-xs font-semibold text-muted uppercase">Location</th>
                                    <th className="p-3 text-left text-xs font-semibold text-muted uppercase">Capacity</th>
                                    <th className="p-3 text-left text-xs font-semibold text-muted uppercase">Status</th>
                                    <th className="p-3 text-right text-xs font-semibold text-muted uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredResources.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted">No resources found</td>
                                    </tr>
                                ) : (
                                    filteredResources.map((r) => (
                                        <tr key={r.id} className="border-b border-border-main/50 hover:bg-foreground/5">
                                            <td className="p-3">
                                                <div className="font-medium text-foreground">{r.resourceName}</div>
                                                <div className="text-xs text-muted">{r.description || 'No description'}</div>
                                            </td>
                                            <td className="p-3 text-foreground">{r.resourceType}</td>
                                            <td className="p-3 text-foreground">{r.location || 'N/A'}</td>
                                            <td className="p-3 text-foreground">{r.capacity || 0}</td>
                                            <td className="p-3">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                                    r.status === 'ACTIVE' 
                                                        ? 'bg-emerald-500/20 text-emerald-400' 
                                                        : 'bg-rose-500/20 text-rose-400'
                                                }`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleToggleStatus(r)}
                                                        className="px-3 py-1 text-xs font-medium bg-foreground/10 hover:bg-primary/20 text-foreground rounded-lg transition-all"
                                                    >
                                                        {r.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(r.id, r.resourceName)}
                                                        className="px-3 py-1 text-xs font-medium bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all"
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
        </div>
    );
}