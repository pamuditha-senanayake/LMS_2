"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ResourceCard from "@/components/ResourceCard";
import AddResourceModal from "@/components/AddResourceModal";
import FacilityDetailsModal from "@/components/FacilityDetailsModal";
import SmartChatbotToggle from "@/components/SmartChatbotToggle";
import SmartBookingChatbot from "@/components/SmartBookingChatbot";
import FilterPanel, { FilterState, FilterOption } from "@/components/FilterPanel";
import { Search, Filter, X, Plus } from "lucide-react";

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

const FACILITY_TYPES: FilterOption[] = [
    { value: "ROOM", label: "Room" },
    { value: "LECTURE_HALL", label: "Lecture Hall" },
    { value: "LAB", label: "Lab" },
    { value: "AUDITORIUM", label: "Auditorium" },
    { value: "MEETING_ROOM", label: "Meeting Room" },
    { value: "COMPUTER_LAB", label: "Computer Lab" },
    { value: "STUDY_ROOM", label: "Study Room" },
    { value: "CONFERENCE_ROOM", label: "Conference Room" },
    { value: "SPORTS_FACILITY", label: "Sports Facility" },
    { value: "LIBRARY", label: "Library" },
    { value: "OTHER", label: "Other Facility" },
];

const UTILITY_TYPES: FilterOption[] = [
    { value: "PROJECTOR", label: "Projector" },
    { value: "SOUND_SYSTEM", label: "Sound System" },
    { value: "MICROPHONE", label: "Microphone" },
    { value: "WHITEBOARD", label: "Whiteboard" },
    { value: "FLAGS", label: "Flags" },
    { value: "LAPTOP", label: "Laptop" },
    { value: "TABLE", label: "Table" },
    { value: "CHAIR", label: "Chair" },
    { value: "TENT", label: "Tent" },
    { value: "CAMERA", label: "Camera" },
    { value: "OTHER", label: "Other Utility" },
];

const CATEGORY_OPTIONS: FilterOption[] = [
    { value: "ALL", label: "All Categories" },
    { value: "FACILITY", label: "Facilities" },
    { value: "UTILITY", label: "Utilities" },
];

const STATUS_OPTIONS: FilterOption[] = [
    { value: "ALL", label: "All Status" },
    { value: "ACTIVE", label: "Active" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "OUT_OF_SERVICE", label: "Out of Service" },
];

const CAPACITY_OPTIONS: FilterOption[] = [
    { value: "ALL", label: "Any Capacity" },
    { value: "SMALL", label: "Small (1-30)" },
    { value: "MEDIUM", label: "Medium (31-100)" },
    { value: "LARGE", label: "Large (101+)" },
];

