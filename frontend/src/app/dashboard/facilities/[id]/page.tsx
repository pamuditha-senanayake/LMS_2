"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { ArrowLeft, MapPin, Users, DoorOpen } from "lucide-react";
import { 
    CATEGORY_OPTIONS, 
    STATUS_OPTIONS, 
    LOCATION_OPTIONS, 
    FACILITY_TYPES, 
    UTILITY_TYPES,
    validateResourceForm,
    ValidationErrors,
    ResourceFormData
} from "@/constants/resourceConstants";

const FACILITY_TYPE_VALUES = FACILITY_TYPES.map(t => t.value);
const UTILITY_TYPE_VALUES = UTILITY_TYPES.map(t => t.value);

const AMENITY_OPTIONS = [
    { value: "Projector", label: "Projector" },
    { value: "WiFi", label: "WiFi" },
    { value: "AC", label: "AC" },
    { value: "Whiteboard", label: "Whiteboard" },
    { value: "Sound System", label: "Sound System" },
    { value: "Smart Display", label: "Smart Display" },
    { value: "Microphone", label: "Microphone" },
];

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

const formatType = (type: string): string => {
    if (type?.startsWith("OTHER:")) {
        return type.replace("OTHER:", "");
    }
    return type?.replace(/_/g, ' ') || 'Unknown';
};

const getResourceLocation = (res: Resource): string => {
    return res.location || res.campusName || res.building || res.storageLocation || "";
};

