"use client";

import { X } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";

const CATEGORY_OPTIONS = [
    { value: "FACILITY", label: "Facilities" },
    { value: "UTILITY", label: "Utilities" },
];

const STATUS_OPTIONS = [
    { value: "ACTIVE", label: "ACTIVE" },
    { value: "OUT_OF_SERVICE", label: "OUT_OF_SERVICE" },
    { value: "MAINTENANCE_REQUIRED", label: "MAINTENANCE_REQUIRED" },
];

const LOCATION_OPTIONS = [
    { value: "IT", label: "IT" },
    { value: "Medicine", label: "Medicine" },
    { value: "Engineering", label: "Engineering" },
    { value: "Architecture", label: "Architecture" },
];

const FACILITY_TYPES = [
    { value: "LECTURE_HALL", label: "Lecture Hall" },
    { value: "LAB", label: "Lab" },
    { value: "AUDITORIUM", label: "Auditorium" },
    { value: "MEETING_ROOM", label: "Meeting Room" },
    { value: "ROOM", label: "Room" },
];

const UTILITY_TYPES = [
    { value: "PROJECTOR", label: "Projector" },
    { value: "SOUND_SYSTEM", label: "Sound System" },
    { value: "MICROPHONE", label: "Microphone" },
    { value: "WHITEBOARD", label: "Whiteboard" },
    { value: "FLAGS", label: "Flags" },
    { value: "OTHER", label: "Other (Specify)" },
];

const AMENITY_OPTIONS = [
    { value: "Projector", label: "Projector" },
    { value: "WiFi", label: "WiFi" },
    { value: "AC", label: "AC" },
    { value: "Whiteboard", label: "Whiteboard" },
    { value: "Sound System", label: "Sound System" },
    { value: "Smart Display", label: "Smart Display" },
    { value: "Microphone", label: "Microphone" },
];

interface ValidationErrors {
    resourceName?: string;
    category?: string;
    type?: string;
    status?: string;
    location?: string;
    roomNumber?: string;
    serialNumber?: string;
    capacity?: string;
}

interface AddResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddResourceModal({ isOpen, onClose, onSuccess }: AddResourceModalProps) {
    const [category, setCategory] = useState<"FACILITY" | "UTILITY">("FACILITY");
    const [resourceName, setResourceName] = useState("");
    const [resourceType, setResourceType] = useState("LECTURE_HALL");
    const [status, setStatus] = useState("ACTIVE");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [roomNumber, setRoomNumber] = useState("");
    const [serialNumber, setSerialNumber] = useState("");
    const [capacity, setCapacity] = useState<number | "">("");
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [customUtilityType, setCustomUtilityType] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const typeOptions = category === "FACILITY" ? FACILITY_TYPES : UTILITY_TYPES;
    const showCustomTypeField = category === "UTILITY" && resourceType === "OTHER";

