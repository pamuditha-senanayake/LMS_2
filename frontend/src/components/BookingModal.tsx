"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, Clock, Users, MapPin, FileText, AlertCircle, Check } from "lucide-react";

interface Resource {
  id: string;
  resourceName: string;
  type: string;
  capacity: number;
  campusName?: string;
  building?: string;
  roomNumber?: string;
}

interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface AvailabilityResponse {
  resourceId: string;
  resourceName: string;
  available: boolean;
  availableSlots: AvailabilitySlot[];
  conflicts: Array<{
    bookingId: string;
    purpose: string;
    startTime: string;
    endTime: string;
  }>;
}

interface BookingData {
  category: string;
  type: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  capacityLabel: string;
  purpose?: string;
  quantity?: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editBooking?: {
    id: string;
    resourceId: string;
    purpose: string;
    expectedAttendees: number;
    startTime: string;
    endTime: string;
    type: string;
  };
  prefilledData?: BookingData | null;
}

export default function BookingModal({ isOpen, onClose, onSuccess, editBooking, prefilledData }: BookingModalProps) {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [purpose, setPurpose] = useState<string>("");
  const [expectedAttendees, setExpectedAttendees] = useState<number>(1);
  const [bookingType, setBookingType] = useState<string>("FACILITY");
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchResources();
      if (editBooking) {
        setSelectedResource({ id: editBooking.resourceId, resourceName: editBooking.resourceId, type: "", capacity: 0 });
        setPurpose(editBooking.purpose);
        setExpectedAttendees(editBooking.expectedAttendees);
        setStartTime(editBooking.startTime.split("T")[1]?.substring(0, 5) || "09:00");
        setEndTime(editBooking.endTime.split("T")[1]?.substring(0, 5) || "10:00");
        setSelectedDate(editBooking.startTime.split("T")[0]);
        setBookingType(editBooking.type);
      } else if (prefilledData) {
        setSelectedDate(prefilledData.date || "");
        setStartTime(prefilledData.startTime || "09:00");
        setEndTime(prefilledData.endTime || "10:00");
        setPurpose(prefilledData.purpose || "");
        setExpectedAttendees(prefilledData.capacity || 1);
      } else {
        setSelectedResource(null);
        setPurpose("");
        setExpectedAttendees(1);
        setStartTime("09:00");
        setEndTime("10:00");
        setSelectedDate("");
        setBookingType("FACILITY");
      }
    }
  }, [isOpen, editBooking, prefilledData]);

  useEffect(() => {
    if (selectedResource && selectedDate) {
      fetchAvailability();
    }
  }, [selectedResource, selectedDate]);

  const fetchResources = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/resources`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      }
    } catch {
      setError("Failed to load resources");
    }
  };

  const fetchAvailability = async () => {
    if (!selectedResource) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(
        `${apiUrl}/api/resources/${selectedResource.id}/availability?date=${selectedDate}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setAvailability(data);
      }
    } catch {
      // Silently fail for availability
    }
  };

  const handleSubmit = async () => {
    if (!selectedResource || !selectedDate || !purpose) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const userRes = await fetch(`${apiUrl}/api/auth/me`, { credentials: "include" });
      const user = userRes.ok ? await userRes.json() : null;

      const payload = {
        resourceId: selectedResource.id,
        purpose,
        expectedAttendees,
        startTime: formatDateTime(selectedDate, startTime),
        endTime: formatDateTime(selectedDate, endTime),
        type: bookingType,
        requestedByUserId: user?.id || "anonymous",
        requestedByName: user?.name || "Anonymous",
        requestedByEmail: user?.email || "anonymous@example.com",
      };

      const res = editBooking
        ? await fetch(`${apiUrl}/api/bookings/${editBooking.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          })
        : await fetch(`${apiUrl}/api/bookings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        onSuccess();
        onClose();
        router.push("/dashboard/my-bookings");
      } else {
        const errText = await res.text();
        if (errText.startsWith("BOOKING_CONFLICT:")) {
          const conflictMsg = errText.replace("BOOKING_CONFLICT:", "");
          setError(conflictMsg);
        } else if (errText.startsWith("RESOURCE_OUT_OF_SERVICE:")) {
          setError(errText.replace("RESOURCE_OUT_OF_SERVICE:", ""));
        } else if (errText.startsWith("TIME_TOO_SOON:")) {
          setError(errText.replace("TIME_TOO_SOON:", ""));
        } else {
          setError(errText || "Failed to create booking");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeSlots = () => {
    if (!availability?.availableSlots) return [];
    return availability.availableSlots;
  };

  const formatDateTime = (date: string, time: string) => {
    const [hours, minutes] = time.split(":");
    return `${date}T${hours}:${minutes}:00`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">
            {editBooking ? "Edit Booking Request" : "Request New Booking"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <MapPin size={16} />
              Resource <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedResource?.id || ""}
              onChange={(e) => {
                const resource = resources.find((r) => r.id === e.target.value);
                setSelectedResource(resource || null);
                setAvailability(null);
              }}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={!!editBooking}
            >
              <option value="">Select a resource</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.resourceName} - {resource.type} (Capacity: {resource.capacity})
                </option>
              ))}
            </select>
          </div>

          {selectedResource && (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Type:</span>
                  <span className="ml-2 text-white">{selectedResource.type}</span>
                </div>
                <div>
                  <span className="text-slate-400">Capacity:</span>
                  <span className="ml-2 text-white">{selectedResource.capacity}</span>
                </div>
                <div>
                  <span className="text-slate-400">Campus:</span>
                  <span className="ml-2 text-white">{selectedResource.campusName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Location:</span>
                  <span className="ml-2 text-white">
                    {selectedResource.building} {selectedResource.roomNumber}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Calendar size={16} />
                Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                Type
              </label>
              <select
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="FACILITY">Facility</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="LAB">Lab</option>
              </select>
            </div>
          </div>

          {selectedDate && selectedResource && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Clock size={16} />
                Time Slot
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Start Time</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {getTimeSlots().map((slot) => (
                      <option
                        key={slot.startTime}
                        value={slot.startTime}
                        disabled={!slot.available}
                        className={slot.available ? "text-white" : "text-slate-500 line-through"}
                      >
                        {slot.startTime} {!slot.available && "- Unavailable"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">End Time</label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {getTimeSlots()
                      .filter((slot) => slot.startTime > startTime || slot.available)
                      .map((slot) => (
                        <option
                          key={slot.startTime}
                          value={slot.startTime}
                          disabled={slot.startTime <= startTime}
                        >
                          {slot.endTime}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              {availability && !availability.available && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-400 font-medium mb-2">
                    Conflicts found for this date:
                  </p>
                  <ul className="text-xs text-amber-300 space-y-1">
                    {availability.conflicts.map((conflict) => (
                      <li key={conflict.bookingId}>
                        {conflict.startTime} - {conflict.endTime}: {conflict.purpose}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <FileText size={16} />
              Purpose <span className="text-red-400">*</span>
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              placeholder="Describe the purpose of your booking..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Users size={16} />
              Expected Attendees
            </label>
            <input
              type="number"
              value={expectedAttendees}
              onChange={(e) => setExpectedAttendees(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={selectedResource?.capacity || 100}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {selectedResource && (
              <p className="text-xs text-slate-400 mt-1">
                Maximum capacity: {selectedResource.capacity}
              </p>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-slate-700 bg-slate-900 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedResource || !selectedDate || !purpose}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {editBooking ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Check size={18} />
                {editBooking ? "Update Booking" : "Create Booking"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
