"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface CalendarBooking {
  id: string;
  resourceId: string;
  resourceName?: string;
  purpose: string;
  startTime: string;
  endTime: string;
  status: string;
  requestedBy?: {
    name: string;
  };
}

interface BookingCalendarProps {
  onBookingClick?: (bookingId: string) => void;
}

export default function BookingCalendar({ onBookingClick }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<string>("");
  const [resources, setResources] = useState<any[]>([]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [currentMonth, currentYear, selectedResource]);

  const fetchResources = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/resources`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      }
    } catch {
      // Silently fail
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      let url = `${apiUrl}/api/bookings?sortBy=startTime&sortDirection=ASC`;
      if (selectedResource) {
        url += `&resourceId=${selectedResource}`;
      }
      
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const monthBookings = (data.content || []).filter((b: CalendarBooking) => {
          const bookingDate = new Date(b.startTime);
          return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        });
        setBookings(monthBookings);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForDay = (day: number) => {
    return bookings.filter((b) => {
      const bookingDate = new Date(b.startTime);
      return bookingDate.getDate() === day && 
             bookingDate.getMonth() === currentMonth && 
             bookingDate.getFullYear() === currentYear;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500/20 border-emerald-500/50 text-emerald-400";
      case "PENDING":
        return "bg-amber-500/20 border-amber-500/50 text-amber-400";
      case "REJECTED":
        return "bg-red-500/20 border-red-500/50 text-red-400";
      default:
        return "bg-slate-500/20 border-slate-500/50 text-slate-400";
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] p-2 border border-slate-800 bg-slate-900/50" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayBookings = getBookingsForDay(day);
      const isToday = 
        day === new Date().getDate() && 
        currentMonth === new Date().getMonth() && 
        currentYear === new Date().getFullYear();

      days.push(
        <div key={day} className={`min-h-[120px] p-2 border ${isToday ? "border-indigo-500 bg-indigo-500/5" : "border-slate-800"}`}>
          <div className={`text-sm font-medium mb-2 ${isToday ? "text-indigo-400" : "text-slate-400"}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayBookings.slice(0, 3).map((booking) => (
              <button
                key={booking.id}
                onClick={() => onBookingClick?.(booking.id)}
                className={`w-full text-left px-2 py-1 rounded text-xs border ${getStatusColor(booking.status)} hover:opacity-80 transition-opacity truncate`}
                title={`${booking.resourceName || booking.resourceId} - ${booking.purpose}`}
              >
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  <span className="truncate">
                    {new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="truncate font-medium">{booking.resourceName || booking.resourceId}</div>
              </button>
            ))}
            {dayBookings.length > 3 && (
              <div className="text-xs text-slate-500 text-center">
                +{dayBookings.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <ChevronLeft size={18} className="text-slate-300" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            </div>
          </div>
          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Resources</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>{r.resourceName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-slate-800/30">
        {dayNames.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-slate-400 border-b border-slate-800">
            {day}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-7">
          {renderCalendarDays()}
        </div>
      )}

      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
            <span className="text-slate-400">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/50" />
            <span className="text-slate-400">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/50" />
            <span className="text-slate-400">Rejected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
