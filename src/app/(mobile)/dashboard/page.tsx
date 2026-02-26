"use client";

import { useState, useEffect } from "react";
import {
    Bell, CheckCircle2, Navigation, AlertTriangle,
    Clock, MapPin, Activity, ShieldCheck, ChevronRight, Camera
} from "lucide-react";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { BaseMap } from "@/components/map/BaseMap";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveData } from "@/components/shared/LocationBlocker";

function DashboardContent() {
    const { user, employeeData } = useAuth();
    const { location, attendance } = useLiveData();
    const [tick, setTick] = useState(0);

    // Tick every second for live active time counter
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const role = employeeData?.role || "office";
    const employeeName = employeeData?.name || user?.displayName || "User";
    const initials = employeeData?.avatarInitials ||
        employeeName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

    // GPS state
    const isTracking = location.status === "TRACKING";
    const gpsOff = location.status === "TIMEOUT" || location.status === "DENIED";
    const isInsideRadius = location.isInsideRadius;
    const distanceM = location.distanceFromOffice;

    // Attendance state
    const arrivalTime = attendance.arrivalTime;
    const attendanceStatus = attendance.attendanceStatus;

    // Tracking indicator: green if heartbeat < 60s ago
    const trackingActive = location.lastHeartbeatAge !== null && location.lastHeartbeatAge < 60000;

    // Active time calculation
    const getActiveTime = () => {
        if (!arrivalTime || !isInsideRadius) return null;
        const [h, m] = arrivalTime.split(":").map(Number);
        const now = new Date();
        const arrivalMs = h * 3600000 + m * 60000;
        const nowMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;
        const diffMs = Math.max(0, nowMs - arrivalMs);
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    // Date scroller
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay);

    // Arrival status label
    const statusLabel = attendanceStatus === "ON_TIME" ? "On Time"
        : attendanceStatus === "LATE" ? "Late"
            : attendanceStatus === "LEFT_WORK" ? "Left"
                : "—";
    const statusColor = attendanceStatus === "ON_TIME" ? "text-green-600 bg-green-50"
        : attendanceStatus === "LATE" ? "text-amber-600 bg-amber-50"
            : attendanceStatus === "LEFT_WORK" ? "text-red-600 bg-red-50"
                : "text-slate-500 bg-slate-50";

    const activeTime = getActiveTime();

    return (
        <div className="flex flex-col h-full bg-slate-50 min-h-[1000px]">
            {/* Outside Office Warning Banner */}
            {isTracking && !isInsideRadius && arrivalTime && (
                <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between shadow-md relative z-20">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-semibold">You are currently outside office location</span>
                    </div>
                    <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold">{distanceM}m away</span>
                </div>
            )}

            {/* GPS Off Warning */}
            {gpsOff && (
                <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between shadow-md relative z-20">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-semibold">Location Required to Continue Work</span>
                    </div>
                </div>
            )}

            {/* Header Profile */}
            <div className="bg-white px-6 pt-10 pb-6 rounded-b-[2rem] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.05)] mb-6 z-10 relative">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-[#2563EB] font-bold text-lg">
                            {initials}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 leading-tight">{employeeName}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{role} Staff</span>
                                <span className={`px-2 py-[2px] rounded-full text-[10px] font-bold uppercase tracking-wider ${gpsOff ? "bg-red-100 text-red-600" :
                                        attendanceStatus === "LEFT_WORK" ? "bg-red-100 text-red-600" :
                                            !isInsideRadius ? "bg-amber-100 text-amber-700" :
                                                "bg-green-100 text-green-700"
                                    }`}>
                                    {gpsOff ? "GPS OFF" :
                                        attendanceStatus === "LEFT_WORK" ? "LEFT WORK" :
                                            !isInsideRadius ? "OUTSIDE" : "IN OFFICE"}
                                </span>
                            </div>
                            {employeeData && (
                                <div className="mt-2 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-500">
                                        Your shift: <span className="text-slate-900 font-semibold">{employeeData.shiftStart} – {employeeData.shiftEnd}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button className="relative w-10 h-10 flex items-center justify-center rounded-full border border-slate-100 bg-slate-50 active:scale-95 transition-transform">
                        <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        <Bell className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Date Selector */}
                <div className="flex justify-between items-center gap-2 overflow-x-auto hide-scrollbar -mx-2 px-2">
                    {days.map((day, idx) => {
                        const date = new Date(startOfWeek);
                        date.setDate(startOfWeek.getDate() + idx);
                        return (
                            <div key={idx} className={`flex flex-col items-center justify-center w-12 h-16 rounded-2xl flex-shrink-0 transition-colors ${idx === currentDay ? "bg-[#2563EB] text-white shadow-[0_8px_16px_-4px_rgba(37,99,235,0.4)]" : "bg-transparent text-slate-400"}`}>
                                <span className="text-[10px] font-medium uppercase mb-1 opacity-80">{day}</span>
                                <span className={`text-lg font-bold ${idx === currentDay ? "text-white" : "text-slate-800"}`}>{date.getDate()}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="px-6 flex-1 flex flex-col gap-6">

                {/* Status Grid — All GPS-driven */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Arrival Time Card */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28">
                        <div className="flex items-start justify-between">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-[#2563EB]" />
                            </div>
                            {arrivalTime && <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${statusColor}`}>{statusLabel}</span>}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-0.5">Arrival Time</p>
                            <p className="text-lg font-bold text-slate-900">{arrivalTime || "— Not Arrived —"}</p>
                        </div>
                    </div>

                    {/* Location Status Card — LIVE */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28">
                        <div className="flex items-start justify-between">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                            </div>
                            {!isInsideRadius && isTracking && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md uppercase tracking-wide">Outside</span>}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-0.5">Loc Status</p>
                            <p className={`text-lg font-bold ${isInsideRadius ? 'text-green-600' : 'text-red-600'}`}>
                                {gpsOff ? "GPS Off" : isInsideRadius ? "Inside Radius" : "Outside Radius"}
                            </p>
                        </div>
                    </div>

                    {/* Active Time Card — LIVE TICKING */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28">
                        <div className="flex items-start justify-between">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-orange-500" />
                            </div>
                            {activeTime && isInsideRadius && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-0.5">Active Time</p>
                            <p className={`text-lg font-bold font-mono ${!isInsideRadius ? 'text-slate-400' : 'text-slate-900'}`}>
                                {activeTime || "—"}
                                {!isInsideRadius && arrivalTime && <span className="text-[10px] font-normal text-red-500 ml-1">paused</span>}
                            </p>
                        </div>
                    </div>

                    {/* Distance Card — LIVE */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28">
                        <div className="flex items-start justify-between">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                <Navigation className="w-4 h-4 text-purple-500" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-0.5">Distance</p>
                            <p className={`text-lg font-bold ${isInsideRadius ? 'text-green-600' : distanceM && distanceM > 100 ? 'text-red-600' : 'text-slate-900'}`}>
                                {distanceM !== null ? `${distanceM}m` : "—"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Live Location Map */}
                <div className="bg-slate-200 rounded-3xl h-48 relative overflow-hidden shadow-sm border-2 border-white">
                    <div className="absolute inset-0 opacity-50 mix-blend-multiply pointer-events-none">
                        <BaseMap
                            interactive={false}
                            center={location.latitude && location.longitude ? [location.longitude, location.latitude] : [73.0733824, 26.3217462]}
                            zoom={15}
                        />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                        <div className="w-32 h-32 rounded-full border border-blue-300 bg-blue-100/30"></div>
                        <div className="absolute z-10 flex flex-col items-center">
                            <MapPin className={`w-8 h-8 drop-shadow-md ${gpsOff ? 'text-slate-400' : isInsideRadius ? 'text-[#2563EB] pb-1' : 'text-red-500 pb-1'}`} />
                            <div className={`w-3 h-1 rounded-[100%] shadow-lg ${gpsOff ? 'bg-slate-400' : isInsideRadius ? 'bg-[#2563EB]' : 'bg-red-500'}`}></div>
                        </div>
                        {isTracking && <div className={`absolute w-12 h-12 rounded-full animate-ping opacity-20 ${isInsideRadius ? 'bg-blue-500' : 'bg-red-500'}`}></div>}
                    </div>

                    {/* Tracking Indicator */}
                    <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl py-2 px-3 flex items-center gap-2 shadow-sm border border-white">
                        {isTracking ? (
                            trackingActive || location.lastHeartbeatAge === null ? (
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                            )
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                        )}
                        <span className="text-xs font-medium text-slate-700">
                            {!isTracking ? "Tracking inactive" :
                                (trackingActive || location.lastHeartbeatAge === null) ? "🟢 Tracking active" : "🔴 Tracking lost"}
                        </span>
                        {distanceM !== null && (
                            <span className="text-xs text-slate-400 ml-auto">{distanceM}m from office</span>
                        )}
                    </div>
                </div>

                {/* Primary Action Button */}
                <div className="mt-2">
                    {role === 'office' ? (
                        <motion.div whileTap={{ scale: 0.98 }} className="w-full bg-slate-100 border border-slate-200 p-4 rounded-xl flex items-center justify-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isInsideRadius ? 'bg-green-100' : 'bg-red-100'}`}>
                                <CheckCircle2 className={`w-4 h-4 ${isInsideRadius ? 'text-green-600' : 'text-red-600'}`} />
                            </div>
                            <span className={`font-semibold ${isInsideRadius ? 'text-slate-600' : 'text-red-600'}`}>
                                {isInsideRadius ? "Attendance Auto Active" : "Outside Office — Attendance Paused"}
                            </span>
                        </motion.div>
                    ) : (
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-xl bg-[#2563EB] shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)]"
                        >
                            <Camera className="w-5 h-5" />
                            Submit Deal / Work Proof
                        </motion.button>
                    )}
                </div>

                {/* Activity Timeline — GPS Driven */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mt-2 flex-1 min-h-[260px]">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center justify-between">
                        Today&apos;s Activity
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            {isTracking && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                            Live
                        </span>
                    </h2>

                    <div className="relative pl-4 space-y-6 before:absolute before:inset-y-2 before:left-[7px] before:w-[2px] before:bg-slate-100">
                        {/* LEFT_WORK event */}
                        {attendanceStatus === "LEFT_WORK" && (
                            <div className="relative z-10 flex gap-4">
                                <div className="w-4 h-4 rounded-full bg-red-500 border-[3px] border-white shadow-sm ring-1 ring-slate-100 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-red-600 leading-tight">Left Office</h4>
                                    <p className="text-xs text-slate-500 mt-1">Outside radius for more than 2 minutes</p>
                                </div>
                            </div>
                        )}

                        {/* Arrival event */}
                        {arrivalTime ? (
                            <div className="relative z-10 flex gap-4">
                                <div className={`w-4 h-4 rounded-full border-[3px] border-white shadow-sm ring-1 ring-slate-100 shrink-0 ${attendanceStatus === "LATE" ? "bg-amber-500" : "bg-green-500"}`} />
                                <div>
                                    <h4 className="font-semibold text-slate-900 leading-tight">
                                        {attendanceStatus === "LATE" ? "Arrived Late" : "Arrived Office"}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {arrivalTime}
                                        {attendanceStatus === "LATE" && <span className="text-amber-600 ml-1">• After grace period</span>}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 flex gap-4">
                                <div className="w-4 h-4 rounded-full bg-slate-300 border-[3px] border-white shadow-sm ring-1 ring-slate-100 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-slate-500 leading-tight">Awaiting Arrival</h4>
                                    <p className="text-xs text-slate-400 mt-1">Enter office radius to mark attendance automatically</p>
                                </div>
                            </div>
                        )}

                        {/* GPS tracking started */}
                        {isTracking && (
                            <div className="relative z-10 flex gap-4">
                                <div className="w-4 h-4 rounded-full bg-blue-400 border-[3px] border-white shadow-sm ring-1 ring-slate-100 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-slate-900 leading-tight">GPS Tracking Started</h4>
                                    <p className="text-xs text-slate-500 mt-1">Location tracking active</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
            <DashboardContent />
        </Suspense>
    );
}
