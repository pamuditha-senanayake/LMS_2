"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Calendar, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, Eye, Trash2, Edit, QrCode } from "lucide-react";
import Swal from "sweetalert2";
import BookingModal from "@/components/BookingModal";
import BookingDetailsModal from "@/components/BookingDetailsModal";
import BookingQRCodeModal from "@/components/BookingQRCodeModal";
import { TableSkeleton } from "@/components/Skeleton";

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

interface PaginatedResponse {
  content: Booking[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
}

const fetchBookings = async (userId: string, page: number, size: number, sortBy: string, sortDir: string, status: string, type: string): Promise<PaginatedResponse> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sortBy,
    sortDirection: sortDir,
  });
  if (status) params.append("status", status);
  if (type) params.append("type", type);
  
  const res = await fetch(`${apiUrl}/api/bookings?userId=${userId}&${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
};

export default function MyBookings() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [qrBookingId, setQrBookingId] = useState<string | null>(null);
  const [editBooking, setEditBooking] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
  });
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings", currentUser?.id, page, filters.status, filters.type, sortOrder],
    queryFn: () => fetchBookings(
      currentUser?.id || "",
      page,
      10,
      "createdAt",
      sortOrder === "newest" ? "DESC" : "ASC",
      filters.status,
      filters.type
    ),
    enabled: !!currentUser?.id,
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

  const handleDelete = useCallback((booking: Booking) => {
    Swal.fire({
      title: `Delete Booking`,
      html: `
        <div style="text-align: center; padding: 1rem 0;">
          <div style="width: 64px; height: 64px; margin: 0 auto 1rem; background: rgba(239, 68, 68, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </div>
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 0.5rem;">Are you sure you want to delete this booking request?</p>
          <p style="color: #64748b; font-size: 13px;">This action cannot be undone.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Delete',
      background: '#020617',
      color: '#ffffff',
      padding: '2rem'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
          const res = await fetch(`${apiUrl}/api/bookings/${booking.id}`, {
            method: "DELETE",
            credentials: "include"
          });

          if (res.ok) {
            Swal.fire({ 
                title: "Deleted!",
                html: `
                  <div style="text-align: center; padding: 1rem 0;">
                    <div style="width: 64px; height: 64px; margin: 0 auto 1rem; background: rgba(16, 185, 129, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <p style="color: #94a3b8; font-size: 14px;">Booking has been deleted successfully.</p>
                  </div>
                `,
                background: '#020617', 
                color: '#ffffff',
                padding: '2rem'
            });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
          } else {
            Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
          }
        } catch {
          Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
      }
    });
  }, [queryClient]);

  const handleCancel = useCallback((booking: Booking) => {
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
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 0.5rem;">Are you sure you want to cancel this booking?</p>
          <p style="color: #64748b; font-size: 13px;">This action cannot be undone.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      cancelButtonText: 'Close',
      confirmButtonText: 'Cancel Booking',
      background: '#020617',
      color: '#ffffff',
      padding: '2rem'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
          const url = new URL(`${apiUrl}/api/bookings/${booking.id}/cancel`);
          url.searchParams.append("userId", currentUser?.id || "");
          
          const res = await fetch(url.toString(), {
            method: "POST",
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
                    <p style="color: #94a3b8; font-size: 14px;">Booking has been cancelled successfully.</p>
                  </div>
                `,
                background: '#020617', 
                color: '#ffffff',
                padding: '2rem'
            });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            setShowDetailsModal(false);
          } else {
            Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
          }
        } catch {
          Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
      }
    });
  }, [currentUser, queryClient]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
      CANCELLED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.PENDING}`}>
        {status === "PENDING" && <AlertCircle size={12} />}
        {status === "APPROVED" && <CheckCircle size={12} />}
        {status === "REJECTED" && <XCircle size={12} />}
        {status === "CANCELLED" && <XCircle size={12} />}
        {status}
      </span>
    );
  };

  const bookings = data?.content || [];
  const filteredBookings = debouncedSearch
    ? bookings.filter((b) =>
        b.purpose.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.resourceName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.resourceId.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : bookings;

  return (
    <div className="p-6 text-foreground max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase italic">
            My <span className="text-primary not-italic">Bookings</span>
        </h1>
        <button 
          onClick={() => {
            setEditBooking(null);
            setShowModal(true);
          }}
          className="px-6 py-2.5 btn-primary-action rounded-xl font-bold flex items-center gap-2"
        >

          <Plus size={18} />
          Request Booking
        </button>
      </div>

      <div className="bg-card rounded-2xl p-4 mb-6 border border-border-main shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              placeholder="Search bookings..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border-main rounded-xl text-foreground placeholder-muted focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
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
            <select
              value={filters.type}
              onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(0); }}
              className="px-4 py-2.5 bg-background border border-border-main rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="FACILITY">Facility</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="LAB">Lab</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value as "newest" | "oldest"); setPage(0); }}
              className="px-4 py-2.5 bg-background border border-border-main rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
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
                    <th className="p-4 font-bold text-foreground/80">Resource</th>
                    <th className="p-4 font-bold text-foreground/80">Purpose</th>
                    <th className="p-4 font-bold text-foreground/80">Date & Time</th>
                    <th className="p-4 font-bold text-foreground/80">Status</th>
                    <th className="p-4 font-bold text-foreground/80 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        <Calendar size={40} className="mx-auto mb-3 opacity-50" />
                        <p>No bookings found</p>
                        <p className="text-sm mt-1">Create your first booking request</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="border-b border-border-main/50 hover:bg-foreground/5 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-foreground">{b.resourceName || b.resourceId}</div>
                          <div className="text-xs text-muted font-medium uppercase tracking-wider">{b.resourceType} - {b.type}</div>
                        </td>
                        <td className="p-4 text-foreground/80">
                          <div className="max-w-[200px] truncate font-medium" title={b.purpose}>{b.purpose}</div>
                          <div className="text-xs text-muted">Attendees: {b.expectedAttendees}</div>
                        </td>
                        <td className="p-4 text-sm text-foreground/80">
                          <div className="font-semibold">{new Date(b.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-xs text-muted font-medium">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - 
                            {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(b.status)}
                          {b.status === "REJECTED" && b.rejectionReason && (
                            <div className="text-xs text-red-400 mt-1 max-w-[150px] truncate" title={b.rejectionReason}>
                              {b.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                             <button 
                              onClick={() => { setQrBookingId(b.id); setShowQRCodeModal(true); }}
                              className="p-2 text-muted hover:text-primary hover:bg-foreground/5 rounded-lg transition-colors"
                              title="Generate QR Ticket"
                            >
                              <QrCode size={16} />
                            </button>
                             <button 
                              onClick={() => { setSelectedBooking(b.id); setShowDetailsModal(true); }}
                              className="p-2 text-muted hover:text-primary hover:bg-foreground/5 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {b.status === "PENDING" && (
                              <>
                                <button 
                                  onClick={() => { setEditBooking(b); setShowModal(true); }}
                                  className="p-2 text-muted hover:text-brand-peach hover:bg-foreground/5 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(b)}
                                  className="p-2 text-muted hover:text-rose-500 hover:bg-foreground/5 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
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
              <p className="text-sm text-slate-400">
                Page {data.page + 1} of {data.totalPages} ({data.totalElements} bookings)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={data.first}
                  className="p-2 bg-background border border-border-main rounded-lg text-muted hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                  disabled={data.last}
                  className="p-2 bg-background border border-border-main rounded-lg text-muted hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <BookingModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditBooking(null); }}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["bookings"] })}
        editBooking={editBooking}
      />

      <BookingDetailsModal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedBooking(null); }}
        bookingId={selectedBooking}
        onCancel={() => {
          const booking = bookings.find((b) => b.id === selectedBooking);
          if (booking) handleCancel(booking);
        }}
      />

      <BookingQRCodeModal
        isOpen={showQRCodeModal}
        onClose={() => { setShowQRCodeModal(false); setQrBookingId(null); }}
        bookingId={qrBookingId}
      />
    </div>
  );
}
