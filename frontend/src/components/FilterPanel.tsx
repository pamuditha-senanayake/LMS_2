"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronDown, Check, SlidersHorizontal } from "lucide-react";

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterState {
    category: "ALL" | "FACILITY" | "UTILITY";
    type: string;
    status: string;
    location: string;
    capacity: string;
}

export interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterState;
    onApply: (filters: FilterState) => void;
    onReset: () => void;
    categoryOptions: FilterOption[];
    typeOptions: FilterOption[];
    statusOptions: FilterOption[];
    locationOptions: FilterOption[];
    capacityOptions: FilterOption[];
    onCategoryChange?: (category: FilterState["category"]) => void;
}

export default function FilterPanel({
    isOpen,
    onClose,
    filters,
    onApply,
    onReset,
    categoryOptions,
    typeOptions,
    statusOptions,
    locationOptions,
    capacityOptions,
    onCategoryChange,
}: FilterPanelProps) {
    const [localFilters, setLocalFilters] = useState<FilterState>(filters);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    const handleApply = useCallback(() => {
        onApply(localFilters);
        onClose();
    }, [localFilters, onApply, onClose]);

    const handleReset = useCallback(() => {
        onReset();
        setLocalFilters({
            category: "ALL",
            type: "ALL",
            status: "ALL",
            location: "ALL",
            capacity: "ALL",
        });
    }, [onReset]);

    const handleCategorySelect = useCallback((value: string) => {
        const newCategory = value as FilterState["category"];
        setLocalFilters((prev) => ({
            ...prev,
            category: newCategory,
            type: "ALL",
        }));
        onCategoryChange?.(newCategory);
        setActiveDropdown(null);
    }, [onCategoryChange]);

    const handleSelect = useCallback((field: keyof FilterState, value: string) => {
        setLocalFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
        setActiveDropdown(null);
    }, []);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    const hasActiveFilters =
        localFilters.category !== "ALL" ||
        localFilters.type !== "ALL" ||
        localFilters.status !== "ALL" ||
        localFilters.location !== "ALL" ||
        localFilters.capacity !== "ALL";

    const activeFilterCount = [
        localFilters.category !== "ALL",
        localFilters.type !== "ALL",
        localFilters.status !== "ALL",
        localFilters.location !== "ALL",
        localFilters.capacity !== "ALL",
    ].filter(Boolean).length;

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
            onClick={handleBackdropClick}
        >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

            <div
                className="relative w-full max-w-lg bg-card border border-border-main rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-main bg-foreground/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <SlidersHorizontal className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Filters</h3>
                            {activeFilterCount > 0 && (
                                <p className="text-xs text-slate-400">
                                    {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all rounded-xl"
                        aria-label="Close filters"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                                Category
                            </label>
                            <DropdownSelect
                                options={categoryOptions}
                                value={localFilters.category}
                                onSelect={(val) => handleCategorySelect(val)}
                                isActive={activeDropdown === "category"}
                                onToggle={() => setActiveDropdown(activeDropdown === "category" ? null : "category")}
                                placeholder="All Categories"
                                icon={<span className="w-2 h-2 rounded-full bg-indigo-400"></span>}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                                Status
                            </label>
                            <DropdownSelect
                                options={statusOptions}
                                value={localFilters.status}
                                onSelect={(val) => handleSelect("status", val)}
                                isActive={activeDropdown === "status"}
                                onToggle={() => setActiveDropdown(activeDropdown === "status" ? null : "status")}
                                placeholder="All Status"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                            Type
                        </label>
                        <DropdownSelect
                            options={typeOptions}
                            value={localFilters.type}
                            onSelect={(val) => handleSelect("type", val)}
                            isActive={activeDropdown === "type"}
                            onToggle={() => setActiveDropdown(activeDropdown === "type" ? null : "type")}
                            placeholder="All Types"
                            disabled={localFilters.category === "ALL" && typeOptions.length <= 1}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                                Location
                            </label>
                            <DropdownSelect
                                options={locationOptions}
                                value={localFilters.location}
                                onSelect={(val) => handleSelect("location", val)}
                                isActive={activeDropdown === "location"}
                                onToggle={() => setActiveDropdown(activeDropdown === "location" ? null : "location")}
                                placeholder="All Locations"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                                Capacity
                            </label>
                            <DropdownSelect
                                options={capacityOptions}
                                value={localFilters.capacity}
                                onSelect={(val) => handleSelect("capacity", val)}
                                isActive={activeDropdown === "capacity"}
                                onToggle={() => setActiveDropdown(activeDropdown === "capacity" ? null : "capacity")}
                                placeholder="Any Capacity"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-border-main bg-foreground/[0.02]">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={!hasActiveFilters}
                        className="flex-1 px-5 py-3 text-sm font-bold uppercase tracking-widest text-muted bg-card border border-border-main rounded-xl hover:text-foreground hover:bg-foreground/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Clear All
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        className="flex-1 px-5 py-3 text-sm font-black uppercase tracking-widest text-white bg-primary hover:bg-primary-dark rounded-xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98]"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}

interface DropdownSelectProps {
    options: FilterOption[];
    value: string;
    onSelect: (value: string) => void;
    isActive: boolean;
    onToggle: () => void;
    placeholder?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

function DropdownSelect({
    options,
    value,
    onSelect,
    isActive,
    onToggle,
    placeholder = "Select...",
    icon,
    disabled = false,
}: DropdownSelectProps) {
    const getSelectedLabel = (options: FilterOption[], value: string): string => {
        const option = options.find((opt) => opt.value === value);
        return option?.label || value.replace(/_/g, " ");
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                disabled={disabled}
                className={`w-full flex items-center gap-2 px-4 py-3 bg-slate-700/50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                    disabled
                        ? "border-slate-600/30 text-slate-500 cursor-not-allowed opacity-60"
                        : isActive
                        ? "border-indigo-500/50 text-white"
                        : "border-slate-600/50 text-slate-200 hover:text-white hover:border-slate-500/50"
                }`}
            >
                {icon && <span className="flex-shrink-0">{icon}</span>}
                <span className="flex-1 text-left truncate">
                    {getSelectedLabel(options, value) || placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                        isActive ? "rotate-180" : ""
                    }`}
                />
            </button>
            {isActive && !disabled && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl z-10 overflow-hidden max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    {options.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500 text-center">
                            No options available
                        </div>
                    ) : (
                        options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onSelect(option.value)}
                                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                                    value === option.value
                                        ? "bg-indigo-500/20 text-indigo-300"
                                        : "text-slate-200 hover:bg-slate-700/50 hover:text-white"
                                }`}
                            >
                                <span className="flex-1 text-left truncate">{option.label}</span>
                                {value === option.value && (
                                    <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
