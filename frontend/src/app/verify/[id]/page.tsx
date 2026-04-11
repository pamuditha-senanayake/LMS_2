"use client";

import { useEffect, useState, use } from "react";
import { CheckCircle, XCircle, AlertCircle, Calendar, Clock, MapPin, User, ShieldCheck } from "lucide-react";
import Link from "next/link";

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
  createdAt: string;
}

export default function VerifyBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/bookings/public/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data);
        } else {
          setError("Invalid or expired booking ticket.");
        }
      } catch (err) {
        setError("Unable to connect to verification server.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60">Authenticating Ticket...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="p-4 bg-red-500/10 rounded-full mb-6">
            <XCircle size={48} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Verification Failed</h1>
        <p className="text-slate-400 mb-8 max-w-xs">{error || "This booking record could not be found or is no longer valid."}</p>
        <Link href="/" className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
          Return Home
        </Link>
      </div>
    );
  }

  const isApproved = booking.status === "APPROVED";

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center p-6 sm:p-12 font-sans">
      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
      
      <div className="relative w-full max-w-md">
        {/* Verification Badge */}
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="p-3 bg-indigo-500/20 rounded-2xl mb-4 border border-indigo-500/30">
                <ShieldCheck size={32} className="text-indigo-400" />
           </div>
           <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                Course<span className="text-indigo-500 not-italic">Flow</span>
           </h1>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/60 mt-2">Official Verification System</p>
        </div>

        {/* The Ticket Card */}
        <div className="bg-[#18181b] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
            {/* Ticket Header/Status */}
            <div className={`p-8 text-center border-b border-white/5 ${isApproved ? "bg-emerald-500/5" : "bg-amber-500/5"}`}>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4 ${
                    isApproved ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}>
                    {isApproved ? <CheckCircle size={16} strokeWidth={3} /> : <AlertCircle size={16} strokeWidth={3} />}
                    <span className="text-xs font-black uppercase tracking-widest">{booking.status}</span>
                </div>
                <h2 className="text-2xl font-black text-white px-4">{booking.resourceName}</h2>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-[0.2em] mt-2 flex items-center justify-center gap-1.5">
                    <MapPin size={12} className="text-indigo-500" />
                    {booking.resourceLocation || "Main Campus"}
                </p>
            </div>

            {/* Ticket Body */}
            <div className="p-8 space-y-8">
                {/* Time & Date Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scheduled Date</p>
                        <div className="flex items-center gap-2 font-bold text-sm">
                            <Calendar size={16} className="text-indigo-500" />
                            {new Date(booking.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time Slot</p>
                        <div className="flex items-center gap-2 font-bold text-sm">
                            <Clock size={16} className="text-indigo-500" />
                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Purpose of Visit</p>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 italic text-sm text-slate-200 leading-relaxed font-medium">
                        "{booking.purpose}"
                    </div>
                </div>

                {/* Requested By */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Authorized User</p>
                    <div className="flex items-center gap-4 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-black text-lg">
                            {booking.requestedBy?.name?.[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-sm leading-none mb-1">{booking.requestedBy?.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{booking.requestedBy?.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ticket Footer / Security Hash */}
            <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex flex-col items-center">
                <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest text-center truncate w-full">
                    AUTH_SIG: {id?.slice(0, 12)}...{booking.createdAt.slice(-8)}
                </p>
                <div className="mt-4 opacity-20">
                    <ShieldCheck size={20} />
                </div>
            </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            &copy; 2026 CourseFlow Educational Systems
        </p>
      </div>
    </div>
  );
}
