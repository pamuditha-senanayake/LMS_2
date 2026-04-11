"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Calendar, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, Eye, Trash2, Edit } from "lucide-react";
import Swal from "sweetalert2";
import BookingModal from "@/components/BookingModal";
import BookingDetailsModal from "@/components/BookingDetailsModal";
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

  const res = await fetch(`${apiUrl}/api/bookings/user/${userId}?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
};

const fetchUserBookings = async (page: number, size: number, status: string): Promise<PaginatedResponse> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (status) params.append("status", status);

  const storedUser = localStorage.getItem("user");
  if (!storedUser) throw new Error("Not authenticated");

  const user = JSON.parse(storedUser);
  const res = await fetch(`${apiUrl}/api/bookings/user/${user.id}?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
};

export default function MyBookingsPage() {
  const queryClient = useQueryClient();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editBooking, setEditBooking] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["bookings", page, size, status, type],
    queryFn: () => fetchUserBookings(page, size, status),
  });

  useEffect(() => {
    if (data) {
      setBookings(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    }
    if (data === null && !isLoading) {
      setLoading(false);
    }
  }, [data, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading]);

  const getStatusBadge = (bookingStatus: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
      REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
      CANCELLED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    const icons: Record<string, React.ReactElement> = {
      PENDING: <AlertCircle size={14} />,
      APPROVED: <CheckCircle size={14} />,
      REJECTED: <XCircle size={14} />,
      CANCELLED: <XCircle size={14} />,
    };
    const defaultStyle = "bg-gray-500/20 text-gray-400 border-gray-500/30";
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[bookingStatus] || defaultStyle}`}>
        {icons[bookingStatus] || <AlertCircle size={14} />}
        {bookingStatus}
      </span>
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleView = (id: string) => {
    setSelectedBooking(id);
    setShowDetailsModal(true);
  };

  const handleCancel = async (booking: Booking) => {
    const result = await Swal.fire({
      title: "Cancel Booking",
      text: "Are you sure you want to cancel this booking?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) throw new Error("Not authenticated");
        const user = JSON.parse(storedUser);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/bookings/${booking.id}/cancel`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId: user.id }),
        });

        if (res.ok) {
          Swal.fire("Success", "Booking cancelled successfully", "success");
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
        } else {
          Swal.fire("Error", "Failed to cancel booking", "error");
        }
      } catch {
        Swal.fire("Error", "Failed to cancel booking", "error");
      }
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      booking.resourceName?.toLowerCase().includes(searchLower) ||
      booking.purpose?.toLowerCase().includes(searchLower) ||
      booking.resourceType?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
        <button
          onClick={() => {
            setEditBooking(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          New Booking
        </button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border-main rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          className="px-4 py-2 bg-card border border-border-main rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border-main">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border-main">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Purpose</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Attendees</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{booking.resourceName || booking.resourceId}</div>
                        <div className="text-xs text-muted">{booking.resourceType}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-foreground">
                          <Calendar size={14} className="text-primary" />
                          {formatDateTime(booking.startTime)}
                        </div>
                        <div className="text-xs text-muted">
                          to {formatDateTime(booking.endTime)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{booking.purpose}</td>
                      <td className="px-4 py-3 text-foreground">{booking.expectedAttendees}</td>
                      <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(booking.id)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} className="text-primary" />
                          </button>
                          {(booking.status === "PENDING" || booking.status === "APPROVED") && (
                            <button
                              onClick={() => handleCancel(booking)}
                              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Cancel Booking"
                            >
                              <Trash2 size={16} className="text-red-500" />
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted">
                Showing {page * size + 1} to {Math.min((page + 1) * size, totalElements)} of {totalElements} bookings
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-muted">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    </div>
  );
}