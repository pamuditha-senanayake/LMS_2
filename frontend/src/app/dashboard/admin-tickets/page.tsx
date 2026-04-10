"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import { Activity, Star } from "lucide-react";

export default function AdminTickets() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        dateFrom: '',
        dateTo: '',
        search: ''
    });
    const [resources, setResources] = useState<any[]>([]);
    const resourcesRef = useRef(resources);
    
    useEffect(() => {
        resourcesRef.current = resources;
    }, [resources]);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const fetchTickets = useCallback(async (resourceData?: any[]) => {
        const currentResources = resourceData !== undefined ? resourceData : resourcesRef.current;
        
        try {
            if (resourceData === undefined) {
                setRefreshing(true);
            }
            
            const res = await fetch(`${apiUrl}/api/tickets`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                const sortedTickets = data.sort((a: any, b: any) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                
                const ticketsWithAttachments = await Promise.all(
                    sortedTickets.map(async (ticket: any) => {
                        const attRes = await fetch(`${apiUrl}/api/tickets/${ticket.id}/attachments`, { credentials: "include" });
                        const resourceDisplay = currentResources.find((r: any) => r.id === ticket.resourceId);
                        
                        let ticketRating = null;
                        if ((ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && ticket.reportedById) {
                            try {
                                const ratingRes = await fetch(`${apiUrl}/api/tickets/${ticket.id}/rating?userId=${ticket.reportedById}`, { credentials: "include" });
                                if (ratingRes.ok) {
                                    ticketRating = await ratingRes.json();
                                }
                            } catch {
                                console.error("Failed to fetch rating");
                            }
                        }
                        
                        return { 
                            ...ticket, 
                            attachments: attRes.ok ? await attRes.json() : [],
                            resourceDisplay: resourceDisplay 
                                ? `${resourceDisplay.resourceCode} - ${resourceDisplay.resourceName}` 
                                : ticket.resourceId || 'General',
                            hasFeedback: ticketRating?.feedback ? true : false
                        };
                    })
                );
                setTickets(ticketsWithAttachments);
            }
        } catch {
            console.error("Failed to fetch tickets");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/resources`, { credentials: "include" });
                if (res.ok) {
                    const resourceData = await res.json();
                    setResources(resourceData);
                    return resourceData;
                }
            } catch {
                console.error("Failed to fetch resources");
            }
            return [];
        };

        const init = async () => {
            const resourceData = await fetchResources();
            await fetchTickets(resourceData);
        };
        init();
    }, [fetchTickets, apiUrl]);

    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'OPEN').length,
        inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
        resolved: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
        critical: tickets.filter(t => t.priority === 'CRITICAL').length,
    };

    const isOverdue = (ticket: any) => {
        if (!ticket.createdAt || ticket.status === 'RESOLVED' || ticket.status === 'REJECTED' || ticket.status === 'CLOSED') return false;
        const hours = (Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);
        const thresholds: Record<string, number> = { 'CRITICAL': 1, 'HIGH': 4, 'MEDIUM': 24, 'LOW': 72 };
        return hours > (thresholds[ticket.priority] || 24);
    };

    const filteredTickets = tickets.filter(ticket => {
        if (filters.status && ticket.status !== filters.status) return false;
        if (filters.priority && ticket.priority !== filters.priority) return false;
        if (filters.search) {
            const search = filters.search.toLowerCase();
            if (!ticket.title?.toLowerCase().includes(search) &&
                !ticket.description?.toLowerCase().includes(search) &&
                !ticket.id?.toLowerCase().includes(search)) return false;
        }
        if (filters.dateFrom) {
            const ticketDate = new Date(ticket.createdAt);
            const fromDate = new Date(filters.dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (ticketDate < fromDate) return false;
        }
        if (filters.dateTo) {
            const ticketDate = new Date(ticket.createdAt);
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (ticketDate > toDate) return false;
        }
        return true;
    });

    const hasActiveFilters = filters.status || filters.priority || filters.dateFrom || filters.dateTo || filters.search;

    const clearFilters = () => {
        setFilters({ status: '', priority: '', dateFrom: '', dateTo: '', search: '' });
    };

    const processStatusChange = async (id: string, status: string, note: string) => {
        try {
            const url = new URL(`${apiUrl}/api/tickets/${id}/status`);
            url.searchParams.append("status", status);
            url.searchParams.append("adminId", "Admin");
            url.searchParams.append("note", note);
            const res = await fetch(url.toString(), { method: "PATCH", credentials: "include" });
            if (res.ok) {
                Swal.fire({ 
                    title: "Updated!", 
                    icon: "success", 
                    background: 'var(--card-bg)', 
                    color: 'var(--foreground)',
                    customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                });
                fetchTickets();
            } else {
                Swal.fire({ 
                    title: "Error", 
                    text: await res.text(), 
                    icon: "error", 
                    background: 'var(--card-bg)', 
                    color: 'var(--foreground)',
                    customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                });
            }
        } catch {
            Swal.fire({ 
                title: "Error", 
                icon: "error", 
                background: 'var(--card-bg)', 
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
        }
    };

    const handleAction = (id: string, actionType: string, isPositive: boolean) => {
        let title = "";
        if (actionType === "IN_PROGRESS") title = "Mark as In Progress?";
        if (actionType === "RESOLVED") title = "Resolve Ticket?";
        if (actionType === "REJECTED") title = "Reject Ticket?";

        Swal.fire({
            title,
            input: 'textarea',
            inputPlaceholder: 'Add notes for the user...',
            icon: isPositive ? 'question' : 'warning',
            showCancelButton: true,
            confirmButtonColor: isPositive ? '#10b981' : '#ef4444',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Confirm',
            background: 'var(--card-bg)',
            color: 'var(--foreground)',
            customClass: {
                popup: 'glass-card border-none rounded-[2rem]',
                confirmButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs',
                cancelButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs'
            }
        }).then((result) => {
            if (result.isConfirmed) processStatusChange(id, actionType, result.value || "");
        });
    };

    const handleViewFeedback = async (ticket: any) => {
        try {
            const ratingRes = await fetch(`${apiUrl}/api/tickets/${ticket.id}/rating?userId=${ticket.reportedById}`, { credentials: "include" });
            if (ratingRes.ok) {
                const rating = await ratingRes.json();
                Swal.fire({
                    title: "User Feedback",
                    html: `
                        <div class="text-left">
                            <div class="mb-4">
                                <span class="text-xs font-bold text-muted uppercase tracking-widest">Ticket #${ticket.id?.substring(0, 6).toUpperCase()}</span>
                                <h3 class="text-lg font-bold text-foreground mt-1">${ticket.title}</h3>
                            </div>
                            <div class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-4">
                                <div class="flex items-center gap-2 mb-3">
                                    <div class="flex gap-0.5">
                                        ${[1, 2, 3, 4, 5].map((star) => `
                                            <span style="font-size: 20px; color: ${star <= rating.rating ? '#fbbf24' : '#475569'};">★</span>
                                        `).join('')}
                                    </div>
                                    <span class="text-sm text-yellow-400 font-bold ml-2">${rating.rating}/5</span>
                                </div>
                                ${rating.feedback ? `
                                    <div class="p-3 bg-card rounded-lg">
                                        <p class="text-sm text-foreground italic">"${rating.feedback}"</p>
                                    </div>
                                ` : '<p class="text-sm text-muted italic">No feedback text provided</p>'}
                            </div>
                            ${rating.createdAt ? `
                                <p class="text-xs text-muted text-center">Submitted on ${new Date(rating.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            ` : ''}
                        </div>
                    `,
                    width: '500px',
                    background: 'var(--card-bg)',
                    color: 'var(--foreground)',
                    confirmButtonColor: 'var(--primary)',
                    confirmButtonText: 'Close',
                    customClass: {
                        popup: 'glass-card border-none rounded-[2rem]',
                        title: 'text-2xl font-black text-foreground',
                        htmlContainer: 'text-left',
                        confirmButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs'
                    }
                });
            } else {
                Swal.fire({
                    title: "No Feedback",
                    text: "This ticket has not been rated yet.",
                    icon: "info",
                    background: 'var(--card-bg)',
                    color: 'var(--foreground)',
                    customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                });
            }
        } catch {
            Swal.fire({
                title: "Error",
                text: "Failed to load feedback.",
                icon: "error",
                background: 'var(--card-bg)',
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
        }
    };

    const handleViewDetails = async (ticket: any) => {
        let ratingHtml = '<div class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center text-xs text-yellow-300">No rating submitted yet</div>';
        
        if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
            try {
                const ratingRes = await fetch(`${apiUrl}/api/tickets/${ticket.id}/rating?userId=${ticket.reportedById}`, { credentials: "include" });
                if (ratingRes.ok) {
                    const rating = await ratingRes.json();
                    const stars = Array(5).fill(0).map((_, i) => 
                        `<span style="color: ${i < rating.rating ? '#fbbf24' : '#475569'}; font-size: 18px;">★</span>`
                    ).join('');
                    
                    ratingHtml = `
                        <div class="mt-4">
                            <h4 class="text-xs font-bold text-muted uppercase tracking-widest mb-2">User Rating</h4>
                            <div class="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex gap-0.5">${stars}</div>
                                    <span class="text-xs text-yellow-400 font-bold">${rating.rating}/5</span>
                                </div>
                                ${rating.feedback ? `<p class="text-xs text-muted italic">"${rating.feedback}"</p>` : '<p class="text-xs text-muted italic">No feedback provided</p>'}
                                ${rating.createdAt ? `<p class="text-[10px] text-muted/50 mt-2">Submitted: ${new Date(rating.createdAt).toLocaleDateString()}</p>` : ''}
                            </div>
                        </div>
                    `;
                }
            } catch {
                ratingHtml = '<div class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center text-xs text-yellow-300">No rating submitted yet</div>';
            }
        }

        const attachmentsHtml = ticket.attachments?.length > 0
            ? `
                <div class="mt-4">
                    <h4 class="text-xs font-bold text-muted uppercase tracking-widest mb-2">Attachments (${ticket.attachments.length})</h4>
                    <div class="flex gap-2 flex-wrap justify-center">
                        ${ticket.attachments.map((att: any) => `
                            <img 
                                src="${apiUrl}${att.fileUrl}" 
                                alt="${att.fileName}" 
                                class="w-20 h-20 object-cover rounded-xl border border-border-main cursor-pointer hover:opacity-80 transition-all hover:scale-105"
                                onclick="window.open('${apiUrl}${att.fileUrl}', '_blank')"
                            >
                        `).join('')}
                    </div>
                </div>
            `
            : '<div class="mt-4 text-xs font-bold text-muted uppercase tracking-widest">No attachments</div>';

        Swal.fire({
            title: `Ticket #${ticket.id?.substring(0,6).toUpperCase()}`,
            html: `
                <div class="text-left">
                    <div class="mb-3">
                        <span class="text-xs font-bold px-2 py-1 rounded ${
                            ticket.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                            ticket.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                            ticket.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-500/20 text-slate-400'
                        }">${ticket.priority || 'LOW'}</span>
                        <span class="ml-2 text-xs font-semibold px-2 py-1 rounded-full ${
                            ticket.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' :
                            ticket.status === 'REJECTED' || ticket.status === 'CLOSED' ? 'bg-red-500/20 text-red-400' :
                            ticket.status === 'IN_PROGRESS' ? 'bg-indigo-500/20 text-indigo-400' :
                            'bg-amber-500/20 text-amber-400'
                        }">${(ticket.status || 'OPEN').replace('_', ' ')}</span>
                    </div>
                    <h3 class="text-lg font-bold text-foreground mb-2">${ticket.title}</h3>
                    <p class="text-sm text-muted mb-3">${ticket.description}</p>
                    <div class="text-xs text-muted/80 space-y-1">
                        <div><span class="font-semibold text-foreground/80">Resource:</span> ${ticket.resourceDisplay || 'General'}</div>
                        <div><span class="font-semibold text-foreground/80">Reported By:</span> ${ticket.reportedById || 'Unknown'}</div>
                        <div><span class="font-semibold text-foreground/80">Created:</span> ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                    </div>
                    ${attachmentsHtml}
                    ${ticket.rejectionReason ? `
                        <div class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
                            <span class="font-bold">Rejection Reason:</span> ${ticket.rejectionReason}
                        </div>
                    ` : ''}
                    ${ticket.resolutionNotes ? `
                        <div class="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
                            <span class="font-bold">Resolution:</span> ${ticket.resolutionNotes}
                        </div>
                    ` : ''}
                    ${ratingHtml}
                </div>
            `,
            width: '650px',
            background: 'var(--card-bg)',
            color: 'var(--foreground)',
            confirmButtonColor: 'var(--primary)',
            confirmButtonText: 'Close',
            customClass: {
                popup: 'glass-card border-none rounded-[2rem]',
                title: 'text-2xl font-black text-foreground',
                htmlContainer: 'text-left',
                confirmButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs'
            }
        });
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
                            Ticket Management System
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase italic leading-none">
                            Ticket <span className="text-primary not-italic">Management</span>
                        </h1>
                        <p className="text-muted text-sm md:text-base font-semibold max-w-lg mx-auto leading-relaxed">
                            Manage and track all incident tickets across the institution. Monitor resolution progress and maintain service quality.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-foreground/5 backdrop-blur-sm rounded-xl p-4 border border-border-main">
                            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                            <div className="text-xs text-muted font-medium">Total</div>
                        </div>
                        <div className="bg-brand-peach/10 backdrop-blur-sm rounded-xl p-4 border border-brand-peach/20">
                            <div className="text-2xl font-bold text-brand-peach">{stats.open}</div>
                            <div className="text-xs text-brand-peach/70 font-medium">Open</div>
                        </div>
                        <div className="bg-primary-light/10 backdrop-blur-sm rounded-xl p-4 border border-primary-light/20">
                            <div className="text-2xl font-bold text-primary-light">{stats.inProgress}</div>
                            <div className="text-xs text-primary-light/70 font-medium">In Progress</div>
                        </div>
                        <div className="bg-emerald-500/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20">
                            <div className="text-2xl font-bold text-emerald-500">{stats.resolved}</div>
                            <div className="text-xs text-emerald-500/70 font-medium">Resolved</div>
                        </div>
                        <div className="bg-rose-500/10 backdrop-blur-sm rounded-xl p-4 border border-rose-500/20">
                            <div className="text-2xl font-bold text-rose-500">{stats.critical}</div>
                            <div className="text-xs text-rose-500/70 font-medium">Critical</div>
                        </div>
                    </div>

                    {/* Refresh Button */}
                    <button 
                        onClick={() => fetchTickets()}
                        disabled={refreshing}
                        className="flex items-center justify-center gap-3 px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'animate-spin' : ''}>
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                            <path d="M21 3v5h-5"/>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                            <path d="M8 16H3v5"/>
                        </svg>
                        {refreshing ? "Syncing..." : "Refresh Tickets"}
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-2xl p-4 mb-6 border border-border-main">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-muted mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Search title, description, ID..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="w-full px-3 py-2 bg-background border border-border-main rounded-lg text-sm text-foreground placeholder-muted focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div className="min-w-[140px]">
                        <label className="block text-xs font-semibold text-muted mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                            className="w-full px-3 py-2 bg-background border border-border-main rounded-lg text-sm text-foreground focus:border-primary focus:outline-none"
                        >
                            <option value="">All Status</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                    <div className="min-w-[140px]">
                        <label className="block text-xs font-semibold text-muted mb-1">Priority</label>
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters({...filters, priority: e.target.value})}
                            className="w-full px-3 py-2 bg-background border border-border-main rounded-lg text-sm text-foreground focus:border-primary focus:outline-none"
                        >
                            <option value="">All Priorities</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>
                    <div className="min-w-[150px]">
                        <label className="block text-xs font-semibold text-muted mb-1">From Date</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                            className="w-full px-3 py-2 bg-background border border-border-main rounded-lg text-sm text-foreground focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div className="min-w-[150px]">
                        <label className="block text-xs font-semibold text-muted mb-1">To Date</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                            className="w-full px-3 py-2 bg-background border border-border-main rounded-lg text-sm text-foreground focus:border-primary focus:outline-none"
                        />
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-lg text-sm font-medium transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
                <div className="mt-3 text-sm text-muted">
                    Showing {filteredTickets.length} of {tickets.length} tickets
                </div>
            </div>

            {loading ? (
                <div className="text-center text-muted py-10">Loading tickets...</div>
            ) : (
                <div className="bg-card rounded-2xl overflow-hidden border border-border-main shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-foreground/5 border-b border-border-main">
                                    <th className="p-4 font-semibold text-foreground/80">Issue Details</th>
                                    <th className="p-4 font-semibold text-foreground/80 w-28">Priority</th>
                                    <th className="p-4 font-semibold text-foreground/80 w-32">Status</th>
                                    <th className="p-4 font-semibold text-foreground/80 text-right min-w-[350px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted">
                                            {hasActiveFilters ? (
                                                <div>
                                                    <div className="text-lg mb-2">No tickets match your filters</div>
                                                    <button onClick={clearFilters} className="text-indigo-400 hover:text-indigo-300 text-sm">Clear filters</button>
                                                </div>
                                            ) : (
                                                "No incident tickets on the system."
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map((t) => (
                                        <tr key={t.id} className={`border-b border-border-main/50 hover:bg-foreground/5 transition-colors ${isOverdue(t) ? '!bg-red-500/10 !border-l-4 !border-l-red-500' : ''}`}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`font-semibold ${isOverdue(t) ? 'text-red-400' : 'text-foreground'}`}>{t.title}</div>
                                                    {isOverdue(t) && (
                                                        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-red-500 text-white border border-red-400 animate-pulse shadow-lg shadow-red-500/30">
                                                            ⚠ OVERDUE
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={`text-sm mt-1 line-clamp-2 ${isOverdue(t) ? 'text-red-300/80' : 'text-muted'}`}>{t.description}</div>
                                                <div className="text-xs text-primary mt-2 font-mono">Resource: {t.resourceDisplay || 'General'}</div>
                                                {t.attachments && t.attachments.length > 0 && (
                                                    <div className="flex gap-1 mt-2">
                                                        {t.attachments.slice(0, 3).map((att: any, idx: number) => (
                                                            <img 
                                                                key={idx}
                                                                src={`${apiUrl}${att.fileUrl}`}
                                                                alt={`Attachment ${idx + 1}`}
                                                                className="w-10 h-10 object-cover rounded-lg border border-border-main cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => window.open(`${apiUrl}${att.fileUrl}`, '_blank')}
                                                            />
                                                        ))}
                                                        {t.attachments.length > 3 && (
                                                            <span className="w-10 h-10 flex items-center justify-center text-[10px] font-black bg-foreground/5 rounded-lg border border-border-main text-muted">
                                                                +{t.attachments.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-black px-2 py-1 rounded shadow-sm border ${
                                                    t.priority === 'CRITICAL' ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' :
                                                    t.priority === 'HIGH' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' :
                                                    t.priority === 'MEDIUM' ? 'text-primary bg-primary/10 border-primary/20' :
                                                    'text-muted bg-foreground/5 border-border-main'
                                                }`}>
                                                    {t.priority || 'LOW'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                                                    t.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    t.status === 'REJECTED' || t.status === 'CLOSED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    t.status === 'IN_PROGRESS' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                    {(t.status || 'OPEN').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2 flex-wrap">
                                                    <button 
                                                        onClick={() => handleViewDetails(t)}
                                                        className="px-3 py-1.5 text-xs font-medium bg-foreground/10 hover:bg-foreground/20 text-foreground rounded-lg transition-all"
                                                    >
                                                        View
                                                    </button>
                                                    {(t.status === "RESOLVED" || t.status === "CLOSED") && t.hasFeedback && (
                                                        <button 
                                                            onClick={() => handleViewFeedback(t)}
                                                            className="px-3 py-1.5 text-xs font-medium bg-yellow-500/20 hover:bg-yellow-500 hover:text-white text-yellow-500 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <Star size={12} className="fill-yellow-500" />
                                                            Feedback
                                                        </button>
                                                    )}
                                                    {(t.status === "OPEN" || t.status === "PENDING" || !t.status) ? (
                                                        <>
                                                            <button 
                                                                onClick={() => handleAction(t.id, "IN_PROGRESS", true)}
                                                                className="px-3 py-1.5 text-xs font-medium bg-primary/20 hover:bg-primary hover:text-white text-primary rounded-lg transition-colors"
                                                            >
                                                                Start Work
                                                            </button>
                                                            <button 
                                                                onClick={() => handleAction(t.id, "REJECTED", false)}
                                                                className="px-3 py-1.5 text-xs font-medium bg-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-500 rounded-lg transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    ) : (t.status === "IN_PROGRESS") ? (
                                                        <button 
                                                            onClick={() => handleAction(t.id, "RESOLVED", true)}
                                                            className="px-3 py-1.5 text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-400 rounded-lg transition-colors"
                                                        >
                                                            Resolve Issue
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-muted italic font-medium">Closed</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