    const handleCategoryChange = (newCategory: "FACILITY" | "UTILITY") => {
        setCategory(newCategory);
        setResourceType(newCategory === "FACILITY" ? "LECTURE_HALL" : "PROJECTOR");
        setCustomUtilityType("");
        setRoomNumber("");
        setSerialNumber("");
        setCapacity("");
        setSelectedAmenities([]);
        setErrors({});
    };

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev => 
            prev.includes(amenity) 
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };

    const handleTypeChange = (newType: string) => {
        setResourceType(newType);
        if (newType !== "OTHER") {
            setCustomUtilityType("");
        }
    };

    const handleCapacityChange = (value: string) => {
        const num = value === "" ? "" : Number(value);
        setCapacity(num);
        if (num !== "" && num < 0) {
            setErrors(prev => ({ ...prev, capacity: "Capacity cannot be negative" }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.capacity;
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: ValidationErrors = {};
        let isValid = true;

        if (!resourceName.trim()) {
            newErrors.resourceName = "Resource Name is required";
            isValid = false;
        }
        if (!category) {
            newErrors.category = "Category is required";
            isValid = false;
        }
        if (!resourceType) {
            newErrors.type = "Type is required";
            isValid = false;
        }
        if (!status) {
            newErrors.status = "Status is required";
            isValid = false;
        }
        if (!location) {
            newErrors.location = "Location is required";
            isValid = false;
        }
        if (category === "FACILITY") {
            if (!roomNumber.trim()) {
                newErrors.roomNumber = "Room Number is required";
                isValid = false;
            }
            if (capacity === "" || capacity === null) {
                newErrors.capacity = "Capacity is required";
                isValid = false;
            } else if (typeof capacity === "number" && capacity < 0) {
                newErrors.capacity = "Capacity cannot be negative";
                isValid = false;
            }
        }
        if (category === "UTILITY") {
            if (!serialNumber.trim()) {
                newErrors.serialNumber = "Serial Number is required";
                isValid = false;
            }
        }

        console.log("Validation:", { resourceName, category, resourceType, status, location, roomNumber, serialNumber, capacity, errors: newErrors, isValid });
        
        setErrors(newErrors);
        return isValid;
    };

    const resetForm = () => {
        setCategory("FACILITY");
        setResourceName("");
        setResourceType("LECTURE_HALL");
        setStatus("ACTIVE");
        setLocation("");
        setDescription("");
        setRoomNumber("");
        setSerialNumber("");
        setCapacity("");
        setSelectedAmenities([]);
        setCustomUtilityType("");
        setErrors({});
    };

    const handleSubmit = async () => {
        console.log("Form submit started");
        console.log("Form state:", { resourceName, category, resourceType, status, location, roomNumber, serialNumber, capacity, customUtilityType });

        if (!validate()) {
            console.log("Validation failed, not submitting");
            return;
        }

        setIsSubmitting(true);

        let finalType = resourceType;
        let finalDescription = description;
        
        if (resourceType === "OTHER" && customUtilityType.trim()) {
            finalType = `OTHER:${customUtilityType.trim()}`;
            finalDescription = customUtilityType.trim();
        }

        const payload: Record<string, any> = {
            resourceName: resourceName.trim(),
            category: category,
            type: finalType,
            description: finalDescription,
            status: status,
            location: location,
            resourceCode: `RES-${Math.floor(1000 + Math.random() * 9000)}`
        };

        if (category === "FACILITY") {
            payload.capacity = capacity !== "" ? capacity : 0;
            payload.roomNumber = roomNumber;
            payload.building = location;
            payload.campusName = location;
            payload.amenities = selectedAmenities;
        } else {
            payload.serialNumber = serialNumber;
            payload.storageLocation = location;
            payload.building = location;
            payload.roomNumber = "";
            payload.campusName = location;
            payload.amenities = [];
        }

        console.log("Request payload:", JSON.stringify(payload, null, 2));

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/resources`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const responseData = await res.text();
            console.log("Response status:", res.status);
            console.log("Response body:", responseData);

            if (res.ok) {
                Swal.fire({ 
                    title: "Resource Added!", 
                    text: "The new resource has been created successfully.", 
                    icon: "success", 
                    background: '#ffffff', 
                    color: '#1e293b',
                    confirmButtonColor: '#0f172a'
                });
                resetForm();
                onSuccess();
                onClose();
            } else {
                let errorMessage = responseData;
                try {
                    const errorJson = JSON.parse(responseData);
                    if (errorJson.message) {
                        errorMessage = errorJson.message;
                    } else if (errorJson.errors) {
                        errorMessage = Object.entries(errorJson.errors).map(([k, v]) => `${k}: ${v}`).join(", ");
                    }
                } catch {}
                Swal.fire({ 
                    title: "Failed", 
                    text: errorMessage, 
                    icon: "error", 
                    background: '#ffffff', 
                    color: '#1e293b'
                });
            }
        } catch (error) {
            console.error("Network error:", error);
            Swal.fire({ title: "Error", text: "Network processing failed: " + (error as Error).message, icon: "error", background: '#ffffff', color: '#1e293b' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const isValid = resourceName.trim() && category && resourceType && status && location && 
        (category === "FACILITY" ? (roomNumber.trim() && capacity !== "" && (capacity as number) >= 0) : serialNumber.trim());

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            <div className="w-full max-w-lg bg-card rounded-[2rem] shadow-2xl border border-border-main overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Add New Resource</h2>
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-sm font-medium text-muted">Create a new facility or utility resource</p>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 ml-0.5">Category</label>
                        <div className="flex p-1 bg-slate-100 rounded-xl">
                            {CATEGORY_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleCategoryChange(opt.value as "FACILITY" | "UTILITY")}
                                    className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${
                                        category === opt.value
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-muted hover:text-foreground hover:bg-foreground/5'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-0.5">Resource Name</label>
                            <input
                                type="text"
                                value={resourceName}
                                onChange={(e) => setResourceName(e.target.value)}
                                placeholder={category === "FACILITY" ? "Main Auditorium" : "Epson Projector #1"}
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all outline-none ${errors.resourceName ? 'border-red-400' : 'border-slate-200'}`}
                            />
                            {errors.resourceName && <p className="mt-1 text-xs text-red-500 ml-0.5">{errors.resourceName}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-0.5">Location</label>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all outline-none cursor-pointer ${errors.location ? 'border-red-400' : 'border-slate-200'}`}
                            >
                                <option value="">Select</option>
                                {LOCATION_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            {errors.location && <p className="mt-1 text-xs text-red-500 ml-0.5">{errors.location}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-0.5">Type</label>
                            <select
                                value={resourceType}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all outline-none cursor-pointer ${errors.type ? 'border-red-400' : 'border-slate-200'}`}
                            >
                                <option value="">Select</option>
                                {typeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            {errors.type && <p className="mt-1 text-xs text-red-500 ml-0.5">{errors.type}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-0.5">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all outline-none cursor-pointer ${errors.status ? 'border-red-400' : 'border-slate-200'}`}
                            >
                                <option value="">Select</option>
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            {errors.status && <p className="mt-1 text-xs text-red-500 ml-0.5">{errors.status}</p>}
                        </div>
                    </div>

                    {showCustomTypeField && (
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-0.5">Specify Utility Type</label>
                            <input
                                type="text"
                                value={customUtilityType}
                                onChange={(e) => setCustomUtilityType(e.target.value)}
                                placeholder="e.g., Speaker Stand, Extension Cord"
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all outline-none"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-0.5">
                            {category === "FACILITY" ? "Description" : "Notes"}
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder={category === "FACILITY" ? "Large auditorium with AV equipment..." : "Serial number, condition, notes..."}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all outline-none resize-none"
                        />
                    </div>

                    {category === "FACILITY" ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-0.5">Room Number</label>
                                    <input
                                        type="text"
                                        value={roomNumber}
                                        onChange={(e) => setRoomNumber(e.target.value)}
                                        placeholder="A-101"
                                        className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all outline-none ${errors.roomNumber ? 'border-red-400' : 'border-slate-200'}`}
                                    />
                                    {errors.roomNumber && <p className="mt-1 text-xs text-red-500 ml-0.5">{errors.roomNumber}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-0.5">Capacity</label>
                                    <input
                                        type="number"
                                        value={capacity}
                                        onChange={(e) => handleCapacityChange(e.target.value)}
                                        placeholder="50"
                                        min="0"
                                        className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all outline-none ${errors.capacity ? 'border-red-400' : 'border-slate-200'}`}
                                    />
                                    {errors.capacity && <p className="mt-1 text-xs text-red-500 ml-0.5">{errors.capacity}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-2 ml-0.5">Amenities</label>
                                <div className="flex flex-wrap gap-2">
                                    {AMENITY_OPTIONS.map(amenity => (
                                        <button
                                            key={amenity.value}
                                            type="button"
                                            onClick={() => toggleAmenity(amenity.value)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                                selectedAmenities.includes(amenity.value)
                                                    ? 'bg-slate-800 border-slate-800 text-white'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                                            }`}
                                        >
                                            {amenity.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-0.5">Serial Number</label>
                            <input
                                type="text"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                                placeholder="SN-12345"
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all outline-none ${errors.serialNumber ? 'border-red-400' : 'border-slate-200'}`}
                            />
                            {errors.serialNumber && <p className="mt-1 text-xs text-red-500 ml-0.5">{errors.serialNumber}</p>}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-border-main bg-foreground/[0.02]">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !isValid}
                        className="px-8 py-2.5 text-sm font-black uppercase tracking-widest text-white bg-primary hover:bg-primary-dark rounded-xl transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                        {isSubmitting ? "Adding..." : "Add Resource"}
                    </button>
                </div>
            </div>
        </div>
    );
}