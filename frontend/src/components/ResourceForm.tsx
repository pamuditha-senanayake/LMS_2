"use client";

import React from "react";
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

interface ResourceFormProps {
    formData: ResourceFormData;
    category: "FACILITY" | "UTILITY";
    errors: ValidationErrors;
    isSubmitting: boolean;
    isEdit?: boolean;
    onFormChange: (data: Partial<ResourceFormData>) => void;
    onCategoryChange: (category: "FACILITY" | "UTILITY") => void;
    onSubmit: () => void;
    onCancel: () => void;
    submitLabel?: string;
}

export default function ResourceForm({
    formData,
    category,
    errors,
    isSubmitting,
    isEdit = false,
    onFormChange,
    onCategoryChange,
    onSubmit,
    onCancel,
    submitLabel = "Add Resource"
}: ResourceFormProps) {
    const typeOptions = category === "FACILITY" ? FACILITY_TYPES : UTILITY_TYPES;
    const showCustomTypeField = category === "UTILITY" && formData.resourceType === "OTHER";
    const [customType, setCustomType] = React.useState("");

    const handleTypeChange = (value: string) => {
        onFormChange({ resourceType: value });
    };

    const handleCapacityChange = (value: string) => {
        onFormChange({ capacity: value === "" ? undefined : parseInt(value) });
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Resource Name *</label>
                    <input
                        type="text"
                        value={formData.resourceName || ""}
                        onChange={(e) => onFormChange({ resourceName: e.target.value })}
                        placeholder={category === "FACILITY" ? "Main Auditorium" : "Epson Projector #1"}
                        className="w-full px-4 py-3 bg-card border border-border-main rounded-xl text-foreground placeholder-muted focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Category *</label>
                    <select
                        value={category}
                        onChange={(e) => onCategoryChange(e.target.value as "FACILITY" | "UTILITY")}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer"
                    >
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
                        onChange={(e) => handleTypeChange(e.target.value)}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer ${errors.type ? 'border-red-500' : 'border-slate-700/50'}`}
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
                        onChange={(e) => onFormChange({ status: e.target.value })}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer ${errors.status ? 'border-red-500' : 'border-slate-700/50'}`}
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
                    onChange={(e) => onFormChange({ location: e.target.value })}
                    className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer ${errors.location ? 'border-red-500' : 'border-slate-700/50'}`}
                >
                    <option value="">Select Location</option>
                    {LOCATION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                {errors.location && <p className="mt-1 text-xs text-red-400">{errors.location}</p>}
            </div>

            {showCustomTypeField && (
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Specify Utility Type *</label>
                    <input
                        type="text"
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                        placeholder="e.g., Speaker Stand, Extension Cord"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                    {category === "FACILITY" ? "Description" : "Notes / Description"}
                </label>
                <textarea
                    value={formData.description || ""}
                    onChange={(e) => onFormChange({ description: e.target.value })}
                    rows={2}
                    placeholder={category === "FACILITY" ? "Large auditorium with AV equipment..." : "Serial number, condition, notes..."}
                    className="w-full px-4 py-3 bg-card border border-border-main rounded-xl text-foreground placeholder-muted focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                />
            </div>

            {category === "FACILITY" ? (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Room Number *</label>
                        <input
                            type="text"
                            value={formData.roomNumber || ""}
                            onChange={(e) => onFormChange({ roomNumber: e.target.value })}
                            placeholder="A-101"
                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none ${errors.roomNumber ? 'border-red-500' : 'border-slate-700/50'}`}
                        />
                        {errors.roomNumber && <p className="mt-1 text-xs text-red-400">{errors.roomNumber}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Capacity *</label>
                        <input
                            type="number"
                            value={formData.capacity ?? ""}
                            onChange={(e) => handleCapacityChange(e.target.value)}
                            placeholder="50"
                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none ${errors.capacity ? 'border-red-500' : 'border-slate-700/50'}`}
                        />
                        {errors.capacity && <p className="mt-1 text-xs text-red-400">{errors.capacity}</p>}
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Serial Number *</label>
                        <input
                            type="text"
                            value={formData.serialNumber || ""}
                            onChange={(e) => onFormChange({ serialNumber: e.target.value })}
                            placeholder="SN-12345"
                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none ${errors.serialNumber ? 'border-red-500' : 'border-slate-700/50'}`}
                        />
                        {errors.serialNumber && <p className="mt-1 text-xs text-red-400">{errors.serialNumber}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Capacity *</label>
                        <input
                            type="number"
                            value={formData.capacity ?? ""}
                            onChange={(e) => handleCapacityChange(e.target.value)}
                            placeholder="10"
                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none ${errors.capacity ? 'border-red-500' : 'border-slate-700/50'}`}
                        />
                        {errors.capacity && <p className="mt-1 text-xs text-red-400">{errors.capacity}</p>}
                    </div>
                </>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
                <button
                    onClick={onCancel}
                    className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all border border-slate-600/50"
                >
                    Cancel
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="px-8 py-2.5 text-sm font-black uppercase tracking-widest text-white bg-primary hover:bg-primary-dark rounded-xl transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    {isSubmitting ? "Saving..." : submitLabel}
                </button>
            </div>
        </div>
    );
}