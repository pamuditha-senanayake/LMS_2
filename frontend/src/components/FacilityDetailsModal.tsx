"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Users, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

interface Resource {
    id?: string;
    _id?: string;
    resourceName?: string;
    name?: string;
    resourceType?: string;
    type?: string;
    category?: "FACILITY" | "UTILITY";
    status?: string;
    capacity?: number;
    location?: string;
    serialNumber?: string;
    roomNumber?: string;
    campusLocation?: {
        campusName?: string;
        buildingName?: string;
        roomNumber?: string;
    };
    campusName?: string;
    building?: string;
    storageLocation?: string;
    resourceCode?: string;
    description?: string;
    amenities?: string[];
}

interface Booking {
    id?: string;
    _id?: string;
    resourceId?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
    purpose?: string;
    expectedAttendees?: number;
    supportNotes?: string;
    quantity?: number;
}

interface FacilityDetailsModalProps {
    resource: Resource;
    isOpen: boolean;
    onClose: () => void;
}

const formatType = (type: string): string => {
    if (type?.startsWith("OTHER:")) {
        return type.replace("OTHER:", "");
    }
    return type?.replace(/_/g, ' ') || 'Unknown';
};

const TIME_SLOTS = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

const UTILITY_TYPES = [
    "PROJECTOR", "SOUND_SYSTEM", "MICROPHONE", "WHITEBOARD", "FLAGS", "OTHER"
];

