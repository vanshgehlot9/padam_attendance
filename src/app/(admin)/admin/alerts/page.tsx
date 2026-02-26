"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, MapPin, Shield, Clock, Eye, Filter } from "lucide-react";

type AlertType = "GPS_OFF" | "LEFT_WORK" | "FIELD_INACTIVE" | "ATTENDANCE_INVALID" | "LATE_ARRIVAL";

interface Alert {
    id: string;
    type: AlertType;
    employeeId: string;
    employeeName: string;
    message: string;
    severity: "info" | "warning" | "critical";
    timestamp: number;
    read: boolean;
}

const typeConfig: Record<AlertType, { icon: any; label: string; color: string; bg: string }> = {
    GPS_OFF: { icon: AlertTriangle, label: "GPS Off", color: "text-red-600", bg: "bg-red-50" },
    LEFT_WORK: { icon: MapPin, label: "Left Office", color: "text-orange-600", bg: "bg-orange-50" },
    FIELD_INACTIVE: { icon: Clock, label: "Field Inactive", color: "text-amber-600", bg: "bg-amber-50" },
    ATTENDANCE_INVALID: { icon: Shield, label: "Invalid Attendance", color: "text-red-600", bg: "bg-red-50" },
    LATE_ARRIVAL: { icon: Clock, label: "Late Arrival", color: "text-amber-600", bg: "bg-amber-50" },
};

const severityBadge: Record<string, string> = {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
};

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [filterType, setFilterType] = useState<string>("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await fetch("/api/admin/employees");
                const data = await res.json();
                setAlerts(data.alerts || []);
            } catch (e) {
                console.error("Failed to fetch alerts:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 15000);
        return () => clearInterval(interval);
    }, []);

    const filtered = filterType === "all" ? alerts : alerts.filter(a => a.type === filterType);
    const unreadCount = alerts.filter(a => !a.read).length;

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        const now = Date.now();
        const diff = now - ts;
        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        Alerts & Notifications
                        {unreadCount > 0 && (
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">{unreadCount} new</span>
                        )}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Real-time workforce anomaly detection</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {["all", "GPS_OFF", "LEFT_WORK", "FIELD_INACTIVE", "LATE_ARRIVAL", "ATTENDANCE_INVALID"].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${filterType === type ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                        {type === "all" ? `All (${alerts.length})` : `${typeConfig[type as AlertType]?.label || type} (${alerts.filter(a => a.type === type).length})`}
                    </button>
                ))}
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No alerts at this time</p>
                        <p className="text-xs text-slate-400 mt-1">Alerts will appear when anomalies are detected</p>
                    </div>
                ) : (
                    filtered.map(alert => {
                        const config = typeConfig[alert.type] || typeConfig.GPS_OFF;
                        const Icon = config.icon;
                        return (
                            <div key={alert.id} className={`bg-white rounded-2xl border shadow-sm p-5 flex items-start gap-4 transition-all ${alert.read ? "border-slate-100 opacity-70" : "border-l-4 border-l-red-400 border-t-slate-100 border-r-slate-100 border-b-slate-100"}`}>
                                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={`w-5 h-5 ${config.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${severityBadge[alert.severity]}`}>{alert.severity}</span>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${config.bg} ${config.color}`}>{config.label}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">{alert.employeeName}</p>
                                    <p className="text-sm text-slate-600 mt-0.5">{alert.message}</p>
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{formatTime(alert.timestamp)}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
