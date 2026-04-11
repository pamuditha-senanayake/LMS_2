"use client";

import { useEffect, useState, useCallback } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Ticket,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Star,
} from "lucide-react";

const tooltipStyle = {
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    border: "1px solid #475569",
    borderRadius: "12px",
    padding: "12px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
};

const tooltipLabelStyle = {
    color: "#94a3b8",
    fontSize: "12px",
    marginBottom: "8px",
};

const tooltipItemStyle = {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
};

export default function TicketStatistics() {
    const [stats, setStats] = useState<any>(null);
    const [volumeData, setVolumeData] = useState<any[]>([]);
    const [ratingStats, setRatingStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dateRange, setDateRange] = useState("30");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const fetchStatistics = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        try {
            const allTicketsRes = await fetch(`${apiUrl}/api/tickets`, { credentials: "include" });
            const [statsRes, volumeRes, ratingRes] = await Promise.all([
                fetch(`${apiUrl}/api/tickets/statistics`, { credentials: "include" }),
                fetch(`${apiUrl}/api/tickets/statistics/volume?days=${dateRange}`, {
                    credentials: "include",
                }),
                fetch(`${apiUrl}/api/tickets/statistics/ratings`, {
                    credentials: "include",
                }),
            ]);

            let computedStats = null;
            
            if (allTicketsRes.ok) {
                const allTickets = await allTicketsRes.json();
                const total = allTickets.length;
                const open = allTickets.filter((t: any) => t.status === "OPEN" || !t.status).length;
                const inProgress = allTickets.filter((t: any) => t.status === "IN_PROGRESS").length;
                const resolved = allTickets.filter((t: any) => t.status === "RESOLVED" || t.status === "CLOSED").length;
                const rejected = allTickets.filter((t: any) => t.status === "REJECTED").length;
                const critical = allTickets.filter((t: any) => t.priority === "CRITICAL").length;
                const high = allTickets.filter((t: any) => t.priority === "HIGH").length;
                const medium = allTickets.filter((t: any) => t.priority === "MEDIUM").length;
                const low = allTickets.filter((t: any) => t.priority === "LOW").length;
                
                computedStats = {
                    total, open, inProgress, resolved, rejected,
                    critical, high, medium, low
                };
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                if (!computedStats) {
                    setStats(statsData);
                } else {
                    setStats({ ...statsData, ...computedStats });
                }
            } else if (computedStats) {
                setStats(computedStats);
            }

            if (volumeRes.ok) {
                const volumeResult = await volumeRes.json();
                const volumeByDay = volumeResult.volumeByDay;
                const chartData = Object.entries(volumeByDay)
                    .map(([date, count]) => ({
                        date: date.slice(5),
                        tickets: count,
                    }))
                    .sort((a, b) => a.date.localeCompare(b.date));
                setVolumeData(chartData);
            }

            if (ratingRes.ok) {
                const ratingData = await ratingRes.json();
                setRatingStats(ratingData);
            }
        } catch (err) {
            console.error("Failed to fetch statistics:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [apiUrl, dateRange]);

    useEffect(() => {
        if (!refreshing) {
            fetchStatistics();
        }
    }, [fetchStatistics, refreshing]);

    const priorityData = stats
        ? [
              { name: "Critical", value: stats.critical || 0, color: "#f43f5e" },
              { name: "High", value: stats.high || 0, color: "#f97316" },
              { name: "Medium", value: stats.medium || 0, color: "#3b82f6" },
              { name: "Low", value: stats.low || 0, color: "#22c55e" },
          ]
        : [];

    const statusData = stats
        ? [
              { name: "Open", value: stats.open || 0, color: "#fbbf24" },
              {
                  name: "In Progress",
                  value: stats.inProgress || 0,
                  color: "#6366f1",
              },
              {
                  name: "Resolved",
                  value: stats.resolved || 0,
                  color: "#22c55e",
              },
              { name: "Rejected", value: stats.rejected || 0, color: "#ef4444" },
          ]
        : [];

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading statistics...</p>
                </div>
            </div>
        );
    }

    const resolutionRate = stats?.total > 0
        ? Math.round((stats.resolved / stats.total) * 100)
        : 0;

    return (
        <div className="p-6 text-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-xl shadow-purple-500/30">
                                <div className="w-full h-full rounded-3xl bg-slate-900 flex items-center justify-center overflow-hidden">
                                    <img 
                                        src="https://www.andromo.com/wp-content/uploads/2023/05/Frame-113.png"
                                        alt="Analytics"
                                        className="w-28 h-28 object-contain"
                                    />
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                                <TrendingUp size={16} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-2">
                                Analytics <span className="text-primary">Dashboard</span>
                            </h1>
                            <p className="text-slate-400 flex items-center gap-2">
                                <Activity size={14} className="text-indigo-400" />
                                Overview of ticket metrics and performance
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 focus:outline-none backdrop-blur-sm"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                        </select>
                        <button
                            onClick={() => fetchStatistics(true)}
                            disabled={refreshing}
                            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                        >
                            {refreshing ? (
                                <>
                                    <div className="loader">
                                        <svg id="cloud" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                                            <defs>
                                                <filter id="roundness">
                                                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5"></feGaussianBlur>
                                                    <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -10"></feColorMatrix>
                                                </filter>
                                                <mask id="shapes">
                                                    <g fill="white">
                                                        <polygon points="50 37.5 80 75 20 75 50 37.5"></polygon>
                                                        <circle cx="20" cy="60" r="15"></circle>
                                                        <circle cx="80" cy="60" r="15"></circle>
                                                        <g>
                                                            <circle cx="20" cy="60" r="15"></circle>
                                                            <circle cx="20" cy="60" r="15"></circle>
                                                            <circle cx="20" cy="60" r="15"></circle>
                                                        </g>
                                                    </g>
                                                </mask>
                                                <mask id="clipping" clipPathUnits="userSpaceOnUse">
                                                    <g id="lines" filter="url(#roundness)">
                                                        <g mask="url(#shapes)" stroke="white">
                                                            <line x1="-50" y1="-40" x2="150" y2="-40"></line>
                                                            <line x1="-50" y1="-31" x2="150" y2="-31"></line>
                                                            <line x1="-50" y1="-22" x2="150" y2="-22"></line>
                                                            <line x1="-50" y1="-13" x2="150" y2="-13"></line>
                                                            <line x1="-50" y1="-4" x2="150" y2="-4"></line>
                                                            <line x1="-50" y1="5" x2="150" y2="5"></line>
                                                            <line x1="-50" y1="14" x2="150" y2="14"></line>
                                                            <line x1="-50" y1="23" x2="150" y2="23"></line>
                                                            <line x1="-50" y1="32" x2="150" y2="32"></line>
                                                            <line x1="-50" y1="41" x2="150" y2="41"></line>
                                                            <line x1="-50" y1="50" x2="150" y2="50"></line>
                                                            <line x1="-50" y1="59" x2="150" y2="59"></line>
                                                            <line x1="-50" y1="68" x2="150" y2="68"></line>
                                                            <line x1="-50" y1="77" x2="150" y2="77"></line>
                                                            <line x1="-50" y1="86" x2="150" y2="86"></line>
                                                            <line x1="-50" y1="95" x2="150" y2="95"></line>
                                                            <line x1="-50" y1="104" x2="150" y2="104"></line>
                                                            <line x1="-50" y1="113" x2="150" y2="113"></line>
                                                            <line x1="-50" y1="122" x2="150" y2="122"></line>
                                                            <line x1="-50" y1="131" x2="150" y2="131"></line>
                                                            <line x1="-50" y1="140" x2="150" y2="140"></line>
                                                        </g>
                                                    </g>
                                                </mask>
                                            </defs>
                                            <rect x="0" y="0" width="100" height="100" rx="0" ry="0" mask="url(#clipping)"></rect>
                                            <g>
                                                <path d="M33.52,68.12 C35.02,62.8 39.03,58.52 44.24,56.69 C49.26,54.93 54.68,55.61 59.04,58.4 C59.04,58.4 56.24,60.53 56.24,60.53 C55.45,61.13 55.68,62.37 56.63,62.64 C56.63,62.64 67.21,65.66 67.21,65.66 C67.98,65.88 68.75,65.3 68.74,64.5 C68.74,64.5 68.68,53.5 68.68,53.5 C68.67,52.51 67.54,51.95 66.75,52.55 C66.75,52.55 64.04,54.61 64.04,54.61 C57.88,49.79 49.73,48.4 42.25,51.03 C35.2,53.51 29.78,59.29 27.74,66.49 C27.29,68.08 28.22,69.74 29.81,70.19 C30.09,70.27 30.36,70.31 30.63,70.31 C31.94,70.31 33.14,69.44 33.52,68.12Z"></path>
                                                <path d="M69.95,74.85 C68.35,74.4 66.7,75.32 66.25,76.92 C64.74,82.24 60.73,86.51 55.52,88.35 C50.51,90.11 45.09,89.43 40.73,86.63 C40.73,86.63 43.53,84.51 43.53,84.51 C44.31,83.91 44.08,82.67 43.13,82.4 C43.13,82.4 32.55,79.38 32.55,79.38 C31.78,79.16 31.02,79.74 31.02,80.54 C31.02,80.54 31.09,91.54 31.09,91.54 C31.09,92.53 32.22,93.09 33.01,92.49 C33.01,92.49 35.72,90.43 35.72,90.43 C39.81,93.63 44.77,95.32 49.84,95.32 C52.41,95.32 55,94.89 57.51,94.01 C64.56,91.53 69.99,85.75 72.02,78.55 C72.47,76.95 71.54,75.3 69.95,74.85Z"></path>
                                            </g>
                                        </svg>
                                    </div>
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <Activity size={18} />
                                    Refresh
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {stats && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                            <KPICard
                                icon={Ticket}
                                label="Total Tickets"
                                value={stats.total || 0}
                                trend="+12%"
                                trendUp={true}
                                gradient="from-violet-500 to-purple-600"
                                glowColor="violet"
                            />
                            <KPICard
                                icon={AlertCircle}
                                label="Open Tickets"
                                value={stats.open || 0}
                                trend="+5%"
                                trendUp={false}
                                gradient="from-amber-500 to-orange-600"
                                glowColor="amber"
                            />
                            <KPICard
                                icon={CheckCircle}
                                label="Resolved"
                                value={stats.resolved || 0}
                                trend={`${resolutionRate}%`}
                                trendUp={true}
                                gradient="from-emerald-500 to-teal-600"
                                glowColor="emerald"
                            />
                            <KPICard
                                icon={Clock}
                                label="Avg Resolution"
                                value={`${stats.avgResolutionHours || 0}h`}
                                trend="-8%"
                                trendUp={true}
                                gradient="from-blue-500 to-cyan-600"
                                glowColor="blue"
                            />
                        </div>

                        {ratingStats && ratingStats.totalRatings > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Star size={20} className="text-yellow-400 fill-yellow-400" />
                                    User Satisfaction
                                </h3>
                                <div className="glass-card rounded-3xl p-6 border border-slate-700/50">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <span className="text-5xl font-bold text-yellow-400">{ratingStats.averageRating || 0}</span>
                                                <span className="text-2xl text-slate-400">/5</span>
                                            </div>
                                            <div className="flex justify-center gap-1 mb-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        size={24}
                                                        className={`${star <= Math.round(ratingStats.averageRating || 0) ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-sm text-slate-400">Average Rating</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-5xl font-bold text-emerald-400 mb-2">{ratingStats.totalRatings}</div>
                                            <p className="text-sm text-slate-400">Total Ratings</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-400 mb-3">Rating Distribution</p>
                                            <div className="space-y-2">
                                                {[5, 4, 3, 2, 1].map((star) => {
                                                    const count = ratingStats.ratingDistribution?.[String(star)] || 0;
                                                    const percentage = ratingStats.totalRatings > 0 ? (count / ratingStats.totalRatings) * 100 : 0;
                                                    return (
                                                        <div key={star} className="flex items-center gap-2">
                                                            <span className="text-xs text-slate-400 w-6">{star}★</span>
                                                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-yellow-400 rounded-full transition-all"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-700/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Ticket Volume</h3>
                                        <p className="text-sm text-slate-400">Last {dateRange} days</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                        <ArrowUpRight size={14} className="text-emerald-400" />
                                        <span className="text-xs font-medium text-emerald-400">+23%</span>
                                    </div>
                                </div>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={volumeData}>
                                            <defs>
                                                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#8b5cf6" />
                                                    <stop offset="100%" stopColor="#06b6d4" />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#334155"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#64748b"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#64748b"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={tooltipStyle}
                                                labelStyle={tooltipLabelStyle}
                                                itemStyle={tooltipItemStyle}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="tickets"
                                                stroke="url(#lineGradient)"
                                                strokeWidth={3}
                                                dot={{ fill: "#8b5cf6", r: 4, strokeWidth: 0 }}
                                                activeDot={{ r: 6, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="glass-card rounded-3xl p-6 border border-slate-700/50">
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-white">Priority</h3>
                                    <p className="text-sm text-slate-400">Distribution</p>
                                </div>
                                <div className="h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={priorityData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {priorityData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={tooltipStyle}
                                                labelStyle={tooltipLabelStyle}
                                                itemStyle={tooltipItemStyle}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    {priorityData.map((item) => (
                                        <div key={item.name} className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-xs text-slate-400">{item.name}</span>
                                            <span className="text-xs font-semibold text-white ml-auto">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="glass-card rounded-3xl p-6 border border-slate-700/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Status</h3>
                                        <p className="text-sm text-slate-400">Overview</p>
                                    </div>
                                    <TrendingUp size={20} className="text-indigo-400" />
                                </div>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statusData} layout="vertical">
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#334155"
                                                horizontal={false}
                                            />
                                            <XAxis
                                                type="number"
                                                stroke="#64748b"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                stroke="#64748b"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                width={80}
                                            />
                                            <Tooltip
                                                contentStyle={tooltipStyle}
                                                labelStyle={tooltipLabelStyle}
                                                itemStyle={tooltipItemStyle}
                                            />
                                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                                                {statusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="glass-card rounded-3xl p-6 border border-slate-700/50">
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-white">Performance</h3>
                                    <p className="text-sm text-slate-400">Metrics</p>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-slate-400">Resolution Rate</span>
                                            <span className="text-lg font-bold text-emerald-400">{resolutionRate}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                                                style={{ width: `${resolutionRate}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-slate-400">Open Tickets</span>
                                            <span className="text-lg font-bold text-amber-400">{stats.open || 0}</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500"
                                                style={{ width: `${stats.total > 0 ? (stats.open / stats.total) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-slate-400">Tracked Resolutions</span>
                                            <span className="text-lg font-bold text-blue-400">{stats.resolvedWithTime || 0}</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                                                style={{ width: `${stats.resolvedWithTime > 0 ? 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card rounded-3xl p-6 border border-slate-700/50">
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-white">Priority Breakdown</h3>
                                    <p className="text-sm text-slate-400">By severity</p>
                                </div>
                                <div className="space-y-4">
                                    <PriorityRow
                                        label="Critical"
                                        value={stats.critical || 0}
                                        total={stats.total || 1}
                                        color="bg-rose-500"
                                    />
                                    <PriorityRow
                                        label="High"
                                        value={stats.high || 0}
                                        total={stats.total || 1}
                                        color="bg-orange-500"
                                    />
                                    <PriorityRow
                                        label="Medium"
                                        value={stats.medium || 0}
                                        total={stats.total || 1}
                                        color="bg-blue-500"
                                    />
                                    <PriorityRow
                                        label="Low"
                                        value={stats.low || 0}
                                        total={stats.total || 1}
                                        color="bg-green-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function KPICard({
    icon: Icon,
    label,
    value,
    trend,
    trendUp,
    gradient,
    glowColor,
}: {
    icon: any;
    label: string;
    value: string | number;
    trend: string;
    trendUp: boolean;
    gradient: string;
    glowColor: string;
}) {
    const glowColors: Record<string, string> = {
        violet: "shadow-violet-500/25",
        amber: "shadow-amber-500/25",
        emerald: "shadow-emerald-500/25",
        blue: "shadow-blue-500/25",
    };

    return (
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 shadow-xl ${glowColors[glowColor as keyof typeof glowColors]} group hover:scale-[1.02] transition-transform duration-300`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                        <Icon size={22} className="text-white" />
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendUp ? 'bg-emerald-500/30 text-emerald-200' : 'bg-red-500/30 text-red-200'}`}>
                        {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {trend}
                    </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{value}</div>
                <div className="text-sm text-white/70 font-medium">{label}</div>
            </div>
        </div>
    );
}

function PriorityRow({
    label,
    value,
    total,
    color,
}: {
    label: string;
    value: number;
    total: number;
    color: string;
}) {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">{label}</span>
                <span className="text-sm font-semibold text-white">{value}</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
