"use client";

import { X, MapPin, Users, DoorOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

const FACILITY_TYPE_VALUES = ["ROOM", "LECTURE_HALL", "LAB", "AUDITORIUM", "MEETING_ROOM"];
const UTILITY_TYPE_VALUES = ["PROJECTOR", "SOUND_SYSTEM", "MICROPHONE", "WHITEBOARD", "FLAGS", "OTHER"];

function getCategoryFromType(type: string): "FACILITY" | "UTILITY" {
    if (type?.startsWith("OTHER:")) return "UTILITY";
    if (FACILITY_TYPE_VALUES.includes(type)) return "FACILITY";
    if (UTILITY_TYPE_VALUES.includes(type)) return "UTILITY";
    if (type?.includes("LECTURE") || type?.includes("LAB") || type?.includes("AUDITORIUM") || type?.includes("MEETING") || type?.includes("ROOM")) return "FACILITY";
    if (type?.includes("PROJECTOR") || type?.includes("MICROPHONE") || type?.includes("SOUND") || type?.includes("WHITEBOARD") || type?.includes("FLAGS")) return "UTILITY";
    return "FACILITY";
}

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
    resourceCode?: string;
    description?: string;
    amenities?: string[];
    campusName?: string;
    building?: string;
    storageLocation?: string;
}

interface EditResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    resource: Resource | null;
    onSave?: (updatedResource: Partial<Resource>) => void;
    onDelete?: (resource: Resource) => void;
    isAdmin?: boolean;
}

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

const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    OUT_OF_SERVICE: "bg-red-500/20 text-red-400 border-red-500/30",
    MAINTENANCE_REQUIRED: "bg-amber-500/20 text-amber-400 border-amber-500/30"
};

