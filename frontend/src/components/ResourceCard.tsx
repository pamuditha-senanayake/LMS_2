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

    const purpleAccent = isUtility ? '#7C3AED' : '#A78BFA';
    const purpleHover = isUtility ? '#6D28D9' : '#8B5CF6';

    return (
        <>
            <div 
                className="group relative flex flex-col rounded-lg overflow-hidden transition-all duration-300 cursor-pointer"
                style={{
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px ${purpleAccent}`;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                }}
            >
                <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                        <span 
                            className="inline-flex items-center px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider"
                            style={{ 
                                backgroundColor: `${purpleAccent}15`,
                                color: purpleAccent,
                                border: `1px solid ${purpleAccent}30`
                            }}
                        >
                            {formatType(resourceType)}
                        </span>
                        <StatusBadge status={status} />
                    </div>

                    <h3 className="text-lg font-semibold mb-2 line-clamp-1" style={{ color: '#F1F5F9' }}>
                        {resourceName}
                    </h3>

                    {resource.resourceCode && (
                        <p className="text-xs mb-4 font-mono" style={{ color: '#64748B' }}>#{resource.resourceCode}</p>
                    )}

                    <div className="space-y-3 mb-4">
                        {isFacility && (
                            <div className="flex items-center text-sm" style={{ color: '#CBD5F5' }}>
                                <Users className="w-4 h-4 mr-3 shrink-0" style={{ color: purpleAccent }} />
                                <span className="font-medium">{capacity}</span>
                                <span className="ml-1">seats capacity</span>
                            </div>
                        )}
                        
                        <div className="flex items-start text-sm" style={{ color: '#CBD5F5' }}>
                            {isUtility ? (
                                <Package className="w-4 h-4 mr-3 shrink-0 mt-0.5" style={{ color: purpleAccent }} />
                            ) : (
                                <MapPin className="w-4 h-4 mr-3 shrink-0 mt-0.5" style={{ color: purpleAccent }} />
                            )}
                            <span className="line-clamp-2">{locationDisplay}</span>
                        </div>

                        {isUtility && resource.description && (
                            <p className="text-sm line-clamp-2" style={{ color: '#94A3B8' }}>{resource.description}</p>
                        )}
                    </div>

                    {isFacility && resource.amenities && resource.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {resource.amenities.slice(0, 3).map((amenity, idx) => (
                                <span 
                                    key={idx} 
                                    className="px-2 py-0.5 text-xs rounded"
                                    style={{ 
                                        backgroundColor: '#020617', 
                                        color: '#94A3B8',
                                        border: '1px solid #1E293B'
                                    }}
                                >
                                    {amenity}
                                </span>
                            ))}
                            {resource.amenities.length > 3 && (
                                <span className="px-2 py-0.5 text-xs rounded" style={{ color: '#64748B' }}>
                                    +{resource.amenities.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 pb-6 mt-auto">
                    {isAdmin ? (
                        <Link 
                            href={`/dashboard/facilities/${resourceId}`}
                            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
                            style={{ 
                                backgroundColor: purpleAccent, 
                                color: 'white',
                                borderRadius: '8px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = purpleHover;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = purpleAccent;
                            }}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                        </Link>
                    ) : (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
                            style={{ 
                                backgroundColor: purpleAccent, 
                                color: 'white',
                                borderRadius: '8px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = purpleHover;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = purpleAccent;
                            }}
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
