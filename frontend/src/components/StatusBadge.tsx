"use client";

interface StatusBadgeProps {
    status: string;
}

type StatusConfig = {
    bg: string;
    text: string;
    label: string;
};

function getStatusConfig(status: string): StatusConfig {
    const normalized = status?.toUpperCase();
    
    switch (normalized) {
        case "ACTIVE":
            return { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Active" };
        case "MAINTENANCE":
            return { bg: "bg-amber-500/20", text: "text-amber-400", label: "Maintenance" };
        case "OUT_OF_SERVICE":
            return { bg: "bg-red-500/20", text: "text-red-400", label: "Out of Service" };
        case "RESERVED":
            return { bg: "bg-blue-500/20", text: "text-blue-400", label: "Reserved" };
        case "AVAILABLE":
            return { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Available" };
        case "BOOKED":
            return { bg: "bg-purple-500/20", text: "text-purple-400", label: "Booked" };
        case "PENDING":
            return { bg: "bg-amber-500/20", text: "text-amber-400", label: "Pending" };
        case "APPROVED":
            return { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Approved" };
        case "REJECTED":
            return { bg: "bg-red-500/20", text: "text-red-400", label: "Rejected" };
        case "CANCELLED":
            return { bg: "bg-slate-500/20", text: "text-slate-400", label: "Cancelled" };
        default:
            return { bg: "bg-slate-500/20", text: "text-slate-400", label: status || "Unknown" };
    }
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const config = getStatusConfig(status);

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${config.bg} ${config.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.text.replace('text-', 'bg-')}`}></span>
            {config.label}
        </span>
    );
}
