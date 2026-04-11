"use client";

import { useEffect, useState } from "react";
import { X, QrCode as QrIcon, Calendar, Clock, MapPin, User, Download, CheckCircle, AlertCircle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface BookingDetails {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  resourceLocation: string;
  purpose: string;
  startTime: string;
  endTime: string;
  status: string;
  requestedBy: {
    name: string;
    email: string;
  };
}

interface BookingQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
}

export default function BookingQRCodeModal({ isOpen, onClose, bookingId }: BookingQRCodeModalProps) {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchBookingDetails();
    }
  }, [isOpen, bookingId]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/bookings/${bookingId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBooking(data);
      }
    } catch {
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodeValue = () => {
    if (!booking) return "";
    
    // Generate a public verification URL
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/verify/${booking.id}`;
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("booking-qr-code") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `booking-${bookingId}-qr.png`;
      link.href = url;
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-3xl shadow-2xl border border-border-main overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between p-6 border-b border-border-main bg-foreground/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
                <QrIcon size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Booking Ticket</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Generating Code...</p>
          </div>
        ) : booking ? (
          <div className="p-8 flex flex-col items-center text-center">
            {/* Ticket Aesthetic Header */}
            <div className="w-full mb-6 py-2 px-4 bg-primary/5 border border-primary/10 rounded-xl inline-flex items-center justify-center gap-2">
                {booking.status === "APPROVED" ? (
                    <CheckCircle size={14} className="text-emerald-500" />
                ) : (
                    <AlertCircle size={14} className="text-amber-500" />
                )}
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${booking.status === "APPROVED" ? "text-emerald-500" : "text-amber-500"}`}>
                    Status: {booking.status}
                </span>
            </div>

            <div className="p-6 bg-white rounded-[2rem] shadow-inner mb-8 border-4 border-slate-100 relative group">
              <QRCodeCanvas
                id="booking-qr-code"
                value={generateQRCodeValue()}
                size={220}
                level="H"
                includeMargin={true}
                imageSettings={{
                    src: "/A.png",
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 rounded-[1.5rem] pointer-events-none">
                <span className="bg-white/90 text-black px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Scan to Verify</span>
              </div>
            </div>

            <div className="space-y-1 mb-8">
              <h3 className="text-lg font-bold text-foreground leading-none">{booking.resourceName || booking.resourceId}</h3>
              <p className="text-xs text-muted font-medium flex items-center justify-center gap-1.5 uppercase tracking-widest">
                <MapPin size={12} className="text-primary" />
                {booking.resourceLocation || "Main Campus"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="p-3 bg-foreground/5 rounded-2xl border border-border-main text-left">
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Date</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <Calendar size={14} className="text-primary" />
                        {new Date(booking.startTime).toLocaleDateString()}
                    </div>
                </div>
                <div className="p-3 bg-foreground/5 rounded-2xl border border-border-main text-left">
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Time Range</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <Clock size={14} className="text-primary" />
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            <button
              onClick={downloadQRCode}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 group"
            >
              <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
              Download Ticket (PNG)
            </button>
            <p className="mt-6 text-[10px] text-muted font-bold uppercase tracking-[0.3em] opacity-40">Verification Ticket ID: {booking.id.slice(-8)}</p>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <p>Failed to load booking details</p>
          </div>
        )}
      </div>
    </div>
  );
}
