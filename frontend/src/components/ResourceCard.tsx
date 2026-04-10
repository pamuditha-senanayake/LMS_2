"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import StatusBadge from "./StatusBadge";
import FacilityDetailsModal from "./FacilityDetailsModal";
import { Users, MapPin, Eye, Package } from "lucide-react";

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

interface ResourceCardProps {
    resource: Resource;
}

const formatType = (type: string): string => {
    if (type?.startsWith("OTHER:")) {
        return type.replace("OTHER:", "");
    }
    return type?.replace(/_/g, ' ') || 'Unknown';
};

export default function ResourceCard({ resource }: ResourceCardProps) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user.roles && user.roles.includes("ROLE_ADMIN")) {
                    setIsAdmin(true);
                }
            } catch {
                // ignore parse errors
            }
        }
    }, []);

    const resourceId = resource.id || resource._id;
    const resourceName = resource.resourceName || resource.name || "Unnamed Resource";
    const resourceType = resource.resourceType || resource.type || "GENERAL";
    const status = resource.status || "ACTIVE";
    const category = resource.category;
    const capacity = resource.capacity || 0;
    
    const isFacility = category === "FACILITY";
    const isUtility = category === "UTILITY";
    
    const getResourceLocation = (): string => {
        return resource.location || resource.campusName || resource.building || resource.storageLocation || "";
    };

    const getLocationDisplay = () => {
        const loc = getResourceLocation();
        if (isFacility) {
            const parts = [];
            if (loc) parts.push(loc);
            if (resource.roomNumber) parts.push(resource.roomNumber);
            return parts.length > 0 ? parts.join(' - ') : "N/A";
        } else if (isUtility) {
            const storageLoc = resource.storageLocation || loc;
            if (storageLoc && resource.serialNumber) {
                return `${storageLoc} - ${resource.serialNumber}`;
            } else if (storageLoc) {
                return storageLoc;
            }
            return resource.serialNumber || "N/A";
        }
        return loc || "N/A";
    };

    const locationDisplay = getLocationDisplay();

    return (
        <>
            <div className="group relative bg-card rounded-2xl border border-border-main overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                    isUtility 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                        : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                } opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            isUtility 
                                ? 'bg-brand-peach/20 text-brand-peach border-brand-peach/30' 
                                : 'bg-primary/20 text-primary border-primary/30'
                        }`}>
                            {formatType(resourceType)}
                        </span>
                        <StatusBadge status={status} />
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
                        {resourceName}
                    </h3>

                    {resource.resourceCode && (
                        <p className="text-xs text-muted mb-4 font-mono opacity-60">#{resource.resourceCode}</p>
                    )}

                    <div className="space-y-3 mb-4">
                        {isFacility && (
                            <div className="flex items-center text-sm text-muted">
                                <Users className="w-4 h-4 mr-3 text-muted/60 shrink-0" />
                                <span className="font-medium text-foreground/80">{capacity}</span>
                                <span className="ml-1">seats capacity</span>
                            </div>
                        )}
                        
                        <div className="flex items-start text-sm text-muted">
                            {isUtility ? (
                                <Package className="w-4 h-4 mr-3 text-muted/60 shrink-0 mt-0.5" />
                            ) : (
                                <MapPin className="w-4 h-4 mr-3 text-muted/60 shrink-0 mt-0.5" />
                            )}
                            <span className="line-clamp-2">{locationDisplay}</span>
                        </div>

                        {isUtility && resource.description && (
                            <p className="text-sm text-muted line-clamp-2">{resource.description}</p>
                        )}
                    </div>

                    {isFacility && resource.amenities && resource.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {resource.amenities.slice(0, 3).map((amenity, idx) => (
                                <span 
                                    key={idx} 
                                    className="px-2 py-0.5 text-xs rounded-md bg-foreground/5 text-muted border border-border-main"
                                >
                                    {amenity}
                                </span>
                            ))}
                            {resource.amenities.length > 3 && (
                                <span className="px-2 py-0.5 text-xs rounded-md bg-foreground/5 text-muted/60">
                                    +{resource.amenities.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 pb-6">
                    {isAdmin ? (
                        <Link 
                            href={`/dashboard/facilities/${resourceId}`}
                            className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all shadow-lg active:scale-[0.98] bg-gradient-to-r from-primary to-brand-pink hover:opacity-90 shadow-primary/25 hover:shadow-primary/40"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                        </Link>
                    ) : (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all shadow-lg active:scale-[0.98] bg-gradient-to-r from-primary to-brand-pink hover:opacity-90 shadow-primary/25 hover:shadow-primary/40"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                        </button>
                    )}
                </div>
            </div>

            <FacilityDetailsModal
                resource={resource}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