export default function EditResourceModal({ isOpen, onClose, resource, onSave, onDelete, isAdmin = false }: EditResourceModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedResource, setEditedResource] = useState<Partial<Resource>>({});
    const [category, setCategory] = useState<"FACILITY" | "UTILITY">("FACILITY");
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const modalRef = useRef<HTMLDivElement>(null);

    const typeOptions = category === "FACILITY" ? FACILITY_TYPES : UTILITY_TYPES;

    const getResourceLocation = (res: Resource): string => {
        return res.location || res.campusName || res.building || res.storageLocation || "";
    };

    const handleCategoryChange = (newCategory: "FACILITY" | "UTILITY") => {
        setCategory(newCategory);
        setEditedResource(prev => ({ 
            ...prev, 
            resourceType: newCategory === "FACILITY" ? "LECTURE_HALL" : "PROJECTOR",
            location: "",
            roomNumber: "",
            serialNumber: "",
            capacity: undefined,
            campusName: "",
            building: "",
            storageLocation: ""
        }));
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

    const validate = (): boolean => {
        const newErrors: ValidationErrors = {};
        const ed = editedResource;

        if (!ed.resourceName?.trim()) {
            newErrors.resourceName = "Resource Name is required";
        }
        if (!category) {
            newErrors.category = "Category is required";
        }
        if (!ed.resourceType) {
            newErrors.type = "Type is required";
        }
        if (!ed.status) {
            newErrors.status = "Status is required";
        }
        if (!getResourceLocation(ed)) {
            newErrors.location = "Location is required";
        }
        if (category === "FACILITY" && !ed.roomNumber?.trim()) {
            newErrors.roomNumber = "Room Number is required";
        }
        if (category === "UTILITY" && !ed.serialNumber?.trim()) {
            newErrors.serialNumber = "Serial Number is required";
        }
        if (category === "FACILITY") {
            if (ed.capacity === undefined || ed.capacity === null) {
                newErrors.capacity = "Capacity is required";
            } else if (typeof ed.capacity === "number" && ed.capacity < 0) {
                newErrors.capacity = "Capacity cannot be negative";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        if (resource) {
            const resourceLocation = getResourceLocation(resource);
            const resourceCategory = resource.category;
            const detectedCategory = resourceCategory || getCategoryFromType(resource.resourceType || resource.type || "");
            setCategory(detectedCategory);
            setSelectedAmenities(resource.amenities || []);
            setEditedResource({
                resourceName: resource.resourceName || resource.name,
                resourceType: resource.resourceType || resource.type,
                status: resource.status || "ACTIVE",
                location: resourceLocation,
                campusName: resource.campusName || resourceLocation,
                building: resource.building || resourceLocation,
                storageLocation: resource.storageLocation || resourceLocation,
                roomNumber: resource.roomNumber || "",
                serialNumber: resource.serialNumber || "",
                capacity: resource.capacity,
                description: resource.description,
                amenities: resource.amenities || [],
            });
        }
    }, [resource]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen || !resource) return null;

    const resourceName = resource.resourceName || resource.name || "Unnamed Resource";
    const resourceTypeDisplay = resource.resourceType || resource.type || "GENERAL";
    const status = resource.status || "ACTIVE";
    const displayLocation = getResourceLocation(resource) || "N/A";

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleSave = async () => {
        if (!onSave) return;

        if (category === "FACILITY" && editedResource.capacity !== undefined && editedResource.capacity < 0) {
            Swal.fire({ 
                title: "Invalid Capacity", 
                text: "Capacity cannot be negative", 
                icon: "error", 
                background: '#1e293b', 
                color: '#fff' 
            });
            return;
        }

        if (!validate()) {
            return;
        }

        const payload: Record<string, any> = {
            resourceName: editedResource.resourceName,
            category: category,
            type: editedResource.resourceType,
            status: editedResource.status,
            location: editedResource.location,
            campusName: editedResource.location,
            building: editedResource.location,
            description: editedResource.description,
        };

        console.log("EDIT - form state before save:", { editedResourceLocation: editedResource.location, campusName: editedResource.campusName });

        if (category === "FACILITY") {
            payload.capacity = editedResource.capacity;
            payload.roomNumber = editedResource.roomNumber;
            payload.amenities = selectedAmenities;
        } else {
            payload.serialNumber = editedResource.serialNumber;
            payload.storageLocation = editedResource.location;
            payload.roomNumber = "";
        }

        console.log("EDIT - final payload:", JSON.stringify(payload, null, 2));

        setIsSubmitting(true);
        try {
            await onSave(payload);
            setIsEditing(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete Resource',
            text: `Are you sure you want to delete "${resourceName}"? This action cannot be undone.`,
            icon: 'warning',
            background: '#1e293b',
            color: '#fff',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            customClass: {
                popup: 'rounded-2xl',
                confirmButton: 'px-6 py-3 rounded-xl font-bold text-white transition-all',
                cancelButton: 'px-6 py-3 rounded-xl font-semibold text-white transition-all'
            }
        });

        if (result.isConfirmed && onDelete) {
            onDelete(resource);
            onClose();
        }
    };

    const handleCancel = () => {
        if (resource) {
            const resourceLocation = getResourceLocation(resource);
            const resourceCategory = resource.category;
            const detectedCategory = resourceCategory || getCategoryFromType(resource.resourceType || resource.type || "");
            setCategory(detectedCategory);
            setSelectedAmenities(resource.amenities || []);
            setEditedResource({
                resourceName: resource.resourceName || resource.name,
                resourceType: resource.resourceType || resource.type,
                status: resource.status || "ACTIVE",
                location: resourceLocation,
                campusName: resource.campusName || resourceLocation,
                building: resource.building || resourceLocation,
                storageLocation: resource.storageLocation || resourceLocation,
                roomNumber: resource.roomNumber || "",
                serialNumber: resource.serialNumber || "",
                capacity: resource.capacity,
                description: resource.description,
                amenities: resource.amenities || [],
            });
        }
        setIsEditing(false);
        setErrors({});
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div 
                ref={modalRef}
                className="relative w-full max-w-2xl bg-card rounded-[2rem] border border-border-main shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                
                <div className="flex items-center justify-between p-6 border-b border-border-main bg-foreground/[0.02] shrink-0">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{resourceName}</h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            {resourceTypeDisplay.replace(/_/g, ' ')} {resource.resourceCode && `• #${resource.resourceCode}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColors[status as keyof typeof statusColors] || statusColors.ACTIVE}`}>
                            {status.replace(/_/g, ' ')}
                        </span>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isEditing ? (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Category *</label>
                                    <select
                                        value={category}
                                        onChange={(e) => handleCategoryChange(e.target.value as "FACILITY" | "UTILITY")}
                                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer ${errors.category ? 'border-red-500' : 'border-slate-700/50'}`}
                                    >
                                        <option value="">Select Category</option>
                                        {CATEGORY_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {errors.category && <p className="mt-1 text-xs text-red-400">{errors.category}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Resource Name *</label>
                                    <input
                                        type="text"
                                        value={editedResource.resourceName || ""}
                                        onChange={(e) => setEditedResource({ ...editedResource, resourceName: e.target.value })}
                                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none ${errors.resourceName ? 'border-red-500' : 'border-slate-700/50'}`}
                                    />
                                    {errors.resourceName && <p className="mt-1 text-xs text-red-400">{errors.resourceName}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Type *</label>
                                    <select
                                        value={editedResource.resourceType || ""}
                                        onChange={(e) => setEditedResource({ ...editedResource, resourceType: e.target.value })}
                                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer ${errors.type ? 'border-red-500' : 'border-slate-700/50'}`}
                                    >
                                        <option value="">Select Type</option>
                                        {typeOptions.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                    {errors.type && <p className="mt-1 text-xs text-red-400">{errors.type}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Status *</label>
                                    <select
                                        value={editedResource.status || ""}
                                        onChange={(e) => setEditedResource({ ...editedResource, status: e.target.value })}
                                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer ${errors.status ? 'border-red-500' : 'border-slate-700/50'}`}
                                    >
                                        <option value="">Select Status</option>
                                        {STATUS_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {errors.status && <p className="mt-1 text-xs text-red-400">{errors.status}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Location *</label>
                                    <select
                                        value={editedResource.location || ""}
                                        onChange={(e) => setEditedResource({ ...editedResource, location: e.target.value, campusName: e.target.value, building: e.target.value, storageLocation: e.target.value })}
                                        className={`w-full px-4 py-3 bg-foreground/[0.03] border rounded-xl text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none cursor-pointer ${errors.location ? 'border-red-500' : 'border-border-main'}`}
                                    >
                                        <option value="">Select Location</option>
                                        {LOCATION_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {errors.location && <p className="mt-1 text-xs text-red-400">{errors.location}</p>}
                                </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    {category === "FACILITY" ? "Description" : "Notes / Description"}
                                </label>
                                <textarea
                                    value={editedResource.description || ""}
                                    onChange={(e) => setEditedResource({ ...editedResource, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none"
                                    placeholder={category === "FACILITY" ? "Describe the facility..." : "Serial number, condition, notes..."}
                                />
                            </div>

                            {category === "FACILITY" ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Room Number *</label>
                                        <input
                                            type="text"
                                            value={editedResource.roomNumber || ""}
                                            onChange={(e) => setEditedResource({ ...editedResource, roomNumber: e.target.value })}
                                            placeholder="A-101"
                                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none ${errors.roomNumber ? 'border-red-500' : 'border-slate-700/50'}`}
                                        />
                                        {errors.roomNumber && <p className="mt-1 text-xs text-red-400">{errors.roomNumber}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Capacity *</label>
                                        <input
                                            type="number"
                                            value={editedResource.capacity ?? ""}
                                            onChange={(e) => setEditedResource({ ...editedResource, capacity: e.target.value === "" ? undefined : parseInt(e.target.value) })}
                                            placeholder="50"
                                            min="0"
                                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none ${errors.capacity ? 'border-red-500' : 'border-slate-700/50'}`}
                                        />
                                        {errors.capacity && <p className="mt-1 text-xs text-red-400">{errors.capacity}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Amenities (Optional)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {AMENITY_OPTIONS.map(amenity => (
                                                <button
                                                    key={amenity.value}
                                                    type="button"
                                                    onClick={() => toggleAmenity(amenity.value)}
                                                    className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                                                        selectedAmenities.includes(amenity.value)
                                                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                                                            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-500'
                                                    }`}
                                                >
                                                    {amenity.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Serial Number *</label>
                                        <input
                                            type="text"
                                            value={editedResource.serialNumber || ""}
                                            onChange={(e) => setEditedResource({ ...editedResource, serialNumber: e.target.value })}
                                            placeholder="SN-12345"
                                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none ${errors.serialNumber ? 'border-red-500' : 'border-slate-700/50'}`}
                                        />
                                        {errors.serialNumber && <p className="mt-1 text-xs text-red-400">{errors.serialNumber}</p>}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                                    <div className="flex items-center text-slate-400 text-sm mb-2">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        Location
                                    </div>
                                    <p className="text-lg font-semibold text-white">{displayLocation}</p>
                                </div>
                                {resource.category === "FACILITY" && (
                                    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                                        <div className="flex items-center text-slate-400 text-sm mb-2">
                                            <Users className="w-4 h-4 mr-2" />
                                            Capacity
                                        </div>
                                        <p className="text-lg font-semibold text-white">{resource.capacity ?? 0}</p>
                                    </div>
                                )}
                            </div>

                            {resource.category === "FACILITY" && (
                                <>
                                    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                                        <div className="flex items-center text-slate-400 text-sm mb-2">
                                            <DoorOpen className="w-4 h-4 mr-2" />
                                            Room Number
                                        </div>
                                        <p className="text-xl font-bold text-white">{resource.roomNumber || "N/A"}</p>
                                    </div>
                                    {resource.amenities && resource.amenities.length > 0 && (
                                        <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                                            <div className="text-slate-400 text-sm mb-2">Amenities</div>
                                            <div className="flex flex-wrap gap-2">
                                                {resource.amenities.map((amenity, idx) => (
                                                    <span key={idx} className="px-2 py-1 text-sm rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/30">
                                                        {amenity}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {resource.category === "UTILITY" && resource.serialNumber && (
                                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                                    <div className="text-slate-400 text-sm mb-2">Serial Number</div>
                                    <p className="text-lg font-semibold text-white">{resource.serialNumber}</p>
                                </div>
                            )}

                            {resource.description && (
                                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                                    <div className="text-slate-400 text-sm mb-2">{resource.category === "UTILITY" ? "Notes" : "Description"}</div>
                                    <p className="text-slate-300 leading-relaxed">{resource.description}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-700/50 bg-slate-800/30 shrink-0">
                    <div className="flex gap-2">
                        {isAdmin && (
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="px-4 py-2.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                {isEditing ? "Cancel Edit" : "Edit Details"}
                            </button>
                        )}
                        {isEditing && onDelete && (
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                            >
                                Delete Resource
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all border border-slate-600/50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSubmitting}
                                    className="px-8 py-2.5 text-sm font-black uppercase tracking-widest text-white bg-primary hover:bg-primary-dark rounded-xl transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                >
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-muted bg-card border border-border-main hover:text-foreground hover:bg-foreground/5 rounded-xl transition-all active:scale-95"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}