export default function FacilityDetailsModal({ resource, isOpen, onClose }: FacilityDetailsModalProps) {
    const router = useRouter();
    const resourceId = resource.id || resource._id;
    const resourceName = resource.resourceName || resource.name || "Unnamed Resource";
    const resourceType = resource.resourceType || resource.type || "GENERAL";
    const status = resource.status || "ACTIVE";
    const capacity = resource.capacity || 0;
    const category = resource.category || "FACILITY";

    const isUtility = category === "UTILITY" || UTILITY_TYPES.includes(resourceType);
    const isOutOfService = status === "OUT_OF_SERVICE";
    const isAvailable = status === "ACTIVE";

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [, setLoadingBookings] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedStartTime, setSelectedStartTime] = useState<string>("");
    const [selectedEndTime, setSelectedEndTime] = useState<string>("");
    const [purpose, setPurpose] = useState("");
    const [attendees, setAttendees] = useState<number>(1);
    const [supportNotes, setSupportNotes] = useState("");
    const [quantity, setQuantity] = useState<number>(1);
    const [isBooking, setIsBooking] = useState(false);

    const fetchBookings = useCallback(async () => {
        setLoadingBookings(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/bookings/resource/${resourceId}`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (err) {
            console.error("Failed to fetch bookings", err);
        } finally {
            setLoadingBookings(false);
        }
    }, [resourceId]);

    useEffect(() => {
        if (isOpen && resourceId) {
            fetchBookings();
        }
    }, [isOpen, resourceId, fetchBookings]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedDate("");
            setSelectedStartTime("");
            setSelectedEndTime("");
            setPurpose("");
            setAttendees(1);
            setSupportNotes("");
            setQuantity(1);
        }
    }, [isOpen]);

    const getLocationDisplay = () => {
        if (!isUtility) {
            const parts = [];
            if (resource.location) {
                parts.push(resource.location);
            }
            if (resource.roomNumber) {
                parts.push(resource.roomNumber);
            }
            return parts.length > 0 ? parts.join(' - ') : "N/A";
        } else {
            const storageLoc = resource.storageLocation || resource.location;
            if (storageLoc && resource.serialNumber) {
                return `${storageLoc} - ${resource.serialNumber}`;
            } else if (storageLoc) {
                return storageLoc;
            }
            return resource.serialNumber || "N/A";
        }
    };

    const getBookedSlotsForDate = (date: string): { start: string; end: string }[] => {
        if (!date) return [];
        return bookings
            .filter(b => b.status === "APPROVED" || b.status === "PENDING")
            .filter(b => {
                const bDate = b.startTime?.split('T')[0];
                return bDate === date;
            })
            .map(b => ({
                start: b.startTime?.split('T')[1]?.substring(0, 5) || "00:00",
                end: b.endTime?.split('T')[1]?.substring(0, 5) || "00:00"
            }));
    };

    const isSlotAvailable = (time: string): boolean => {
        if (!selectedDate) return false;
        const bookedSlots = getBookedSlotsForDate(selectedDate);
        return !bookedSlots.some(slot => {
            const slotStart = parseInt(time.split(':')[0]);
            const slotEnd = slotStart + 1;
            const bookedStart = parseInt(slot.start.split(':')[0]);
            const bookedEnd = parseInt(slot.end.split(':')[0]);
            return slotStart < bookedEnd && slotEnd > bookedStart;
        });
    };

    const isEndTimeValid = (): boolean => {
        if (!selectedStartTime || !selectedEndTime) return false;
        const start = parseInt(selectedStartTime.split(':')[0]);
        const end = parseInt(selectedEndTime.split(':')[0]);
        return end > start;
    };

    const canBook = isAvailable && !isOutOfService;

    const handleBook = async () => {
        if (!canBook) {
            Swal.fire("Error", "This facility is currently not available for booking", "error");
            return;
        }

        if (!selectedDate || !selectedStartTime || !selectedEndTime || !purpose.trim()) {
            Swal.fire("Error", "Please fill in all booking details", "error");
            return;
        }

        if (!isEndTimeValid()) {
            Swal.fire("Error", "End time must be after start time", "error");
            return;
        }

        setIsBooking(true);
        try {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                Swal.fire("Error", "Please log in to make a booking", "error");
                return;
            }
            const user = JSON.parse(storedUser);

            const startDateTime = `${selectedDate}T${selectedStartTime}:00`;
            const endDateTime = `${selectedDate}T${selectedEndTime}:00`;

            const bookingData: any = {
                resourceId: resourceId,
                requestedBy: {
                    userId: user.userId || user.id,
                    name: user.name || user.fullName,
                    email: user.email
                },
                purpose: purpose,
                startTime: startDateTime,
                endTime: endDateTime,
                type: isUtility ? "UTILITY" : "FACILITY"
            };

            if (isUtility) {
                bookingData.quantity = quantity;
                bookingData.supportNotes = supportNotes;
                bookingData.expectedAttendees = quantity;
            } else {
                bookingData.expectedAttendees = attendees;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/bookings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(bookingData)
            });

            console.log("Booking payload:", bookingData);

            if (res.ok) {
                await Swal.fire({
                    title: "Success!",
                    text: "Your booking has been submitted for approval",
                    icon: "success",
                    timer: 2000
                });
                onClose();
                router.push("/dashboard/bookings");
            } else if (res.status === 409) {
                const data = await res.json();
                Swal.fire("Error", data.message || "Time slot already booked", "error");
            } else if (res.status === 400) {
                const data = await res.json();
                const errorMsg = data.errors ? Object.values(data.errors).join(", ") : data.message || "Cannot book this resource";
                Swal.fire("Error", errorMsg, "error");
            } else {
                const data = await res.json().catch(() => ({}));
                const errorMsg = data.errors ? Object.values(data.errors).join(", ") : "Failed to create booking";
                Swal.fire("Error", errorMsg, "error");
            }
        } catch (err) {
            console.error("Booking error", err);
            Swal.fire("Error", "Failed to create booking", "error");
        } finally {
            setIsBooking(false);
        }
    };

    const getMinDate = (): string => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const isFormValid = (): boolean => {
        if (!selectedDate || !selectedStartTime || !selectedEndTime || !purpose.trim()) return false;
        if (!isEndTimeValid()) return false;
        return true;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border-main shadow-2xl">
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border-main bg-card">
                    <h2 className="text-2xl font-bold text-foreground">{resourceName}</h2>
                    <button onClick={onClose} className="p-2 text-muted hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-wrap gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            isUtility 
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                        }`}>
                            {formatType(resourceType)}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            isOutOfService 
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : isAvailable 
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        }`}>
                            {isOutOfService ? "Out of Service" : isAvailable ? "Available" : status}
                        </span>
                        {isUtility && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-amber-500/20 text-amber-400 border-amber-500/30">
                                UTILITY
                            </span>
                        )}
                    </div>

                    {isOutOfService && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
                            <div>
                                <p className="text-red-400 font-semibold">This facility is currently out of service</p>
                                <p className="text-red-300/70 text-sm">and cannot be booked at the moment.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center text-foreground/80">
                            <MapPin className="w-5 h-5 mr-3 text-muted" />
                            <div>
                                <p className="text-xs text-muted uppercase font-bold tracking-wider">Location</p>
                                <p className="font-medium">{getLocationDisplay()}</p>
                            </div>
                        </div>
                        {!isUtility && (
                            <div className="flex items-center text-foreground/80">
                                <Users className="w-5 h-5 mr-3 text-muted" />
                                <div>
                                    <p className="text-xs text-muted uppercase font-bold tracking-wider">Capacity</p>
                                    <p className="font-medium">{capacity} seats</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {resource.description && (
                        <div>
                            <p className="text-xs text-muted uppercase font-bold tracking-wider mb-1">Description</p>
                            <p className="text-foreground/80 leading-relaxed">{resource.description}</p>
                        </div>
                    )}

                    {resource.amenities && resource.amenities.length > 0 && !isUtility && (
                        <div>
                            <p className="text-xs text-muted uppercase font-bold tracking-wider mb-2">Amenities</p>
                            <div className="flex flex-wrap gap-2">
                                {resource.amenities.map((amenity, idx) => (
                                    <span key={idx} className="px-3 py-1 text-sm rounded-md bg-foreground/5 text-foreground/80 border border-border-main">
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {!canBook && !isOutOfService && (
                        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                            <div>
                                <p className="text-amber-400 font-semibold">This resource is not available for booking</p>
                                <p className="text-amber-300/70 text-sm">Current status: {status}</p>
                            </div>
                        </div>
                    )}

                    {canBook && (
                        <div className="border-t border-border-main pt-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">
                                {isUtility ? "Book this Utility" : "Book this Facility"}
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-muted font-bold mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        min={getMinDate()}
                                        className="w-full px-4 py-3 bg-foreground/5 border border-border-main rounded-xl text-foreground placeholder-muted focus:border-primary transition-all outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-muted font-bold mb-2">Start Time</label>
                                        <select
                                            value={selectedStartTime}
                                            onChange={(e) => {
                                                setSelectedStartTime(e.target.value);
                                                setSelectedEndTime("");
                                            }}
                                            className="w-full px-4 py-3 bg-foreground/5 border border-border-main rounded-xl text-foreground focus:border-primary transition-all outline-none cursor-pointer"
                                        >
                                            <option value="">Select start</option>
                                            {TIME_SLOTS.map(time => (
                                                <option key={time} value={time} disabled={Boolean(selectedDate && !isSlotAvailable(time))}>
                                                    {time} {selectedDate && !isSlotAvailable(time) ? '(Booked)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-muted font-bold mb-2">End Time</label>
                                        <select
                                            value={selectedEndTime}
                                            onChange={(e) => setSelectedEndTime(e.target.value)}
                                            disabled={!selectedStartTime}
                                            className="w-full px-4 py-3 bg-foreground/5 border border-border-main rounded-xl text-foreground focus:border-primary transition-all outline-none cursor-pointer disabled:opacity-50"
                                        >
                                            <option value="">Select end</option>
                                            {TIME_SLOTS.filter(t => {
                                                if (!selectedStartTime) return true;
                                                return parseInt(t.split(':')[0]) > parseInt(selectedStartTime.split(':')[0]);
                                            }).map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-muted font-bold mb-2">
                                        {isUtility ? "Purpose of Use" : "Purpose"}
                                    </label>
                                    <input
                                        type="text"
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        placeholder={isUtility ? "Describe how you will use this equipment" : "Enter booking purpose"}
                                        className="w-full px-4 py-3 bg-foreground/5 border border-border-main rounded-xl text-foreground placeholder-muted focus:border-primary transition-all outline-none"
                                    />
                                </div>

                                {isUtility ? (
                                    <>
                                        <div>
                                            <label className="block text-sm text-muted font-bold mb-2">Quantity Needed</label>
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                                min={1}
                                                max={10}
                                                className="w-full px-4 py-3 bg-foreground/5 border border-border-main rounded-xl text-foreground placeholder-muted focus:border-primary transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-muted font-bold mb-2">Setup/Support Notes</label>
                                            <textarea
                                                value={supportNotes}
                                                onChange={(e) => setSupportNotes(e.target.value)}
                                                placeholder="Any special setup requirements or support needed..."
                                                rows={2}
                                                className="w-full px-4 py-3 bg-foreground/5 border border-border-main rounded-xl text-foreground placeholder-muted focus:border-primary transition-all outline-none resize-none"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <label className="block text-sm text-muted font-bold mb-2">Expected Attendees</label>
                                        <input
                                            type="number"
                                            value={attendees}
                                            onChange={(e) => setAttendees(parseInt(e.target.value) || 1)}
                                            min={1}
                                            max={capacity}
                                            className="w-full px-4 py-3 bg-foreground/5 border border-border-main rounded-xl text-foreground placeholder-muted focus:border-primary transition-all outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-border-main bg-card">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-muted hover:text-foreground font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleBook}
                        disabled={isBooking || !canBook || !isFormValid()}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                            canBook 
                                ? "btn-primary-action"
                                : "bg-foreground/10 text-muted cursor-not-allowed"
                        }`}
                    >

                        {isBooking ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Booking...
                            </>
                        ) : !canBook ? (
                            <>
                                <AlertCircle className="w-5 h-5" />
                                Not Available
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Book Now
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
