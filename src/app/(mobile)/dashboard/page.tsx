"use client";

import { useState, useEffect } from "react";
import {
    Bell, CheckCircle2, Navigation,
    Clock, MapPin, Activity, ShieldCheck, Camera,
    AlertOctagon, Factory,
    User, // Using User instead of LogIn for now as LogIn is an action
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import { BaseMap } from "@/components/map/BaseMap";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveData } from "@/components/shared/LocationBlocker";

// ── Early Leave Confirmation Sheet (unchanged structure) ────────────────────────
function EarlyLeaveSheet({
    shiftEnd,
    onConfirm,
    onCancel,
}: { shiftEnd: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[90] flex items-end"
            >
                <motion.div
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 220 }}
                    className="w-full bg-white rounded-t-[32px] p-6 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
                >
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 bg-red-50 rounded-[18px] flex items-center justify-center">
                            <AlertOctagon className="w-7 h-7 text-[#EF4444]" />
                        </div>
                        <div>
                            <h2 className="text-[20px] font-bold text-[#0F172A]">Early Punch Out</h2>
                            <p className="text-sm text-[#64748B]">Your shift ends at <span className="font-semibold text-[#0F172A]">{shiftEnd}</span></p>
                        </div>
                    </div>
                    <p className="text-[14px] text-slate-600 bg-red-50/50 border border-red-100/50 rounded-[16px] p-4 mb-8 leading-relaxed">
                        ⚠️ Punching out early will notify your admin immediately with your location and time. Are you sure?
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="flex-1 h-[52px] rounded-[16px] border border-slate-200 font-[600] text-[#64748B] text-[15px] active:scale-95 transition-transform bg-white">
                            Cancel
                        </button>
                        <button onClick={onConfirm} className="flex-1 h-[52px] rounded-[16px] bg-[#EF4444] text-white font-[600] text-[15px] shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] active:scale-95 transition-transform">
                            Confirm Punch Out
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── Factory Punch Panel ───────────────────────────────────────────────────────
// Note: Adapting factory panel to match the new aesthetic, even though requested focused on office
function FactoryPunchPanel() {
    const { attendance, punchIn, punchOut } = useLiveData();
    const { employeeData } = useAuth();
    const [loading, setLoading] = useState<"in" | "out" | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const iv = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(iv);
    }, []);

    const shiftStart = employeeData?.shiftStart || attendance.shiftStart || "09:00";
    const shiftEnd = employeeData?.shiftEnd || attendance.shiftEnd || "18:00";
    const graceMinutes = employeeData?.graceMinutes ?? 15;
    const isPunchedIn = !!attendance.arrivalTime;
    const isPunchedOut = attendance.attendanceStatus === "PUNCHED_OUT";
    const isLate = attendance.attendanceStatus === "LATE";

    const getActiveDuration = () => {
        if (!attendance.arrivalTime) return null;
        const [h, m] = attendance.arrivalTime.split(":").map(Number);
        const now = new Date();
        const diffMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000
            - (h * 3600000 + m * 60000);
        if (diffMs <= 0) return "00:00:00";
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const handlePunchIn = async () => {
        setLoading("in");
        await punchIn(shiftStart, graceMinutes);
        setLoading(null);
    };

    const handlePunchOutRequest = () => {
        const [eh, em] = shiftEnd.split(":").map(Number);
        const now = new Date();
        const isEarly = now.getHours() * 60 + now.getMinutes() < eh * 60 + em;
        if (isEarly) {
            setShowConfirm(true);
        } else {
            confirmPunchOut();
        }
    };

    const confirmPunchOut = async () => {
        setShowConfirm(false);
        setLoading("out");
        await punchOut();
        setLoading(null);
    };

    const activeDuration = getActiveDuration();

    return (
        <>
            {showConfirm && (
                <EarlyLeaveSheet
                    shiftEnd={shiftEnd}
                    onConfirm={confirmPunchOut}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
            <div className="px-5 mt-2 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-50 rounded-[10px] flex items-center justify-center">
                        <Factory className="w-4 h-4 text-[#F59E0B]" />
                    </div>
                    <span className="text-[11px] font-[700] text-amber-600 uppercase tracking-widest">Factory Floor</span>
                </div>

                {!isPunchedIn && (
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={handlePunchIn}
                        disabled={!!loading}
                        className="w-full h-[56px] rounded-[16px] bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-white font-[600] text-[16px] shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-70"
                    >
                        {loading === "in" ? (
                            <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Punch In Now"
                        )}
                    </motion.button>
                )}

                {isPunchedIn && !isPunchedOut && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-[22px] shadow-sm p-5 flex items-center justify-between">
                            <div>
                                <p className="text-[12px] text-[#64748B] font-medium mb-1">Punched In At</p>
                                <p className="text-[24px] font-[700] text-[#0F172A] tracking-tight">{attendance.arrivalTime}</p>
                                <span className={`mt-2 inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isLate ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>
                                    {isLate ? "Late" : "On Time"}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-[12px] text-[#64748B] font-medium mb-1">Active Time</p>
                                <p className="text-[20px] font-[700] text-[#3B82F6] font-mono tracking-tight">{activeDuration || "—"}</p>
                            </div>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={handlePunchOutRequest}
                            disabled={!!loading}
                            className="w-full h-[56px] rounded-[16px] bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white font-[600] text-[16px] shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-70"
                        >
                            {loading === "out" ? (
                                <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Punch Out"
                            )}
                        </motion.button>
                    </div>
                )}

                {isPunchedOut && (
                    <div className="bg-white rounded-[22px] shadow-sm p-6 flex flex-col gap-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-50 rounded-[14px] flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-6 h-6 text-[#22C55E]" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[16px] font-[700] text-[#0F172A]">Shift Complete</p>
                                <p className="text-[13px] text-[#64748B] font-medium">Great work today!</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// ── Main Dashboard Content ────────────────────────────────────────────────────
function DashboardContent() {
    const { user, employeeData } = useAuth();
    const { location, attendance, employeeRole } = useLiveData();
    const [tick, setTick] = useState(0);

    // Ensure re-render to update timers
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const role = employeeRole || employeeData?.role || "office";
    const employeeName = employeeData?.name || user?.displayName || "User";
    const initials = employeeData?.avatarInitials ||
        employeeName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

    // GPS state
    const isTracking = location.status === "TRACKING";
    const gpsOff = location.status === "TIMEOUT" || location.status === "DENIED";
    const isInsideRadius = location.isInsideRadius;
    const distanceM = location.distanceFromOffice;

    const arrivalTime = attendance.arrivalTime;
    const attendanceStatus = attendance.attendanceStatus;

    const getActiveTime = () => {
        if (!arrivalTime || !isInsideRadius) return null;
        const [h, m] = arrivalTime.split(":").map(Number);
        const now = new Date();
        const arrivalMs = h * 3600000 + m * 60000;
        const nowMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;
        const diffMs = Math.max(0, nowMs - arrivalMs);
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        return `${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m`;
    };

    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay);

    const activeTime = getActiveTime();

    return (
        <div className="flex flex-col bg-[#F4F7FB] min-h-full pb-10">
            {/* Top Section – Employee Header */}
            <div className="px-4 pt-6 md:pt-8 pb-3">
                <div className="bg-white rounded-[22px] p-5 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.05)] border border-white/50 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        {/* Left Side: Avatar & Info */}
                        <div className="flex gap-3.5">
                            <div className="w-[50px] h-[50px] bg-[#EEF2FF] rounded-full flex items-center justify-center text-[#3B82F6] font-[700] text-[18px] shrink-0 border-2 border-white shadow-sm ring-1 ring-[#3B82F6]/10">
                                {initials}
                            </div>
                            <div className="flex flex-col mt-0.5">
                                <h1 className="text-[18px] font-[700] text-[#0F172A] tracking-tight leading-tight">
                                    {employeeName}
                                </h1>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className="text-[11px] font-[600] text-[#64748B] uppercase tracking-wide bg-slate-50 px-2 py-0.5 rounded-md">
                                        {role}
                                    </span>
                                    {role !== "factory" && (
                                        <span className={`px-2 py-[2px] rounded-full text-[10px] font-bold uppercase tracking-wide ${gpsOff ? "bg-red-50 text-[#EF4444]" :
                                            attendanceStatus === "LEFT_WORK" ? "bg-red-50 text-[#EF4444]" :
                                                !isInsideRadius ? "bg-amber-50 text-[#F59E0B]" :
                                                    "bg-green-50 text-[#22C55E]"
                                            }`}>
                                            {gpsOff ? "GPS OFF" :
                                                attendanceStatus === "LEFT_WORK" ? "LEFT WORK" :
                                                    !isInsideRadius ? "OUTSIDE" : "INSIDE"}
                                        </span>
                                    )}
                                </div>
                                {employeeData && (
                                    <p className="text-[12px] font-[500] text-[#64748B] mt-2 flex items-center gap-1.5">
                                        <Clock className="w-[14px] h-[14px] text-slate-400" />
                                        Shift: {employeeData.shiftStart} – {employeeData.shiftEnd}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Bell Icon */}
                        <motion.button 
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 rounded-full bg-slate-50/80 flex items-center justify-center relative border border-slate-100 shrink-0"
                        >
                            <div className="absolute top-[10px] right-[10px] w-2 h-2 bg-[#EF4444] rounded-full border border-white" />
                            <Bell className="w-[18px] h-[18px] text-[#0F172A]" strokeWidth={2} />
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Date Selector */}
            <div className="px-4 py-2">
                <div className="flex justify-between items-center gap-[6px]">
                    {days.map((day, idx) => {
                        const date = new Date(startOfWeek);
                        date.setDate(startOfWeek.getDate() + idx);
                        const isSelected = idx === currentDay;
                        
                        return (
                            <motion.div 
                                key={idx} 
                                whileTap={{ scale: 0.95 }}
                                className={`flex flex-col items-center justify-center flex-1 h-[64px] rounded-[16px] transition-all cursor-pointer select-none ${
                                    isSelected 
                                        ? "bg-[#3B82F6] text-white shadow-[0_6px_14px_-4px_rgba(59,130,246,0.4)]" 
                                        : "bg-transparent text-[#64748B] hover:bg-slate-200/50"
                                }`}
                            >
                                <span className={`text-[10px] font-[600] uppercase mb-[2px] ${isSelected ? "text-blue-100" : "text-[#64748B]"}`}>
                                    {day}
                                </span>
                                <span className={`text-[18px] font-[700] tracking-tight ${isSelected ? "text-white" : "text-[#0F172A]"}`}>
                                    {date.getDate()}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {role === "factory" ? (
                <FactoryPunchPanel />
            ) : (
                <div className="px-4 mt-3 flex flex-col gap-4">
                    
                    {/* Attendance Status Cards Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        
                        {/* Arrival Card */}
                        <motion.div whileTap={{ scale: 0.98 }} className="bg-white p-4 rounded-[18px] shadow-[0_2px_8px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between h-[100px] border border-white">
                            <Clock className="w-5 h-5 text-[#3B82F6]" strokeWidth={2.5} />
                            <div>
                                <p className="text-[12px] font-[500] text-[#64748B] mb-[2px]">Arrival Time</p>
                                <p className="text-[15px] font-[700] text-[#0F172A] leading-none tracking-tight">
                                    {arrivalTime || "Not Arrived"}
                                </p>
                            </div>
                        </motion.div>

                        {/* Location Card */}
                        <motion.div whileTap={{ scale: 0.98 }} className="bg-white p-4 rounded-[18px] shadow-[0_2px_8px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between h-[100px] border border-white">
                            <ShieldCheck className={`w-5 h-5 stroke-[2.5] ${isInsideRadius ? "text-[#22C55E]" : "text-[#EF4444]"}`} />
                            <div>
                                <p className="text-[12px] font-[500] text-[#64748B] mb-[2px]">Loc Status</p>
                                <p className={`text-[15px] font-[700] leading-none tracking-tight ${isInsideRadius ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                                    {gpsOff ? "GPS Off" : isInsideRadius ? "Inside Radius" : "Outside Radius"}
                                </p>
                            </div>
                        </motion.div>

                        {/* Active Time Card */}
                        <motion.div whileTap={{ scale: 0.98 }} className="bg-white p-4 rounded-[18px] shadow-[0_2px_8px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between h-[100px] border border-white">
                            <Activity className="w-5 h-5 text-[#F59E0B]" strokeWidth={2.5} />
                            <div>
                                <p className="text-[12px] font-[500] text-[#64748B] mb-[2px]">Active Time</p>
                                <p className={`text-[16px] font-[700] font-mono leading-none tracking-tight ${!isInsideRadius ? "text-slate-400" : "text-[#0F172A]"}`}>
                                    {activeTime || "00h 00m"}
                                </p>
                            </div>
                        </motion.div>

                        {/* Distance Card */}
                        <motion.div whileTap={{ scale: 0.98 }} className="bg-white p-4 rounded-[18px] shadow-[0_2px_8px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between h-[100px] border border-white">
                            <Navigation className="w-5 h-5 text-[#8B5CF6]" strokeWidth={2.5} />
                            <div>
                                <p className="text-[12px] font-[500] text-[#64748B] mb-[2px]">Distance</p>
                                <p className="text-[15px] font-[700] text-[#0F172A] leading-none tracking-tight">
                                    {distanceM !== null ? distanceM + "m" : "—"}
                                </p>
                            </div>
                        </motion.div>

                    </div>

                    {/* Live Location Map Card */}
                    <div className="bg-slate-200 rounded-[22px] h-[220px] relative overflow-hidden shadow-sm border-[3px] border-white">
                        <div className="absolute inset-0 opacity-60 mix-blend-multiply pointer-events-none">
                            <BaseMap
                                interactive={false}
                                center={location.latitude && location.longitude ? [location.longitude, location.latitude] : [73.0733824, 26.3217462]}
                                zoom={15.5}
                            />
                        </div>
                        
                        {/* Soft overlay gradient for better text legibility at the bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none" />

                        {/* Premium Location Marker */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                            {/* Blue radius circle */}
                            <div className="w-[120px] h-[120px] rounded-full border-2 border-[#3B82F6]/30 bg-[#3B82F6]/10" />
                            {/* Pin */}
                            <div className="absolute z-10 flex flex-col items-center">
                                <div className={`w-10 h-10 flex items-center justify-center rounded-full shadow-lg ${isInsideRadius ? "bg-white text-[#3B82F6]" : "bg-white text-[#EF4444]"}`}>
                                    <MapPin className="w-5 h-5" strokeWidth={2.5} />
                                </div>
                                <div className="w-1.5 h-10 bg-gradient-to-b from-black/20 to-transparent -mt-1 mix-blend-multiply opacity-50" />
                            </div>
                            {/* Pulse */}
                            {isTracking && <div className={`absolute w-[50px] h-[50px] rounded-full animate-ping opacity-30 ${isInsideRadius ? "bg-[#3B82F6]" : "bg-[#EF4444]"}`} />}
                        </div>

                        {/* Floating Info Bar */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-[12px] px-3 py-2 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)] min-w-max border border-white z-20">
                            {isTracking ? (
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${isInsideRadius ? "bg-[#22C55E]" : "bg-[#EF4444]"}`} />
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                            )}
                            <span className="text-[12px] font-[600] text-[#0F172A] tracking-wider uppercase flex items-center gap-1.5">
                                {isTracking ? "Live" : "Inactive"} 
                                {distanceM !== null && <span className="text-[#64748B] font-medium tracking-normal capitalize flex items-center gap-1">&bull; {distanceM}m away</span>}
                            </span>
                        </div>
                    </div>

                    {/* Attendance Status Banner */}
                    <motion.div 
                        initial={false}
                        animate={{ scale: 1 }}
                        className={`w-full p-4 rounded-[16px] flex items-center justify-between border ${
                            gpsOff ? "bg-red-50/50 border-red-100 text-[#EF4444]" :
                            isInsideRadius ? "bg-green-50/50 border-green-100 text-[#22C55E]" : 
                            "bg-red-50/50 border-red-100 text-[#EF4444]"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm`}>
                                <CheckCircle2 className={`w-5 h-5 ${isInsideRadius ? "text-[#22C55E]" : "text-[#EF4444]"}`} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-[11px] font-[600] uppercase tracking-wider mb-[2px] ${isInsideRadius ? "text-green-600/70" : "text-red-500/80"}`}>
                                    Status
                                </span>
                                <span className={`text-[14px] font-[700] tracking-tight text-[#0F172A]`}>
                                    {gpsOff ? "Location Services Disabled" :
                                     isInsideRadius ? "Ready to Mark Attendance" : 
                                     "Outside — Attendance Paused"}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                </div>
            )}
        </div>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full min-h-[500px]"><div className="w-8 h-8 border-[3px] border-[#3B82F6] border-t-transparent rounded-full animate-spin" /></div>}>
            <DashboardContent />
        </Suspense>
    );
}