export default function FacilitiesCatalogue() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        category: "ALL",
        type: "ALL",
        status: "ALL",
        location: "ALL",
        capacity: "ALL",
    });
    const filterButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user.roles && user.roles.includes("ROLE_ADMIN")) {
                    setIsAdmin(true);
                }
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    const fetchResources = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const url = `${apiUrl}/api/resources`;
            console.log("Fetching resources from:", url);
            
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };
            
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const user = JSON.parse(storedUser);
                if (user.token) {
                    headers["Authorization"] = `Bearer ${user.token}`;
                    console.log("Added Bearer token to request");
                }
                console.log("User roles:", user.roles);
            } else {
                console.log("No user in localStorage");
            }
            
            const res = await fetch(url, {
                credentials: "include",
                headers,
            });
            console.log("Resources response status:", res.status);
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error("Failed to fetch resources:", res.status, errorText);
                setError(`Failed to load resources: ${res.status} - ${errorText || res.statusText}`);
            } else {
                const data = await res.json();
                console.log("Resources fetched successfully, count:", data.length);
                const transformed = data.map((r: Resource) => ({
                    ...r,
                    resourceName: r.resourceName || r.name,
                    resourceType: r.resourceType || r.type,
                    category: r.category,
                    location: r.location || r.campusLocation?.buildingName || r.building || "",
                    campusLocation: r.campusLocation || {
                        campusName: r.campusName || "",
                        buildingName: r.building || "",
                        roomNumber: r.roomNumber || "",
                    },
                }));
                setResources(transformed);
            }
        } catch (err) {
            console.error("Failed to fetch resources", err);
            setError("Backend not reachable. Please start server.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    const locationOptions = useMemo((): FilterOption[] => {
        const locations = new Set<string>();
        resources.forEach((r) => {
            const loc = r.campusLocation?.campusName || r.campusName || r.location;
            if (loc) {
                locations.add(loc);
            }
        });
        return [
            { value: "ALL", label: "All Locations" },
            ...Array.from(locations)
                .filter(Boolean)
                .sort()
                .map((loc) => ({ value: loc, label: loc })),
        ];
    }, [resources]);

    const typeOptions = useMemo((): FilterOption[] => {
        if (filters.category === "FACILITY") {
            return [
                { value: "ALL", label: "All Facility Types" },
                ...FACILITY_TYPES,
            ];
        }

        if (filters.category === "UTILITY") {
            return [
                { value: "ALL", label: "All Utility Types" },
                ...UTILITY_TYPES,
            ];
        }

        return [{ value: "ALL", label: "All Types" }];
    }, [filters.category]);

    const handleCategoryChange = useCallback((newCategory: FilterState["category"]) => {
        setFilters((prev) => ({
            ...prev,
            category: newCategory,
            type: "ALL",
        }));
    }, []);

    const getCapacityRange = useCallback((capacity: string): { min: number; max: number } => {
        switch (capacity) {
            case "SMALL":
                return { min: 1, max: 30 };
            case "MEDIUM":
                return { min: 31, max: 100 };
            case "LARGE":
                return { min: 101, max: Infinity };
            default:
                return { min: 0, max: Infinity };
        }
    }, []);

    const filteredResources = useMemo(() => {
        return resources.filter((resource) => {
            const matchesSearch =
                searchQuery === "" ||
                resource.resourceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                resource.resourceType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                resource.resourceCode?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory =
                filters.category === "ALL" || resource.category === filters.category;

            const matchesType =
                filters.type === "ALL" || resource.resourceType === filters.type;

            const matchesStatus =
                filters.status === "ALL" || resource.status === filters.status;

            const resourceLocation =
                resource.campusLocation?.campusName || resource.campusName || resource.location || "";
            const matchesLocation =
                filters.location === "ALL" || resourceLocation === filters.location;

            let matchesCapacity = true;
            if (filters.capacity !== "ALL") {
                const range = getCapacityRange(filters.capacity);
                const capacity = resource.capacity || 0;
                matchesCapacity = capacity >= range.min && capacity <= range.max;
            }

            return (
                matchesSearch &&
                matchesCategory &&
                matchesType &&
                matchesStatus &&
                matchesLocation &&
                matchesCapacity
            );
        });
    }, [resources, searchQuery, filters, getCapacityRange]);

    const clearFilters = useCallback(() => {
        setSearchQuery("");
        setFilters({
            category: "ALL",
            type: "ALL",
            status: "ALL",
            location: "ALL",
            capacity: "ALL",
        });
    }, []);

    const hasActiveFilters =
        searchQuery !== "" ||
        filters.category !== "ALL" ||
        filters.type !== "ALL" ||
        filters.status !== "ALL" ||
        filters.location !== "ALL" ||
        filters.capacity !== "ALL";

    const activeFilterCount = [
        filters.category !== "ALL",
        filters.type !== "ALL",
        filters.status !== "ALL",
        filters.location !== "ALL",
        filters.capacity !== "ALL",
    ].filter(Boolean).length;

    return (
        <>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-2">
                            Facilities & <span className="text-primary">Assets</span>
                        </h1>
                        <p className="text-muted">
                            Browse and search available resources for booking.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-muted">
                            Showing{" "}
                            <span className="text-primary font-semibold">
                                {filteredResources.length}
                            </span>{" "}
                            of {resources.length} resources
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 btn-primary-action font-semibold rounded-xl"
                            >

                                <Plus className="w-5 h-5" />
                                Add Resource
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                        <input
                            type="text"
                            placeholder="Search resources by name, type, or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-card border border-border-main rounded-xl text-foreground placeholder-muted focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-foreground/5"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3 items-center">
                        <div className="relative">
                            <button
                                ref={filterButtonRef}
                                data-filter-trigger
                                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                                className={`flex items-center gap-2 px-4 py-3.5 bg-card border rounded-xl font-medium transition-all ${
                                    hasActiveFilters
                                        ? "border-primary/50 text-primary hover:bg-foreground/5"
                                        : "border-border-main text-muted hover:text-foreground hover:border-foreground/10"
                                }`}
                            >
                                <Filter className="w-4 h-4" />
                                <span>Filter</span>
                                {activeFilterCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-primary text-white rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            <FilterPanel
                                isOpen={isFilterPanelOpen}
                                onClose={() => setIsFilterPanelOpen(false)}
                                filters={filters}
                                onApply={setFilters}
                                onReset={() => {
                                    clearFilters();
                                    setIsFilterPanelOpen(false);
                                }}
                                categoryOptions={CATEGORY_OPTIONS}
                                typeOptions={typeOptions}
                                statusOptions={STATUS_OPTIONS}
                                locationOptions={locationOptions}
                                capacityOptions={CAPACITY_OPTIONS}
                                onCategoryChange={handleCategoryChange}
                            />
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-3.5 text-sm font-medium text-muted hover:text-foreground bg-card border border-border-main rounded-xl transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex w-full justify-center p-12">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4 text-rose-500 opacity-50">⚠️</div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            Connection Error
                        </h3>
                        <p className="text-muted mb-6">{error}</p>
                        <button
                            onClick={fetchResources}
                            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredResources.length === 0 ? (
                    <div className="text-center py-16">
                        {hasActiveFilters ? (
                            <>
                                <div className="text-5xl mb-4 opacity-50">🔍</div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    No resources found
                                </h3>
                                <p className="text-muted mb-6">
                                    Try adjusting your search or filter criteria
                                </p>
                                <button
                                    onClick={clearFilters}
                                    className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors"
                                >
                                    Clear all filters
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="text-5xl mb-4 opacity-50">📦</div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    No resources available
                                </h3>
                                <p className="text-muted">
                                    Check back later or contact admin for assistance
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredResources.map((resource) => (
                            <ResourceCard
                                key={resource.id || resource._id}
                                resource={resource}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AddResourceModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchResources}
            />

            {selectedResource && (
                <FacilityDetailsModal
                    resource={selectedResource}
                    isOpen={isDetailsModalOpen}
                    onClose={() => {
                        setIsDetailsModalOpen(false);
                        setSelectedResource(null);
                    }}
                />
            )}

            <SmartChatbotToggle
                isOpen={isChatbotOpen}
                onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
            />
            <SmartBookingChatbot
                isOpen={isChatbotOpen}
                onClose={() => setIsChatbotOpen(false)}
                onViewResource={(resource) => {
                    setSelectedResource(resource);
                    setIsDetailsModalOpen(true);
                }}
                onBookResource={(resource) => {
                    setSelectedResource(resource);
                    setIsDetailsModalOpen(true);
                }}
                resources={resources}
            />
        </>
    );
}
