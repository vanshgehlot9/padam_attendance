"use client";

import { useEffect, useState } from "react";
import { Download, Filter, Calendar, Search } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    ON_TIME: { label: "On Time", color: "text-green-700", bg: "bg-green-50 border-green-200" },
    WORKING: { label: "Working", color: "text-green-700", bg: "bg-green-50 border-green-200" },
    LATE: { label: "Late", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    GPS_OFF: { label: "GPS Off", color: "text-red-700", bg: "bg-red-50 border-red-200" },
    LEFT_WORK: { label: "Left Work", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
    ABSENT: { label: "Absent", color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
};

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);
    const [filterStatus, setFilterStatus] = useState("");
    const [filterEmployee, setFilterEmployee] = useState("");
    const [filterShift, setFilterShift] = useState("");

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/admin/employees");
            const json = await res.json();
            setData(json);
        })();
    }, []);

    if (!data) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

    const employees = data.employees || [];
    const attendance = data.attendance || [];
    const activeEmployees = employees.filter((e: any) => e.active);

    // Build report rows
    const reportRows = activeEmployees.map((emp: any) => {
        const record = attendance.find((a: any) => a.employeeId === emp.id);
        return {
            ...emp,
            status: record?.status || "ABSENT",
            arrivalTime: record?.arrivalTime || null,
            departureTime: record?.departureTime || null,
            distance: record?.distanceFromOffice || null,
        };
    }).filter((row: any) => {
        if (filterStatus && row.status !== filterStatus) return false;
        if (filterEmployee && row.id !== filterEmployee) return false;
        if (filterShift && row.shiftStart !== filterShift) return false;
        return true;
    });

    const exportCSV = () => {
        const headers = ["Employee ID", "Name", "Role", "Shift Start", "Shift End", "Status", "Arrival", "Distance (m)"];
        const csvRows = [headers.join(",")];
        reportRows.forEach((r: any) => {
            csvRows.push([r.id, r.name, r.role, r.shiftStart, r.shiftEnd, r.status, r.arrivalTime || "—", r.distance ?? "—"].join(","));
        });
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `attendance_report_${new Date().toISOString().split("T")[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    const uniqueShifts = [...new Set(activeEmployees.map((e: any) => e.shiftStart))].sort();

    // Summary
    const summary = {
        onTime: reportRows.filter((r: any) => ["ON_TIME", "WORKING"].includes(r.status)).length,
        late: reportRows.filter((r: any) => r.status === "LATE").length,
        absent: reportRows.filter((r: any) => r.status === "ABSENT").length,
        gpsOff: reportRows.filter((r: any) => r.status === "GPS_OFF").length,
    };

    return (
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Reports</h1>
                    <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <button onClick={exportCSV} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors active:scale-95">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">{summary.onTime}</p>
                    <p className="text-xs text-green-600 font-medium">On Time</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-700">{summary.late}</p>
                    <p className="text-xs text-amber-600 font-medium">Late</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-slate-700">{summary.absent}</p>
                    <p className="text-xs text-slate-500 font-medium">Absent</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-700">{summary.gpsOff}</p>
                    <p className="text-xs text-red-600 font-medium">GPS Off</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <select className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
                    <option value="">All Employees</option>
                    {activeEmployees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <select className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterShift} onChange={e => setFilterShift(e.target.value)}>
                    <option value="">All Shifts</option>
                    {uniqueShifts.map((s: any) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="ON_TIME">On Time</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                    <option value="GPS_OFF">GPS Off</option>
                    <option value="LEFT_WORK">Left Work</option>
                </select>
            </div>

            {/* Report Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Shift</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Arrival</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Distance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportRows.map((row: any) => {
                                const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.ABSENT;
                                return (
                                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">{row.avatarInitials}</div>
                                                <div><p className="text-sm font-semibold text-slate-900">{row.name}</p><p className="text-[11px] text-slate-400">{row.id}</p></div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5"><span className="text-xs font-medium capitalize text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{row.role}</span></td>
                                        <td className="px-4 py-3.5 font-mono text-sm text-slate-700">{row.shiftStart} – {row.shiftEnd}</td>
                                        <td className="px-4 py-3.5"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span></td>
                                        <td className="px-4 py-3.5 font-mono text-sm text-slate-700">{row.arrivalTime || "—"}</td>
                                        <td className="px-4 py-3.5 text-sm text-slate-600">{row.distance != null ? `${row.distance}m` : "—"}</td>
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
