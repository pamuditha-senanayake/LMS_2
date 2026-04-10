export const CATEGORY_OPTIONS = [
    { value: "FACILITY", label: "Facilities" },
    { value: "UTILITY", label: "Utilities" },
];

export const STATUS_OPTIONS = [
    { value: "ACTIVE", label: "ACTIVE" },
    { value: "OUT_OF_SERVICE", label: "OUT_OF_SERVICE" },
    { value: "MAINTENANCE_REQUIRED", label: "MAINTENANCE_REQUIRED" },
];

export const LOCATION_OPTIONS = [
    { value: "IT", label: "IT" },
    { value: "Medicine", label: "Medicine" },
    { value: "Engineering", label: "Engineering" },
    { value: "Architecture", label: "Architecture" },
];

export const FACILITY_TYPES = [
    { value: "LECTURE_HALL", label: "Lecture Hall" },
    { value: "LAB", label: "Lab" },
    { value: "AUDITORIUM", label: "Auditorium" },
    { value: "MEETING_ROOM", label: "Meeting Room" },
    { value: "ROOM", label: "Room" },
];

export const UTILITY_TYPES = [
    { value: "PROJECTOR", label: "Projector" },
    { value: "SOUND_SYSTEM", label: "Sound System" },
    { value: "MICROPHONE", label: "Microphone" },
    { value: "WHITEBOARD", label: "Whiteboard" },
    { value: "FLAGS", label: "Flags" },
    { value: "OTHER", label: "Other" },
];

export const FACILITY_TYPE_VALUES = FACILITY_TYPES.map(t => t.value);
export const UTILITY_TYPE_VALUES = UTILITY_TYPES.map(t => t.value);

export interface ValidationErrors {
    category?: string;
    type?: string;
    status?: string;
    location?: string;
    roomNumber?: string;
    serialNumber?: string;
    capacity?: string;
}

export interface ResourceFormData {
    resourceName?: string;
    resourceType?: string;
    type?: string;
    category?: "FACILITY" | "UTILITY";
    status?: string;
    location?: string;
    description?: string;
    roomNumber?: string;
    serialNumber?: string;
    capacity?: number;
    amenities?: string[];
    campusName?: string;
    building?: string;
    storageLocation?: string;
}

export function validateResourceForm(data: ResourceFormData, category: "FACILITY" | "UTILITY"): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!data.resourceType) {
        errors.type = "Type is required";
    }
    if (!data.status) {
        errors.status = "Status is required";
    }
    if (!data.location) {
        errors.location = "Location is required";
    }
    if (category === "FACILITY" && !data.roomNumber?.trim()) {
        errors.roomNumber = "Room Number is required for facilities";
    }
    if (category === "UTILITY" && !data.serialNumber?.trim()) {
        errors.serialNumber = "Serial Number is required for utilities";
    }
    if (category === "FACILITY") {
        if (data.capacity === undefined || data.capacity === null) {
            errors.capacity = "Capacity is required";
        } else if (typeof data.capacity === "number" && data.capacity < 0) {
            errors.capacity = "Capacity cannot be negative";
        }
    }

    return errors;
}