export default function FacilityDetailPage() {
    const params = useParams();
    const router = useRouter();
    const resourceId = params.id as string;
    
    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    
    const [category, setCategory] = useState<"FACILITY" | "UTILITY">("FACILITY");
    const [formData, setFormData] = useState<ResourceFormData>({});
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const typeOptions = category === "FACILITY" ? FACILITY_TYPES : UTILITY_TYPES;

    const handleCategoryChange = (newCategory: "FACILITY" | "UTILITY") => {
        setCategory(newCategory);
        setFormData(prev => ({ 
            ...prev, 
            resourceType: newCategory === "FACILITY" ? "LECTURE_HALL" : "PROJECTOR",
            location: "",
            roomNumber: "",
            serialNumber: "",
            capacity: undefined
        }));
        setSelectedAmenities([]);
        setErrors({});
    };

    const handleFormChange = (data: Partial<ResourceFormData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev => 
            prev.includes(amenity) 
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user.roles && user.roles.includes("ROLE_ADMIN")) {
                    setIsAdmin(true);
                }
            } catch {}
        }
    }, []);

    useEffect(() => {
        const fetchResource = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const res = await fetch(`${apiUrl}/api/resources/${resourceId}`, {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    setResource(data);
                    
                    const resourceCategory = data.category || getCategoryFromType(data.resourceType || data.type || "");
                    const resourceType = data.resourceType || data.type || "";
                    const resourceLocation = getResourceLocation(data);
                    const resourceAmenities = data.amenities || [];
                    
                    setCategory(resourceCategory);
                    setSelectedAmenities(resourceAmenities);
                    setFormData({
                        resourceName: data.resourceName || data.name || "",
                        resourceType: resourceType,
                        status: data.status || "ACTIVE",
                        location: resourceLocation,
                        description: data.description || "",
                        roomNumber: data.roomNumber || "",
                        serialNumber: data.serialNumber || "",
                        capacity: data.capacity,
                        amenities: data.amenities || [],
                    });
                } else if (res.status === 404) {
                    Swal.fire("Error", "Resource not found", "error").then(() => {
                        router.push("/dashboard/facilities");
                    });
                }
            } catch (err) {
                console.error("Failed to fetch resource", err);
                Swal.fire("Error", "Failed to load resource details", "error");
            } finally {
                setLoading(false);
            }
        };

        if (resourceId) {
            fetchResource();
        }
    }, [resourceId, router]);

    const handleSave = async () => {
        if (!resource) return;

        if (category === "FACILITY" && formData.capacity !== undefined && formData.capacity < 0) {
            Swal.fire({ 
                title: "Invalid Capacity", 
                text: "Capacity cannot be negative", 
                icon: "error", 
                background: '#1e293b', 
                color: '#fff' 
            });
            return;
        }

        const validationErrors = validateResourceForm(formData, category);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        
        const payload = {
            resourceName: formData.resourceName,
            category: category,
            type: formData.resourceType,
            status: formData.status,
            location: formData.location,
            campusName: formData.location,
            building: formData.location,
            description: formData.description,
            roomNumber: category === "FACILITY" ? formData.roomNumber : "",
            serialNumber: category === "UTILITY" ? formData.serialNumber : "",
            capacity: category === "FACILITY" ? formData.capacity : null,
            amenities: category === "FACILITY" ? selectedAmenities : [],
        };

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/resources/${resource.id || resource._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                Swal.fire({ 
                    title: "Resource Updated!", 
                    text: "The resource has been updated successfully.", 
                    icon: "success", 
                    background: '#1e293b', 
                    color: '#fff'
                });
                const updated = await res.json();
                setResource(updated);
                setCategory(updated.category || getCategoryFromType(updated.resourceType || updated.type || ""));
                setFormData({
                    resourceName: updated.resourceName || updated.name || "",
                    resourceType: updated.resourceType || updated.type || "",
                    status: updated.status || "ACTIVE",
                    location: updated.location || "",
                    description: updated.description || "",
                    roomNumber: updated.roomNumber || "",
                    serialNumber: updated.serialNumber || "",
                    capacity: updated.capacity,
                });
                setErrors({});
                setIsEditing(false);
            } else {
                const errorText = await res.text();
                Swal.fire({ 
                    title: "Failed", 
                    text: errorText || "Unable to update resource.", 
                    icon: "error", 
                    background: '#1e293b', 
                    color: '#fff'
                });
            }
        } catch {
            Swal.fire("Error", "Network processing failed", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!resource) return;

        const result = await Swal.fire({
            title: 'Delete Resource',
            text: `Are you sure you want to delete "${resource.resourceName || resource.name}"? This action cannot be undone.`,
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

        if (result.isConfirmed) {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const res = await fetch(`${apiUrl}/api/resources/${resource.id || resource._id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
                if (res.ok) {
                    Swal.fire({ 
                        title: "Deleted!", 
                        text: "The resource has been deleted successfully.", 
                        icon: "success", 
                        background: '#1e293b', 
                        color: '#fff'
                    });
                    router.push("/dashboard/facilities");
                } else {
                    Swal.fire("Error", "Failed to delete resource", "error");
                }
            } catch {
                Swal.fire("Error", "Network processing failed", "error");
            }
        }
    };

    const handleCancel = () => {
        if (resource) {
            const resourceCategory = resource.category || getCategoryFromType(resource.resourceType || resource.type || "");
            setCategory(resourceCategory);
            setFormData({
                resourceName: resource.resourceName || resource.name || "",
                resourceType: resource.resourceType || resource.type || "",
                status: resource.status || "ACTIVE",
                location: resource.location || "",
                description: resource.description || "",
                roomNumber: resource.roomNumber || "",
                serialNumber: resource.serialNumber || "",
                capacity: resource.capacity,
            });
        }
        setIsEditing(false);
        setErrors({});
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!resource) {
        return null;
    }

    const resourceType = resource.resourceType || resource.type || "GENERAL";
    const status = resource.status || "ACTIVE";
    const isUtility = category === "UTILITY";
    const displayLocation = getResourceLocation(resource) || "N/A";

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.push("/dashboard/facilities")}
                    className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Facilities
                </button>

                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold">{resource.resourceName || resource.name}</h1>
                                <p className="text-slate-400 mt-1">
                                    {formatType(resourceType)} {resource.resourceCode && `• #${resource.resourceCode}`}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                    status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                                    status === "OUT_OF_SERVICE" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                    "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                }`}>
                                    {status.replace(/_/g, ' ')}
                                </span>
                                {isAdmin && !isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {isEditing ? (
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Resource Name *</label>
                                        <input
                                            type="text"
                                            value={formData.resourceName || ""}
                                            onChange={(e) => handleFormChange({ resourceName: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Category *</label>
                                        <select
                                            value={category}
                                            onChange={(e) => handleCategoryChange(e.target.value as "FACILITY" | "UTILITY")}
                                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer"
                                        >
                                            <option value="">Select Category</option>
                                            {CATEGORY_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Type *</label>
                                        <select
                                            value={formData.resourceType || ""}
                                            onChange={(e) => handleFormChange({ resourceType: e.target.value })}
                                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer ${errors.type ? 'border-red-500' : 'border-slate-600'}`}
                                        >
                                            <option value="">Select Type</option>
                                            {typeOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        {errors.type && <p className="mt-1 text-xs text-red-400">{errors.type}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Status *</label>
                                        <select
                                            value={formData.status || "ACTIVE"}
                                            onChange={(e) => handleFormChange({ status: e.target.value })}
                                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer ${errors.status ? 'border-red-500' : 'border-slate-600'}`}
                                        >
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
                                        value={formData.location || ""}
                                        onChange={(e) => handleFormChange({ location: e.target.value })}
                                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer ${errors.location ? 'border-red-500' : 'border-slate-600'}`}
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
                                        {isUtility ? "Notes / Description" : "Description"}
                                    </label>
                                    <textarea
                                        value={formData.description || ""}
                                        onChange={(e) => handleFormChange({ description: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none"
                                        placeholder={isUtility ? "Serial number, condition, notes..." : "Describe the facility..."}
                                    />
                                </div>

                                {isUtility ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Serial Number *</label>
                                            <input
                                                type="text"
                                                value={formData.serialNumber || ""}
                                                onChange={(e) => handleFormChange({ serialNumber: e.target.value })}
                                                placeholder="SN-12345"
                                                className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none ${errors.serialNumber ? 'border-red-500' : 'border-slate-600'}`}
                                            />
                                            {errors.serialNumber && <p className="mt-1 text-xs text-red-400">{errors.serialNumber}</p>}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Room Number *</label>
                                            <input
                                                type="text"
                                                value={formData.roomNumber || ""}
                                                onChange={(e) => handleFormChange({ roomNumber: e.target.value })}
                                                placeholder="A-101"
                                                className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none ${errors.roomNumber ? 'border-red-500' : 'border-slate-600'}`}
                                            />
                                            {errors.roomNumber && <p className="mt-1 text-xs text-red-400">{errors.roomNumber}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Capacity *</label>
                                            <input
                                                type="number"
                                                value={formData.capacity ?? ""}
                                                onChange={(e) => handleFormChange({ capacity: e.target.value === "" ? undefined : parseInt(e.target.value) })}
                                                placeholder="50"
                                                className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none ${errors.capacity ? 'border-red-500' : 'border-slate-600'}`}
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
                                                                : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500'
                                                        }`}
                                                    >
                                                        {amenity.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={handleCancel}
                                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSubmitting}
                                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl transition-all font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? "Saving..." : "Save Changes"}
                                    </button>
                                    {isAdmin && (
                                        <button
                                            onClick={handleDelete}
                                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-semibold ml-auto"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-700/30 rounded-xl">
                                        <div className="flex items-center text-slate-400 text-sm mb-2">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            Location
                                        </div>
                                        <p className="text-lg font-semibold text-white">{displayLocation}</p>
                                    </div>
                                    {resource.category === "FACILITY" && (
                                        <div className="p-4 bg-slate-700/30 rounded-xl">
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
                                        <div className="p-4 bg-slate-700/30 rounded-xl">
                                            <div className="flex items-center text-slate-400 text-sm mb-2">
                                                <DoorOpen className="w-4 h-4 mr-2" />
                                                Room Number
                                            </div>
                                            <p className="text-xl font-bold text-white">{resource.roomNumber || "N/A"}</p>
                                        </div>
                                        {resource.amenities && resource.amenities.length > 0 && (
                                            <div className="p-4 bg-slate-700/30 rounded-xl">
                                                <div className="text-slate-400 text-sm mb-2">Amenities</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {resource.amenities.map((amenity, idx) => (
                                                        <span key={idx} className="px-2 py-1 text-sm rounded-md bg-slate-600/50 text-slate-300 border border-slate-500/30">
                                                            {amenity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {resource.category === "UTILITY" && resource.serialNumber && (
                                    <div className="p-4 bg-slate-700/30 rounded-xl">
                                        <div className="text-slate-400 text-sm mb-2">Serial Number</div>
                                        <p className="text-lg font-semibold text-white">{resource.serialNumber}</p>
                                    </div>
                                )}

                                {resource.description && (
                                    <div className="p-4 bg-slate-700/30 rounded-xl">
                                        <div className="text-slate-400 text-sm mb-2">
                                            {resource.category === "UTILITY" ? "Notes" : "Description"}
                                        </div>
                                        <p className="text-slate-300 leading-relaxed">{resource.description}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}