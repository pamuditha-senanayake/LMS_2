"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Search, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight, Calendar, User, MapPin, Activity } from "lucide-react";
import Swal from "sweetalert2";
import BookingDetailsModal from "@/components/BookingDetailsModal";
import { TableSkeleton, StatsSkeleton } from "@/components/Skeleton";

interface Booking {
  id: string;
  resourceId: string;
  resourceName?: string;
  resourceType?: string;
  resourceLocation?: string;
  purpose: string;
  expectedAttendees: number;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  rejectionReason?: string;
  requestedBy?: {
    userId: string;
    name: string;
    email: string;
  };
}

interface BookingStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

interface PaginatedResponse {
  content: Booking[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const fetchBookings = async (page: number, size: number, status: string, resourceId: string): Promise<PaginatedResponse> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sortBy: "createdAt",
    sortDirection: "DESC",
  });
  if (status) params.append("status", status);
  if (resourceId) params.append("resourceId", resourceId);
  
  const res = await fetch(`${apiUrl}/api/bookings?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
};

const fetchStats = async (): Promise<BookingStats> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const res = await fetch(`${apiUrl}/api/bookings/stats`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
};

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    resourceId: "",
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["booking-stats"],
    queryFn: fetchStats,
    staleTime: 60 * 1000,
  });

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-bookings", page, filters.status, filters.resourceId],
    queryFn: () => fetchBookings(page, 100, filters.status, filters.resourceId),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/auth/me`, { credentials: "include" });
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
        }
      } catch {}
    };
    loadUser();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const handleApprove = useCallback((id: string, name: string) => {
    Swal.fire({
      title: `Approve Booking`,
      html: `
        <div style="text-align: center; padding: 1rem 0;">
          <div style="width: 64px; height: 64px; margin: 0 auto 1rem; background: rgba(16, 185, 129, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 0.5rem;">Are you sure you want to approve the booking for</p>
          <p style="color: #ffffff; font-size: 16px; font-weight: 600;">${name}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6366f1',
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Approve',
      background: '#020617',
      color: '#ffffff',
      padding: '2rem',
      borderRadius: '16px'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
          const url = new URL(`${apiUrl}/api/bookings/${id}/status`);
          url.searchParams.append("status", "APPROVED");
          url.searchParams.append("adminId", currentUser?.id || "N/A");
          url.searchParams.append("reason", "Approved by admin");

          const res = await fetch(url.toString(), {
            method: "PATCH",
            credentials: "include"
          });

          if (res.ok) {
            Swal.fire({ 
              title: "Approved!",
              html: `
                <div style="text-align: center; padding: 1rem 0;">
                  <div style="width: 64px; height: 64px; margin: 0 auto 1rem; background: rgba(16, 185, 129, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <p style="color: #94a3b8; font-size: 14px;">Booking has been approved successfully.</p>
                </div>
              `,
              background: '#020617', 
              color: '#ffffff',
              padding: '2rem',
              borderRadius: '16px'
            });
            queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
            queryClient.invalidateQueries({ queryKey: ["booking-stats"] });
          } else {
            Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
          }
        } catch {
          Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
      }
    });
  }, [queryClient, currentUser]);

  const handleReject = useCallback((id: string, name: string) => {
    Swal.fire({
      title: `Reject Booking`,
      html: `
        <div style="text-align: center; padding: 1rem 0;">
          <div style="width: 64px; height: 64px; margin: 0 auto 1rem; background: rgba(239, 68, 68, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 1.5rem;">Are you sure you want to reject the booking for <strong style="color: #ffffff;">${name}</strong>?</p>
          <div style="text-align: left;">
            <label style="display: block; color: #94a3b8; font-size: 13px; font-weight: 500; margin-bottom: 0.5rem;">Reason for rejection</label>
            <select id="reject-reason" style="width: 100%; padding: 0.75rem 1rem; background: #0f172a; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; font-size: 14px; outline: none; cursor: pointer; appearance: none; background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e'); background-repeat: no-repeat; background-position: right 1rem center; background-size: 16px;">
              <option value="">Select a reason</option>
              <option value="Time slot not available">Time slot not available</option>
              <option value="Resource under maintenance">Resource under maintenance</option>
              <option value="Insufficient capacity">Insufficient capacity</option>
              <option value="Duplicate booking request">Duplicate booking request</option>
              <option value="Incomplete information">Incomplete information</option>
              <option value="Booking exceeds allowed limit">Booking exceeds allowed limit</option>
              <option value="other">Other (specify)</option>
            </select>
            <textarea id="reject-other" class="hidden" style="width: 100%; padding: 0.75rem 1rem; background: #0f172a; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; font-size: 14px; outline: none; margin-top: 0.75rem; resize: none; min-height: 80px; font-family: inherit;" placeholder="Enter reason..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Reject',
      background: '#020617',
      color: '#ffffff',
      padding: '2rem',
      borderRadius: '16px',
      didOpen: () => {
        const select = document.getElementById('reject-reason');
        if (select) {
          select.addEventListener('change', () => {
            const otherField = document.getElementById('reject-other');
            if (select.value === 'other') {
              otherField?.classList.remove('hidden');
            } else {
              otherField?.classList.add('hidden');
            }
          });
        }
      },
      preConfirm: () => {
        const reason = (document.getElementById('reject-reason') as HTMLSelectElement)?.value;
        const otherReason = (document.getElementById('reject-other') as HTMLTextAreaElement)?.value;
        if (!reason) {
          Swal.showValidationMessage('Please select a reason');
          return false;
        }
        if (reason === 'other' && !otherReason) {
          Swal.showValidationMessage('Please specify the reason');
          return false;
        }
        return reason === 'other' ? otherReason : reason;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
          const url = new URL(`${apiUrl}/api/bookings/${id}/status`);
          url.searchParams.append("status", "REJECTED");
          url.searchParams.append("adminId", currentUser?.id || "N/A");
          url.searchParams.append("reason", result.value || "Rejected by admin");

          const res = await fetch(url.toString(), {
            method: "PATCH",
            credentials: "include"
          });

          if (res.ok) {
            Swal.fire({ 
              title: "Rejected!",
              html: `
                <div style="text-align: center; padding: 1rem 0;">
                  <div style="width: 64px; height: 64px; margin: 0 auto 1rem; background: rgba(16, 185, 129, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <p style="color: #94a3b8; font-size: 14px;">Booking has been rejected.</p>
                </div>
              `,
              background: '#020617', 
              color: '#ffffff',
              padding: '2rem',
              borderRadius: '16px'
            });
            queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
            queryClient.invalidateQueries({ queryKey: ["booking-stats"] });
          } else {
            Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
          }
        } catch {
          Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
      }
    });
  }, [queryClient, currentUser]);

  const handleAdminCancel = useCallback((id: string, name: string) => {
    Swal.fire({
      title: `Cancel Booking`,
      html: `
        <div style="text-align: center; padding: 1rem 0;">
          <div style="width: 64px; height: 64px; margin: 0 auto 1rem; background: rgba(239, 68, 68, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 1.5rem;">Are you sure you want to cancel the booking for <strong style="color: #ffffff;">${name}</strong>?</p>
          <div style="text-align: left;">
            <label style="display: block; color: #94a3b8; font-size: 13px; font-weight: 500; margin-bottom: 0.5rem;">Reason for cancellation</label>
            <select id="cancel-reason" style="width: 100%; padding: 0.75rem 1rem; background: #0f172a; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; font-size: 14px; outline: none; cursor: pointer; appearance: none; background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e'); background-repeat: no-repeat; background-position: right 1rem center; background-size: 16px;">
              <option value="">Select a reason</option>
              <option value="Resource no longer available">Resource no longer available</option>
              <option value="Schedule conflict">Schedule conflict</option>
              <option value="Maintenance required">Maintenance required</option>
              <option value="Double booking detected">Double booking detected</option>
              <option value="Request from requester">Request from requester</option>
              <option value="Policy violation">Policy violation</option>
              <option value="other">Other (specify)</option>
            </select>
            <textarea id="cancel-other" class="hidden" style="width: 100%; padding: 0.75rem 1rem; background: #0f172a; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; font-size: 14px; outline: none; margin-top: 0.75rem; resize: none; min-height: 80px; font-family: inherit;" placeholder="Enter reason..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      cancelButtonText: 'Close',
      confirmButtonText: 'Cancel Booking',
      background: '#020617',
      color: '#ffffff',
      padding: '2rem',
      borderRadius: '16px',
      didOpen: () => {
        const select = document.getElementById('cancel-reason');
        if (select) {
          select.addEventListener('change', () => {
            const otherField = document.getElementById('cancel-other');
            if (select.value === 'other') {
              otherField?.classList.remove('hidden');
            } else {
              otherField?.classList.add('hidden');
            }
          });
        }
      },
      preConfirm: () => {
        const reason = (document.getElementById('cancel-reason') as HTMLSelectElement)?.value;
        const otherReason = (document.getElementById('cancel-other') as HTMLTextAreaElement)?.value;
        if (!reason) {
          Swal.showValidationMessage('Please select a reason');
          return false;
        }
        if (reason === 'other' && !otherReason) {
          Swal.showValidationMessage('Please specify the reason');
          return false;
        }
        return reason === 'other' ? otherReason : reason;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
          const url = new URL(`${apiUrl}/api/bookings/${id}/status`);
          url.searchParams.append("status", "CANCELLED");
          url.searchParams.append("adminId", currentUser?.id || "N/A");
          url.searchParams.append("reason", result.value || "Cancelled by admin");

          const res = await fetch(url.toString(), {
            method: "PATCH",
            credentials: "include"
          });

          if (res.ok) {
            Swal.fire({ 
              title: "Cancelled!",
              html: `
                <div style="text-align: center; padding: 1rem 0;">
                  <div style="width: 64px; height: 64px; margin: 0 auto 1rem; background: rgba(16, 185, 129, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <p style="color: #94a3b8; font-size: 14px;">Booking has been cancelled.</p>
                </div>
              `,
              background: '#020617', 
              color: '#ffffff',
              padding: '2rem',
              borderRadius: '16px'
            });
            queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
            queryClient.invalidateQueries({ queryKey: ["booking-stats"] });
          } else {
            Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
          }
        } catch {
          Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
      }
    });
  }, [queryClient, currentUser]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
      CANCELLED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  const stats = statsData || { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 };
  const bookings = data?.content || [];
  const filteredBookings = debouncedSearch
    ? bookings.filter((b) =>
        b.purpose.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.requestedBy?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.requestedBy?.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.resourceName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.resourceId.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : bookings;

  return (
    <div className="p-2 pt-0 text-foreground max-w-7xl mx-auto">
      {/* Hero Banner Section */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-border-main shadow-2xl bg-card group/banner mb-8">
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-brand-pink/10 opacity-40 transition-opacity duration-700 group-hover/banner:opacity-60" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] -mr-48 -mt-48 rounded-full" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-pink/10 blur-[120px] -ml-48 -mb-48 rounded-full" />
        
        <div className="relative p-5 md:p-6 flex flex-col items-center text-center space-y-4">
            <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
                    <Activity size={12} />
                    Institution Booking Management
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase italic leading-none">
                    Admin <span className="text-primary not-italic">Bookings</span>
                </h1>
                <p className="text-muted text-sm md:text-base font-semibold max-w-lg mx-auto leading-relaxed">
                    Approve, monitor, and manage all facility and equipment bookings across the campus.
                </p>
            </div>

            {/* Stats Cards */}
            {statsLoading ? (
              <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-3 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-foreground/5 h-20 rounded-xl border border-border-main" />
                ))}
              </div>
            ) : (
              <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-foreground/5 backdrop-blur-sm rounded-xl p-4 border border-border-main">
                      <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                      <div className="text-xs text-muted font-medium">Total</div>
                  </div>
                  <div className="bg-brand-peach/10 backdrop-blur-sm rounded-xl p-4 border border-brand-peach/20">
                      <div className="text-2xl font-bold text-brand-peach">{stats.pending}</div>
                      <div className="text-xs text-brand-peach/70 font-medium">Pending</div>
                  </div>
                  <div className="bg-emerald-500/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20">
                      <div className="text-2xl font-bold text-emerald-500">{stats.approved}</div>
                      <div className="text-xs text-emerald-500/70 font-medium">Approved</div>
                  </div>
                  <div className="bg-rose-500/10 backdrop-blur-sm rounded-xl p-4 border border-rose-500/20">
                      <div className="text-2xl font-bold text-rose-500">{stats.rejected}</div>
                      <div className="text-xs text-rose-500/70 font-medium">Rejected</div>
                  </div>
                  <div className="bg-primary-light/10 backdrop-blur-sm rounded-xl p-4 border border-primary-light/20">
                      <div className="text-2xl font-bold text-primary">{stats.cancelled}</div>
                      <div className="text-xs text-primary/70 font-medium">Cancelled</div>
                  </div>
              </div>
            )}

        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 mb-6 border border-border-main shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              placeholder="Search by user, resource, or purpose..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border-main rounded-xl text-foreground placeholder-muted focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(0); }}
            className="px-4 py-2.5 bg-background border border-border-main rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
              queryClient.invalidateQueries({ queryKey: ["booking-stats"] });
            }}
            disabled={isFetching}
            className="p-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl disabled:opacity-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : error ? (
        <div className="text-center py-20 text-slate-400">
          <p>Failed to load bookings. Please try again.</p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-2xl overflow-hidden border border-border-main shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-foreground/5 border-b border-border-main">
                    <th className="p-4 font-semibold text-foreground/80">Requester</th>
                    <th className="p-4 font-semibold text-foreground/80">Resource</th>
                    <th className="p-4 font-semibold text-foreground/80">Purpose</th>
                    <th className="p-4 font-semibold text-foreground/80">Schedule</th>
                    <th className="p-4 font-semibold text-foreground/80">Status</th>
                    <th className="p-4 font-semibold text-foreground/80 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted">
                        <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No bookings found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="border-b border-border-main/50 hover:bg-foreground/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-muted" />
                            <div>
                              <div className="font-medium text-foreground">{b.requestedBy?.name || 'N/A'}</div>
                              <div className="text-xs text-muted">{b.requestedBy?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-muted" />
                            <div>
                              <div className="font-medium text-foreground">{b.resourceName || b.resourceId}</div>
                              <div className="text-xs text-muted">{b.resourceType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-muted">
                          <div className="max-w-[200px] truncate text-foreground/80" title={b.purpose}>{b.purpose}</div>
                          <div className="text-xs">Attendees: {b.expectedAttendees}</div>
                        </td>
                        <td className="p-4 text-foreground/80">
                          <div className="font-bold text-foreground leading-tight">{new Date(b.startTime).toLocaleDateString()}</div>
                          <div className="text-xs font-black uppercase tracking-tighter text-primary">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - 
                            {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(b.status)}
                          {b.status === "REJECTED" && b.rejectionReason && (
                            <div className="text-xs text-rose-500 mt-1 max-w-[150px] truncate" title={b.rejectionReason}>
                              {b.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => { setSelectedBookingId(b.id); setShowDetailsModal(true); }}
                              className="p-2 text-muted hover:text-primary hover:bg-foreground/5 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {b.status === "PENDING" && (
                              <>
                                <button 
                                  onClick={() => handleApprove(b.id, b.requestedBy?.name || "User")}
                                  className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button 
                                  onClick={() => handleReject(b.id, b.requestedBy?.name || "User")}
                                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                  title="Reject"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            {b.status === "APPROVED" && (
                              <button 
                                onClick={() => handleAdminCancel(b.id, b.requestedBy?.name || "User")}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Cancel Booking"
                              >
                                <XCircle size={16} />
                              </button>
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

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted">
                Page {data.page + 1} of {data.totalPages} ({data.totalElements} bookings)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={data.page === 0}
                  className="p-2 bg-background border border-border-main rounded-lg text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                  disabled={data.page >= data.totalPages - 1}
                  className="p-2 bg-background border border-border-main rounded-lg text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <BookingDetailsModal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedBookingId(null); }}
        bookingId={selectedBookingId}
      />
    </div>
  );
}
