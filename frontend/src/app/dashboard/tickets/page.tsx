"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import { X, Upload, AlertTriangle, MapPin, Type, FileText, Zap, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Star } from "lucide-react";
import RatingComponent from "@/components/RatingComponent";

export default function TicketingPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        search: ''
    });
    const [showReportModal, setShowReportModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTicket, setEditingTicket] = useState<any>(null);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        resourceId: '',
        priority: 'MEDIUM'
    });
    const [submitting, setSubmitting] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [resources, setResources] = useState<any[]>([]);
    const [reportResource, setReportResource] = useState('other');
    const [reportOtherResource, setReportOtherResource] = useState('');
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingTicket, setRatingTicket] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const fetchTickets = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/tickets?userId=${userId}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                const sortedTickets = data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                const ticketsWithAttachments = await Promise.all(
                    sortedTickets.map(async (ticket: any) => {
                        const attRes = await fetch(`${apiUrl}/api/tickets/${ticket.id}/attachments`, { credentials: "include" });
                        let rating = null;
                        if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
                            try {
                                const ratingRes = await fetch(`${apiUrl}/api/tickets/${ticket.id}/rating?userId=${userId}`, { credentials: "include" });
                                if (ratingRes.ok) {
                                    rating = await ratingRes.json();
                                }
                            } catch {
                                console.error("Failed to fetch rating");
                            }
                        }
                        if (attRes.ok) {
                            const attachments = await attRes.json();
                            return { ...ticket, attachments, userRating: rating };
                        }
                        return { ...ticket, attachments: [], userRating: rating };
                    })
                );

                setTickets(ticketsWithAttachments);
            }
        } catch {
            console.error("Failed to fetch tickets");
        } finally {
            setLoading(false);
        }
    }, [apiUrl]);



    const fetchResources = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}/api/resources`, { credentials: "include" });
            if (res.ok) {
                setResources(await res.json());
            }
        } catch {
            console.error("Failed to fetch resources");
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    const getResourceName = (resourceId: string) => {
        if (!resourceId) return 'General';
        const resource = resources.find(r => r.id === resourceId);
        return resource ? `${resource.resourceCode} - ${resource.resourceName}` : resourceId;
    };

    useEffect(() => {
        const loadUser = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/auth/me`, { credentials: "include" });
                if (res.ok) {
                    const user = await res.json();
                    setCurrentUser(user);
                    if (user.id) fetchTickets(user.id);
                    else setLoading(false);
                } else {
                    setLoading(false);
                }
            } catch {
                setLoading(false);
            }
        };
        loadUser();
    }, [fetchTickets, apiUrl]);

    const getStatusColor = (status: string) => {
        if (status === 'OPEN') return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
        if (status === 'IN_PROGRESS') return 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400';
        if (status === 'RESOLVED') return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
        if (status === 'REJECTED' || status === 'CLOSED') return 'border-red-500/50 bg-red-500/10 text-red-400';
        return 'border-slate-500/50 bg-slate-500/10 text-slate-400';
    };

    const isOverdue = (ticket: any) => {
        if (!ticket.createdAt || ticket.status === 'RESOLVED' || ticket.status === 'REJECTED' || ticket.status === 'CLOSED') {
            return false;
        }
        const createdAt = new Date(ticket.createdAt).getTime();
        const now = Date.now();
        const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

        const thresholds: Record<string, number> = {
            'CRITICAL': 1,
            'HIGH': 4,
            'MEDIUM': 24,
            'LOW': 72
        };

        const threshold = thresholds[ticket.priority] || 24;
        return hoursElapsed > threshold;
    };

    const getOverdueLabel = (ticket: any) => {
        if (!ticket.createdAt) return '';
        const createdAt = new Date(ticket.createdAt);
        const now = new Date();
        const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const thresholds: Record<string, number> = { 'CRITICAL': 1, 'HIGH': 4, 'MEDIUM': 24, 'LOW': 72 };
        const threshold = thresholds[ticket.priority] || 24;
        const overdueHours = Math.floor(hoursElapsed - threshold);
        if (overdueHours < 1) return `${Math.floor((hoursElapsed - threshold) * 60)}m overdue`;
        return `${overdueHours}h overdue`;
    };

    const filteredTickets = tickets.filter(ticket => {
        if (filters.status && ticket.status !== filters.status) return false;
        if (filters.priority && ticket.priority !== filters.priority) return false;
        if (filters.search) {
            const searchTerm = filters.search.trim();
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                ticket.title?.toLowerCase().includes(searchLower) ||
                ticket.description?.toLowerCase().includes(searchLower) ||
                ticket.resourceId?.toLowerCase().includes(searchLower) ||
                ticket.id?.toLowerCase().includes(searchLower) ||
                ticket.id?.substring(0, 6).toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }
        return true;
    });

    const clearFilters = () => {
        setFilters({ status: '', priority: '', search: '' });
    };

    const hasActiveFilters = filters.status || filters.priority || filters.search;

    const handleReport = () => {
        setShowReportModal(true);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles = Array.from(files).slice(0, 3 - selectedImages.length);
            setSelectedImages(prev => [...prev, ...newFiles].slice(0, 3));

            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 3));
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitReport = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        if (!formData.get('title') || !formData.get('description')) {
            Swal.fire({
                title: "Error",
                text: "Title and description are required",
                icon: "error",
                background: 'var(--card-bg)',
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
            return;
        }

        setSubmitting(true);

        const submitData = new FormData();
        submitData.append('title', formData.get('title') as string);
        submitData.append('description', formData.get('description') as string);
        const resourceToSubmit = reportResource === 'other' ? reportOtherResource : reportResource;
        submitData.append('resourceId', resourceToSubmit);
        submitData.append('priority', formData.get('priority') as string);
        submitData.append('reportedById', currentUser!.id);

        if (selectedImages.length > 0) {
            selectedImages.forEach(file => {
                submitData.append('images', file);
            });
        }

        try {
            const res = await fetch(`${apiUrl}/api/tickets/with-attachments`, {
                method: "POST",
                credentials: "include",
                body: submitData
            });

            if (res.ok) {
                Swal.fire({
                    title: "Issue Reported!",
                    text: "Your ticket has been submitted successfully.",
                    icon: "success",
                    background: '#1e293b',
                    color: '#fff',
                    customClass: { popup: 'rounded-2xl' }
                });
                setShowReportModal(false);
                setSelectedImages([]);
                setImagePreviews([]);
                setReportResource('other');
                setReportOtherResource('');
                form.reset();
                fetchTickets(currentUser!.id);
            } else {
                Swal.fire({
                    title: "Error",
                    text: "Failed to submit ticket",
                    icon: "error",
                    background: 'var(--card-bg)',
                    color: 'var(--foreground)',
                    customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                });
            }
        } catch {
            Swal.fire({
                title: "Error",
                text: "Network error. Please try again.",
                icon: "error",
                background: 'var(--card-bg)',
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (ticketId: string, title: string) => {
        Swal.fire({
            title: `Delete ticket "${title}"?`,
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ec4899',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Yes, delete it!',
            background: 'var(--card-bg)',
            color: 'var(--foreground)',
            customClass: {
                popup: 'glass-card border-none rounded-[2rem]',
                confirmButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs',
                cancelButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await fetch(`${apiUrl}/api/tickets/${ticketId}`, {
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
                    fetchTickets(currentUser!.id);
                } else {
                    Swal.fire({
                        title: "Error",
                        text: "Failed to delete ticket",
                        icon: "error",
                        background: 'var(--card-bg)',
                        color: 'var(--foreground)',
                        customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                    });
                }
            }
        });
    };

    const handleEdit = (ticket: any) => {
        setEditingTicket(ticket);
        setEditForm({
            title: ticket.title || '',
            description: ticket.description || '',
            resourceId: ticket.resourceId || '',
            priority: ticket.priority || 'MEDIUM'
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editForm.title || !editForm.description) {
            Swal.fire({
                title: "Error",
                text: "Title and description are required",
                icon: "error",
                background: 'var(--card-bg)',
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${apiUrl}/api/tickets/${editingTicket.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                Swal.fire({
                    title: "Updated!",
                    icon: "success",
                    background: '#1e293b',
                    color: '#fff',
                    customClass: { popup: 'rounded-2xl' }
                });
                setShowEditModal(false);
                fetchTickets(currentUser!.id);
            } else {
                Swal.fire({
                    title: "Error",
                    text: "Failed to update ticket",
                    icon: "error",
                    background: 'var(--card-bg)',
                    color: 'var(--foreground)',
                    customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                });
            }
        } catch {
            Swal.fire({
                title: "Error",
                text: "Network error",
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
        <div className="relative min-h-screen">
            <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-6 text-foreground min-h-screen overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase italic leading-none mb-2">
                            My <span className="text-primary not-italic">Tickets</span>
                        </h1>
                        <p className="text-xs font-bold text-muted uppercase tracking-widest leading-relaxed">Report facility issues and track their resolution progress.</p>
                    </div>
                    <button
                        onClick={handleReport}
                        className="group relative rounded-xl btn-primary-action font-bold px-8 py-3 overflow-hidden"
                    >

                        <span className="relative z-10 flex items-center gap-2">
                            <Zap size={18} className="group-hover:rotate-12 transition-transform" />
                            Report Issue
                        </span>
                    </button>
                </div>

                {showReportModal && (
                    <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-[20vh]">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowReportModal(false)}
                        />
                        <div className="relative w-full max-w-2xl max-h-[75vh] overflow-y-auto bg-card rounded-3xl border border-border-main shadow-2xl shadow-primary/10 animate-in slide-in-from-top-4 duration-300">
                            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border-main p-6 rounded-t-3xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-xl">
                                            <AlertTriangle size={24} className="text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">Report New Incident</h2>
                                            <p className="text-sm text-muted">Describe the issue you are experiencing</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowReportModal(false)}
                                        className="p-2 hover:bg-foreground/5 rounded-xl transition-colors"
                                    >
                                        <X size={20} className="text-muted" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitReport} className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                                        <Type size={16} className="text-primary" />
                                        Issue Title
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="title"
                                        type="text"
                                        placeholder="Brief title describing the issue..."
                                        className="w-full px-4 py-3 bg-card border border-border-main rounded-xl text-foreground placeholder-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                                        <FileText size={16} className="text-primary" />
                                        Description
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        rows={4}
                                        placeholder="Provide detailed information about the issue, including location, time, and impact..."
                                        className="w-full px-4 py-3 bg-card border border-border-main rounded-xl text-foreground placeholder-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-none"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                                            <MapPin size={16} className="text-primary" />
                                            Location / Resource
                                        </label>
                                        <select
                                            value={reportResource}
                                            onChange={(e) => setReportResource(e.target.value)}
                                            className="w-full px-4 py-3 bg-card border border-border-main rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all cursor-pointer"
                                        >
                                            <option value="other">Other (specify below)</option>
                                            {resources.map((resource) => (
                                                <option key={resource.id} value={resource.id}>
                                                    {resource.resourceCode} - {resource.resourceName}
                                                    {resource.building ? ` (${resource.building}${resource.roomNumber ? ', ' + resource.roomNumber : ''})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {reportResource === 'other' && (
                                            <input
                                                type="text"
                                                value={reportOtherResource}
                                                onChange={(e) => setReportOtherResource(e.target.value)}
                                                placeholder="Enter location or resource..."
                                                className="w-full px-4 py-3 bg-card border border-border-main rounded-xl text-foreground placeholder-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all mt-2"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                                            <Zap size={16} className="text-primary" />
                                            Priority Level
                                        </label>
                                        <select
                                            name="priority"
                                            className="w-full px-4 py-3 bg-card border border-border-main rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all cursor-pointer"
                                            defaultValue="MEDIUM"
                                        >
                                            <option value="LOW">Low - Minor inconvenience</option>
                                            <option value="MEDIUM">Medium - Partially affected</option>
                                            <option value="HIGH">High - Significantly disrupted</option>
                                            <option value="CRITICAL">Critical - Unusable / Emergency</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                                        <ImageIcon size={16} className="text-primary" />
                                        Attach Images
                                        <span className="text-xs text-muted/50 font-normal">(up to 3)</span>
                                    </label>

                                    <div
                                        className="relative border-2 border-dashed border-border-main hover:border-primary/50 rounded-xl p-6 transition-colors cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageSelect}
                                            disabled={selectedImages.length >= 3}
                                        />
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="p-3 bg-foreground/5 rounded-xl mb-3 border border-border-main">
                                                <Upload size={24} className="text-muted" />
                                            </div>
                                            <p className="text-sm text-muted">
                                                <span className="text-primary font-bold">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-[10px] font-bold text-muted/50 uppercase tracking-widest mt-1">PNG, JPG, GIF up to 10MB</p>
                                        </div>
                                    </div>

                                    {imagePreviews.length > 0 && (
                                        <div className="flex gap-3 flex-wrap">
                                            {imagePreviews.map((preview, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={preview}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-20 h-20 object-cover rounded-xl border border-slate-700"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {selectedImages.length < 3 && (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-20 h-20 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-700 hover:border-pink-500/50 text-slate-500 hover:text-pink-400 transition-colors"
                                                >
                                                    <Upload size={20} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-border-main">
                                    <button
                                        type="button"
                                        onClick={() => setShowReportModal(false)}
                                        className="flex-1 px-4 py-3 bg-foreground/5 hover:bg-foreground/10 text-muted rounded-xl font-bold uppercase text-[10px] tracking-widest transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={18} />
                                                Submit Ticket
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showEditModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                        <div className="relative w-full max-w-lg bg-card rounded-3xl border border-border-main shadow-2xl overflow-hidden">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-brand-pink/10" />
                                <div className="relative p-6 pb-4">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                                                <FileText size={24} className="text-primary" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-foreground">Edit Ticket</h2>
                                                <p className="text-xs text-muted">Update your ticket information</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowEditModal(false)}
                                            className="p-2 hover:bg-foreground/5 rounded-xl transition-colors"
                                        >
                                            <X size={20} className="text-muted" />
                                        </button>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                                                <Type size={16} className="text-primary" />
                                                Ticket Title
                                                <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                placeholder="Brief title describing the issue..."
                                                className="w-full px-4 py-3 bg-card border border-border-main rounded-xl text-foreground placeholder-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                                                <FileText size={16} className="text-primary" />
                                                Description
                                                <span className="text-red-400">*</span>
                                            </label>
                                            <textarea
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                rows={4}
                                                placeholder="Provide detailed information about the issue..."
                                                className="w-full px-4 py-3 bg-card border border-border-main rounded-xl text-foreground placeholder-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-none"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                                                    <MapPin size={16} className="text-primary" />
                                                    Location / Resource
                                                </label>
                                                <select
                                                    value={editForm.resourceId}
                                                    onChange={(e) => setEditForm({ ...editForm, resourceId: e.target.value })}
                                                    className="w-full px-4 py-3 bg-card border border-border-main rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all cursor-pointer"
                                                >
                                                    <option value="other">Other (specify below)</option>
                                                    {resources.map((resource) => (
                                                        <option key={resource.id} value={resource.id}>
                                                            {resource.resourceCode} - {resource.resourceName}
                                                            {resource.building ? ` (${resource.building}${resource.roomNumber ? ', ' + resource.roomNumber : ''})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                                                    <Zap size={16} className="text-primary" />
                                                    Priority Level
                                                </label>
                                                <select
                                                    value={editForm.priority}
                                                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                                                    className="w-full px-4 py-3 bg-card border border-border-main rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all cursor-pointer"
                                                >
                                                    <option value="LOW">Low - Minor inconvenience</option>
                                                    <option value="MEDIUM">Medium - Partially affected</option>
                                                    <option value="HIGH">High - Significantly disrupted</option>
                                                    <option value="CRITICAL">Critical - Unusable / Emergency</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-6 mt-6 border-t border-border-main">
                                        <button
                                            onClick={() => setShowEditModal(false)}
                                            className="flex-1 px-4 py-3 bg-foreground/5 hover:bg-foreground/10 text-muted rounded-xl font-bold uppercase text-[10px] tracking-widest transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            disabled={submitting}
                                            className="flex-1 px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-indigo-500/20"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={18} />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-card rounded-2xl p-4 mb-6 border border-border-main">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-semibold text-muted mb-1">Search</label>
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-border-main rounded-lg text-sm text-foreground placeholder-muted focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div className="min-w-[130px]">
                            <label className="block text-xs font-semibold text-muted mb-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-800 border border-border-main rounded-lg text-sm text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
                            >
                                <option value="">All</option>
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                        <div className="min-w-[130px]">
                            <label className="block text-xs font-semibold text-muted mb-1">Priority</label>
                            <select
                                value={filters.priority}
                                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-800 border border-border-main rounded-lg text-sm text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
                            >
                                <option value="">All</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
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
                    <div className="text-center text-slate-400 py-10">Loading tickets...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTickets.length === 0 ? (
                            <div className="col-span-full text-center p-20 bg-card rounded-[2.5rem] border border-border-main shadow-inner">
                                {hasActiveFilters ? (
                                    <div>
                                        <div className="text-lg font-bold text-foreground mb-2">No tickets match your filters</div>
                                        <button onClick={clearFilters} className="text-primary hover:text-primary-dark font-black uppercase text-[10px] tracking-widest">Clear filters</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                            <AlertCircle size={32} className="text-primary opacity-50" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground">No reports found</h3>
                                        <p className="text-muted text-sm font-medium">Your reported issues and incident tickets will appear here.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <div key={ticket.id} className={`bg-card flex flex-col p-6 rounded-2xl border-l-4 group transition-all hover:bg-foreground/5`} style={{ borderLeftColor: ticket.priority === 'CRITICAL' ? '#f43f5e' : ticket.priority === 'HIGH' ? '#fb923c' : '#CA5995' }}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-medium text-muted bg-foreground/5 px-2 py-1 rounded">#{ticket.id?.substring(0, 6).toUpperCase()}</span>
                                            {isOverdue(ticket) && (
                                                <span className="text-[10px] font-bold px-2 py-1 rounded bg-rose-500/20 text-rose-500 border border-rose-500/30">
                                                    OVERDUE
                                                </span>
                                            )}
                                        </div>
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(ticket.status)}`}>
                                            {(ticket.status || 'OPEN').replace("_", " ")}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">{ticket.title}</h3>
                                    <p className="text-sm text-muted line-clamp-3 mb-2 flex-grow">{ticket.description}</p>

                                    {ticket.attachments && ticket.attachments.length > 0 && (
                                        <div className="flex gap-2 mb-4 overflow-x-auto">
                                            {ticket.attachments.map((att: any, idx: number) => (
                                                <img
                                                    key={idx}
                                                    src={`${apiUrl}${att.fileUrl}`}
                                                    alt={`Attachment ${idx + 1}`}
                                                    className="w-16 h-16 object-cover rounded-lg border border-slate-600 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => window.open(`${apiUrl}${att.fileUrl}`, '_blank')}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-3 mt-4 pt-4 border-t border-border-main/50">
                                        <div className="flex items-center gap-3 text-xs">
                                            <MapPin size={14} className="text-primary" />
                                            <span className="font-bold text-muted uppercase tracking-widest opacity-60 min-w-[70px]">Resource</span>
                                            <span className="text-foreground font-black">{resources.find(r => r.id === ticket.resourceId)?.resourceCode || 'General'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            <Zap size={14} className="text-primary" />
                                            <span className="font-bold text-muted uppercase tracking-widest opacity-60 min-w-[70px]">Priority</span>
                                            <span className={`font-black ${ticket.priority === 'CRITICAL' ? 'text-rose-500' : ticket.priority === 'HIGH' ? 'text-orange-500' : 'text-primary'}`}>
                                                {ticket.priority || 'MEDIUM'}
                                            </span>
                                        </div>
                                        {isOverdue(ticket) && (
                                            <div className="flex items-center gap-3 text-xs text-rose-500">
                                                <AlertCircle size={14} className="font-bold" />
                                                <span className="font-bold uppercase tracking-widest opacity-60 min-w-[70px]">Overdue</span>
                                                <span className="font-black">{getOverdueLabel(ticket)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-xs">
                                            <FileText size={14} className="text-primary" />
                                            <span className="font-bold text-muted uppercase tracking-widest opacity-60 min-w-[70px]">Created</span>
                                            <span className="text-foreground font-black">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</span>
                                        </div>
                                    </div>

                                    {ticket.resolutionNotes && ticket.status === 'RESOLVED' && (
                                        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 font-medium">
                                            <span className="font-bold d-block mb-1">Resolution:</span> {ticket.resolutionNotes}
                                        </div>
                                    )}
                                    {ticket.rejectionReason && ticket.status === 'REJECTED' && (
                                        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 font-medium">
                                            <span className="font-bold d-block mb-1">Feedback:</span> {ticket.rejectionReason}
                                        </div>
                                    )}

                                    {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
                                        <div className="mt-4 pt-4 border-t border-border-main/50">
                                            {ticket.userRating ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-muted uppercase tracking-widest">Your Rating:</span>
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star
                                                                    key={star}
                                                                    size={16}
                                                                    className={`${star <= ticket.userRating.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-600"}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {ticket.userRating.feedback && (
                                                        <button
                                                            onClick={() => {
                                                                Swal.fire({
                                                                    title: "Your Feedback",
                                                                    html: `
                                                                        <div class="text-left">
                                                                            <div class="flex items-center gap-2 mb-4">
                                                                                <div class="flex gap-0.5">
                                                                                    ${[1, 2, 3, 4, 5].map((star) => `
                                                                                        <span style="font-size: 20px; color: ${star <= ticket.userRating.rating ? '#fbbf24' : '#475569'};">★</span>
                                                                                    `).join('')}
                                                                                </div>
                                                                                <span class="text-sm text-yellow-400 font-bold">${ticket.userRating.rating}/5</span>
                                                                            </div>
                                                                            <div class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                                                                <p class="text-sm text-foreground italic">"${ticket.userRating.feedback}"</p>
                                                                            </div>
                                                                            ${ticket.userRating.createdAt ? `
                                                                                <p class="text-xs text-muted mt-3 text-center">Submitted on ${new Date(ticket.userRating.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                                            ` : ''}
                                                                        </div>
                                                                    `,
                                                                    background: 'var(--card-bg)',
                                                                    color: 'var(--foreground)',
                                                                    confirmButtonColor: 'var(--primary)',
                                                                    confirmButtonText: 'Close',
                                                                    customClass: {
                                                                        popup: 'glass-card border-none rounded-[2rem]',
                                                                        title: 'text-2xl font-black text-foreground',
                                                                    }
                                                                });
                                                            }}
                                                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-xl transition-all border border-yellow-500/20"
                                                        >
                                                            <Star size={14} className="fill-yellow-400" />
                                                            View Feedback
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setRatingTicket(ticket);
                                                        setShowRatingModal(true);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold bg-gradient-to-r from-yellow-400/20 to-orange-400/20 hover:from-yellow-400/30 hover:to-orange-400/30 text-yellow-500 rounded-xl transition-all border border-yellow-400/20"
                                                >
                                                    <Star size={16} className="fill-yellow-400" />
                                                    Rate This Resolution
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {ticket.status === 'OPEN' && (
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-border-main/50">
                                            <button
                                                onClick={() => handleEdit(ticket)}
                                                className="flex-1 px-3 py-2 text-sm font-bold bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400 rounded-xl transition-all border border-indigo-500/20 active:scale-95"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ticket.id, ticket.title)}
                                                className="flex-1 px-3 py-2 text-sm font-bold bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl transition-all border border-rose-500/20 active:scale-95"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {showRatingModal && ratingTicket && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowRatingModal(false)}
                    />
                    <div className="relative w-full max-w-md bg-card rounded-3xl border border-border-main shadow-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-orange-400/10" />
                        <div className="relative p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-yellow-400/10 rounded-xl border border-yellow-400/20">
                                        <Star size={24} className="text-yellow-400 fill-yellow-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Rate Your Experience</h2>
                                        <p className="text-xs text-muted">How was your ticket resolved?</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowRatingModal(false)}
                                    className="p-2 hover:bg-foreground/5 rounded-xl transition-colors"
                                >
                                    <X size={20} className="text-muted" />
                                </button>
                            </div>

                            <div className="mb-4 p-3 bg-foreground/5 rounded-xl">
                                <div className="text-xs font-mono text-muted mb-1">Ticket #{ratingTicket.id?.substring(0, 6).toUpperCase()}</div>
                                <h3 className="text-sm font-bold text-foreground">{ratingTicket.title}</h3>
                                {ratingTicket.resolutionNotes && (
                                    <p className="text-xs text-muted mt-1">{ratingTicket.resolutionNotes}</p>
                                )}
                            </div>

                            <RatingComponent
                                ticketId={ratingTicket.id}
                                userId={currentUser?.id}
                                currentRating={ratingTicket.userRating?.rating || 0}
                                currentFeedback={ratingTicket.userRating?.feedback || ""}
                                apiUrl={apiUrl}
                                onRatingSubmitted={() => {
                                    setShowRatingModal(false);
                                    fetchTickets(currentUser!.id);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
