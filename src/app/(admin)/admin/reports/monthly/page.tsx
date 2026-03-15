"use client";

import { useEffect, useState, useMemo } from "react";
import { Download, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; shortLabel: string; color: string; bg: string }> = {
    ON_TIME: { label: "On Time", shortLabel: "P", color: "text-green-700", bg: "bg-green-50 border-green-200" },
    WORKING: { label: "Working", shortLabel: "P", color: "text-green-700", bg: "bg-green-50 border-green-200" },
    LATE: { label: "Late", shortLabel: "L", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    GPS_OFF: { label: "GPS Off", shortLabel: "G", color: "text-red-700", bg: "bg-red-50 border-red-200" },
    LEFT_WORK: { label: "Left Work", shortLabel: "LW", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
    ABSENT: { label: "Absent", shortLabel: "A", color: "text-slate-500", bg: "bg-slate-100 border-slate-200" },
    HOLIDAY: { label: "Holiday", shortLabel: "H", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
};

interface EmployeeType {
    id: string;
    name: string;
    role: string;
    avatarInitials: string;
}

export default function MonthlyReportsPage() {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const [data, setData] = useState<{ employees?: EmployeeType[], attendanceByEmployee?: Record<string, Record<string, { status: string }>>, holidays?: string[] } | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchMonthData = async (monthStr: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/reports/monthly?month=${monthStr}`);
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonthData(currentMonth);
    }, [currentMonth]);

    const changeMonth = (offset: number) => {
        const [y, m] = currentMonth.split("-").map(Number);
        const d = new Date(y, m - 1 + offset, 1);
        setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    // Compute calendar dates for the month
    const { daysInMonth, monthDates, todayStr } = useMemo(() => {
        const [year, month] = currentMonth.split("-").map(Number);
        const days = new Date(year, month, 0).getDate();
        const dates = [];
        for (let i = 1; i <= days; i++) {
            dates.push(`${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
        }

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        return { daysInMonth: days, monthDates: dates, todayStr };
    }, [currentMonth]);

    if (loading && !data) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

    const employees = data?.employees || [];
    const attendanceByEmployee = data?.attendanceByEmployee || {};

    // Helper to get status
    const getStatusForDay = (empId: string, dateStr: string) => {
        const record = attendanceByEmployee[empId]?.[dateStr];
        if (record) return record.status || "ABSENT";

        // If it's a future date, we don't mark as absent
        if (dateStr > todayStr) return null;

        // Check against custom holidays fetched from database
        const customHolidays = data?.holidays || [];
        if (customHolidays.includes(dateStr)) return "HOLIDAY";

        return "ABSENT"; // If in the past/today and no record, they are absent
    };

    const exportCSV = () => {
        const headers = ["Employee ID", "Name", "Role", ...monthDates.map(d => d.split("-")[2]), "Total Present", "Total Late", "Total Absent"];
        const csvRows = [headers.join(",")];

        employees.forEach((emp) => {
            let present = 0, late = 0, absent = 0;
            const dayStatuses = monthDates.map(dateStr => {
                const status = getStatusForDay(emp.id, dateStr);
                if (["ON_TIME", "WORKING"].includes(status || "")) present++;
                else if (status === "LATE") { present++; late++; } // Late is also present usually
                else if (status === "ABSENT") absent++;

                return STATUS_CONFIG[status || ""]?.shortLabel || "";
            });

            csvRows.push([emp.id, emp.name, emp.role, ...dayStatuses, present, late, absent].join(","));
        });

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `monthly_attendance_${currentMonth}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monthly Attendance</h1>
                    <p className="text-sm text-slate-500 mt-1">View detailed monthly attendance reports</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm p-1">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 px-4 font-semibold text-slate-700 min-w-[160px] justify-center">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            {new Date(currentMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                        </div>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <button onClick={exportCSV} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors active:scale-95">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Legend Map */}
            <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Legend:</span>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${config.bg} ${config.color} border`}>
                            {config.shortLabel}
                        </div>
                        <span className="text-xs font-medium text-slate-600">{config.label}</span>
                    </div>
                ))}
            </div>

            {/* Monthly Grid */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left px-6 py-4 font-semibold text-slate-700 min-w-[200px] sticky left-0 bg-slate-50/90 backdrop-blur-sm z-20 border-r border-slate-100">Employee</th>
                                {monthDates.map(dateStr => (
                                    <th key={dateStr} className={`px-2 py-3 text-center text-xs font-semibold uppercase ${dateStr === todayStr ? 'bg-blue-50 text-blue-700' : 'text-slate-500'} min-w-[40px]`}>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] opacity-70 mb-1">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][new Date(dateStr).getDay()]}</span>
                                            <span>{dateStr.split("-")[2]}</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="px-4 py-4 font-semibold text-center text-green-700 bg-green-50/50 whitespace-nowrap sticky right-0 z-20 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]">P</th>
                                <th className="px-4 py-4 font-semibold text-center text-amber-700 bg-amber-50/50 whitespace-nowrap">L</th>
                                <th className="px-4 py-4 font-semibold text-center text-slate-700 bg-slate-50/50 whitespace-nowrap tracking-tight">A</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => {
                                let totalPresent = 0, totalLate = 0, totalAbsent = 0;

                                return (
                                    <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.02)]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                                    {emp.avatarInitials}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">{emp.name}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{emp.role}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {monthDates.map(dateStr => {
                                            const status = getStatusForDay(emp.id, dateStr);

                                            // Calculate totals
                                            if (status === "ON_TIME" || status === "WORKING") totalPresent++;
                                            else if (status === "LATE") { totalPresent++; totalLate++; }
                                            else if (status === "ABSENT") totalAbsent++;

                                            if (!status) return <td key={dateStr} className="px-1 py-3 text-center"><div className="w-6 h-6 mx-auto rounded bg-slate-50 border border-slate-100 border-dashed" /></td>;

                                            const cfg = STATUS_CONFIG[status];
                                            return (
                                                <td key={dateStr} className={`px-1 py-3 text-center ${dateStr === todayStr ? 'bg-blue-50/30' : ''}`}>
                                                    <div className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-[10px] font-bold ${cfg.bg} ${cfg.color} border shadow-sm`} title={`${dateStr}: ${cfg.label}`}>
                                                        {cfg.shortLabel}
                                                    </div>
                                                </td>
                                            );
                                        })}

                                        <td className="px-4 py-3 text-center font-bold text-green-700 bg-green-50/30 font-mono sticky right-0 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.02)]">{totalPresent}</td>
                                        <td className="px-4 py-3 text-center font-bold text-amber-700 bg-amber-50/30 font-mono">{totalLate}</td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-700 bg-slate-50/30 font-mono">{totalAbsent}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {employees.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-slate-500">No active employees found.</p>
                </div>
            )}
        </div>
    );
}
