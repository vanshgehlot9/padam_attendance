"use client";

import { motion } from "framer-motion";
import { Suspense } from "react";
import {
    Activity, Clock, MapPin, ShieldCheck, Info,
    Camera, Navigation
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveData } from "@/components/shared/LocationBlocker";

function ActivityContent() {
    const { user, employeeData } = useAuth();
    const { location, attendance } = useLiveData();

    const isTracking = location.status === "TRACKING";
    const isInsideRadius = location.isInsideRadius;
    const arrivalTime = attendance.arrivalTime;
    const attendanceStatus = attendance.attendanceStatus;

    return (
        <div className="flex flex-col h-full bg-slate-50 min-h-[1000px]">
            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-8 rounded-b-[2rem] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.05)] mb-6 z-10 relative">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100/50">
                        <Activity className="w-6 h-6 text-[#2563EB]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Your Activity</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Track your daily work & field visits</p>
                    </div>
                </div>
            </div>

            <div className="px-6 flex-1 flex flex-col gap-6">

                {/* Why We Track This Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-6 shadow-sm"
                >
                    <div className="flex items-start gap-3 mb-4">
                        <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Info className="w-4 h-4 text-[#2563EB]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">Why we use this?</h2>
                            <p className="text-sm text-slate-600 mt-1">
                                Activity tracking is designed to simplify your day and ensure fairness across the team.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 pl-11">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Automatic Attendance</h3>
                                <p className="text-xs text-slate-500 mt-0.5">No more manual registers. Your arrival is logged automatically when you enter the work zone.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Field Safety & Proof</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Location tracking verifies your field visits automatically, acting as proof of your hard work without extra paperwork.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Camera className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Clear Records</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Deal captures and site photos are geo-tagged and timestamped instantly, saving you from manual reporting.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Today's Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex-1 min-h-[300px]"
                >
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center justify-between">
                        Today's Activity Timeline
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            {isTracking && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                            Live
                        </span>
                    </h2>

                    <div className="relative pl-4 space-y-8 before:absolute before:inset-y-2 before:left-[7px] before:w-[2px] before:bg-slate-100">
                        {/* LEFT_WORK event */}
                        {attendanceStatus === "LEFT_WORK" && (
                            <div className="relative z-10 flex gap-4">
                                <div className="w-4 h-4 rounded-full bg-red-500 border-[3px] border-white shadow-sm ring-1 ring-slate-100 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-red-600 leading-tight">Left Work Zone</h4>
                                    <p className="text-xs text-slate-500 mt-1">You stepped outside the active radius for longer than allowed threshold.</p>
                                </div>
                            </div>
                        )}

                        {/* Current Location Tracking Status */}
                        {isTracking && (
                            <div className="relative z-10 flex gap-4">
                                <div className={`w-4 h-4 rounded-full border-[3px] border-white shadow-sm ring-1 ring-slate-100 shrink-0 mt-1 ${isInsideRadius ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                <div>
                                    <h4 className="font-bold text-slate-900 leading-tight">
                                        {isInsideRadius ? 'Working in Office / Zone' : 'Currently Outside Zone'}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">GPS is actively syncing your presence.</p>
                                </div>
                            </div>
                        )}

                        {/* Arrival event */}
                        {arrivalTime ? (
                            <div className="relative z-10 flex gap-4">
                                <div className={`w-4 h-4 rounded-full border-[3px] border-white shadow-sm ring-1 ring-slate-100 shrink-0 mt-1 ${attendanceStatus === "LATE" ? "bg-amber-500" : "bg-green-500"}`} />
                                <div>
                                    <h4 className="font-bold text-slate-900 leading-tight">
                                        {attendanceStatus === "LATE" ? "Arrived Late" : "Punched In Automatically"}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Recorded at {arrivalTime}
                                        {attendanceStatus === "LATE" && <span className="text-amber-600 ml-1 block mt-0.5 text-[10px] uppercase font-bold tracking-wider">Passes Grace Period</span>}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 flex gap-4 opacity-60">
                                <div className="w-4 h-4 rounded-full bg-slate-300 border-[3px] border-white shadow-sm ring-1 ring-slate-100 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-slate-500 leading-tight">Awaiting Arrival</h4>
                                    <p className="text-xs text-slate-400 mt-1">Enter office radius to clock in automatically</p>
                                </div>
                            </div>
                        )}

                        {/* Shift started */}
                        <div className="relative z-10 flex gap-4 opacity-60">
                            <div className="w-4 h-4 rounded-full bg-slate-300 border-[3px] border-white shadow-sm ring-1 ring-slate-100 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-slate-500 leading-tight">Day Started</h4>
                                <p className="text-xs text-slate-400 mt-1">Shift timeline initiated for today</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

export default function ActivityPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ActivityContent />
        </Suspense>
    );
}
