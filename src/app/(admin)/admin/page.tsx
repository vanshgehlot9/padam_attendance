"use client";

import { useEffect, useState } from "react";
import {
    Users, UserCheck, Clock, AlertTriangle, MapPinOff, LogOut,
    TrendingUp, RefreshCw
} from "lucide-react";

interface DashboardData {
    employees: any[];
    stats: { totalStaff: number; present: number; late: number; absent: number; gpsOff: number; leftWork: number };
    attendance: any[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    ON_TIME: { label: "Working", color: "text-green-700", bg: "bg-green-50 border-green-200" },
    WORKING: { label: "Working", color: "text-green-700", bg: "bg-green-50 border-green-200" },
    LATE: { label: "Late", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    GPS_OFF: { label: "GPS Off", color: "text-red-700", bg: "bg-red-50 border-red-200" },
    LEFT_WORK: { label: "Left Work", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
    ABSENT: { label: "Absent", color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
};

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch("/api/admin/employees");
            const json = await res.json();
            setData(json);
        } catch (e) { console.error(e); }
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!data) return (
        <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const stats = data.stats || { totalStaff: 0, present: 0, late: 0, absent: 0, gpsOff: 0, leftWork: 0 };
    const attendance = data.attendance || [];
    const employees = data.employees || [];

    const kpis = [
        { icon: Users, label: "Total Staff", value: stats.totalStaff, color: "text-blue-600", bg: "bg-blue-50" },
        { icon: UserCheck, label: "Present", value: stats.present, color: "text-green-600", bg: "bg-green-50" },
        { icon: Clock, label: "Late", value: stats.late, color: "text-amber-600", bg: "bg-amber-50" },
        { icon: AlertTriangle, label: "Absent", value: stats.absent, color: "text-slate-500", bg: "bg-slate-100" },
        { icon: MapPinOff, label: "GPS Off", value: stats.gpsOff, color: "text-red-600", bg: "bg-red-50" },
        { icon: LogOut, label: "Left Work", value: stats.leftWork, color: "text-orange-600", bg: "bg-orange-50" },
    ];

    return (
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Command Center</h1>
                    <p className="text-sm text-slate-500 mt-1">Real-time workforce status — {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                            <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Real-Time Status Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-slate-900">Live Status</h2>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Live</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-400">Auto-refreshes every 10s</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Shift</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Arrival</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Distance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.filter((e: any) => e.active).map((emp: any) => {
                                const record = attendance.find((a: any) => a.employeeId === emp.id);
                                const status = record?.status || "ABSENT";
                                const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ABSENT;
                                const isAlert = ["GPS_OFF", "LEFT_WORK", "ABSENT"].includes(status);

                                return (
                                    <tr key={emp.id} className={`border-b border-slate-50 transition-colors ${isAlert ? "bg-red-50/40" : "hover:bg-slate-50/50"}`}>
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                                    {emp.avatarInitials}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{emp.name}</p>
                                                    <p className="text-[11px] text-slate-400">{emp.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs font-medium text-slate-600 capitalize bg-slate-100 px-2 py-1 rounded-md">{emp.role}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-sm font-mono text-slate-700">{emp.shiftStart}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-sm font-mono text-slate-700">
                                                {record?.arrivalTime || "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-sm text-slate-600">
                                                {record?.distanceFromOffice != null ? `${record.distanceFromOffice}m` : "—"}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
