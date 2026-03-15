"use client";

import { motion } from "framer-motion";
import { Suspense } from "react";
import {
    Activity, MapPin, ShieldCheck,
    Camera, CheckCircle2, MapPinOff, AlertTriangle, Clock
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveData } from "@/components/shared/LocationBlocker";

// ── Individual Timeline Event ────────────────────────────────────────────────
function TimelineEvent({
    time,
    title,
    description,
    dotColor,
    icon: Icon,
    iconBg,
    delay = 0,
    isLast = false,
}: {
    time: string;
    title: string;
    description: string;
    dotColor: string;
    icon: React.ElementType;
    iconBg: string;
    delay?: number;
    isLast?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex gap-4"
        >
            {/* Vertical line segment */}
            {!isLast && (
                <div className="absolute left-[19px] top-9 bottom-[-28px] w-[2px] bg-gradient-to-b from-slate-100 to-transparent" />
            )}

            {/* Dot + Icon */}
            <div className="relative shrink-0 mt-0.5">
                <div className={`w-10 h-10 rounded-[13px] flex items-center justify-center shadow-sm ${iconBg}`}>
                    <Icon className={`w-[18px] h-[18px] ${dotColor}`} strokeWidth={2.5} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 pb-7">
                <p className="text-[11px] font-[600] text-[#64748B] uppercase tracking-widest mb-[3px]">{time}</p>
                <h4 className="text-[15px] font-[700] text-[#0F172A] leading-tight tracking-tight">{title}</h4>
                <p className="text-[13px] font-[500] text-[#64748B] mt-1 leading-snug">{description}</p>
            </div>
        </motion.div>
    );
}

// ── Feature Point in the Info Card ──────────────────────────────────────────
function FeaturePoint({
    icon: Icon,
    iconColor,
    bgColor,
    title,
    description,
}: {
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3.5">
            <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5 ${bgColor}`}>
                <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={2.5} />
            </div>
            <div>
                <h3 className="text-[13px] font-[700] text-[#0F172A]">{title}</h3>
                <p className="text-[12px] font-[500] text-[#64748B] mt-[3px] leading-snug">{description}</p>
            </div>
        </div>
    );
}

// ── Main Activity Content ────────────────────────────────────────────────────
function ActivityContent() {
    const { employeeData } = useAuth();
    const { location, attendance } = useLiveData();

    const isTracking = location.status === "TRACKING";
    const isInsideRadius = location.isInsideRadius;
    const arrivalTime = attendance.arrivalTime;
    const attendanceStatus = attendance.attendanceStatus;
    const shiftStart = employeeData?.shiftStart || "09:00";

    // Build real-time event list from live data
    type TimelineItem = {
        time: string;
        title: string;
        description: string;
        dotColor: string;
        iconBg: string;
        icon: React.ElementType;
    };

    const timelineEvents: TimelineItem[] = [];

    // 1. Tracking started (most recent at top)
    if (attendanceStatus === "LEFT_WORK") {
        timelineEvents.push({
            time: "Now",
            title: "Left Work Zone",
            description: "You stepped outside the active radius for longer than allowed.",
            dotColor: "text-[#EF4444]",
            iconBg: "bg-red-50",
            icon: MapPinOff,
        });
    } else if (isTracking) {
        timelineEvents.push({
            time: "Now",
            title: isInsideRadius ? "Working in Zone" : "Currently Outside Zone",
            description: isInsideRadius
                ? "You are inside the work radius. Attendance is being counted."
                : "GPS is actively syncing your presence.",
            dotColor: isInsideRadius ? "text-[#22C55E]" : "text-[#F59E0B]",
            iconBg: isInsideRadius ? "bg-green-50" : "bg-amber-50",
            icon: isInsideRadius ? ShieldCheck : MapPin,
        });
    }

    // 2. Attendance marked
    if (arrivalTime) {
        timelineEvents.push({
            time: arrivalTime,
            title: attendanceStatus === "LATE" ? "Arrived Late" : "Attendance Marked",
            description: attendanceStatus === "LATE"
                ? "Logged automatically on arrival. Grace period was exceeded."
                : "Logged automatically when you entered the work zone.",
            dotColor: attendanceStatus === "LATE" ? "text-[#F59E0B]" : "text-[#3B82F6]",
            iconBg: attendanceStatus === "LATE" ? "bg-amber-50" : "bg-blue-50",
            icon: CheckCircle2,
        });

        // 3. Entered work radius (estimated a few minutes before arrival)
        const [h, m] = arrivalTime.split(":").map(Number);
        const totalMins = h * 60 + m - 5;
        const entryH = Math.floor(totalMins / 60);
        const entryM = totalMins % 60;
        const amPm = entryH >= 12 ? "PM" : "AM";
        const displayH = entryH > 12 ? entryH - 12 : entryH === 0 ? 12 : entryH;
        const entryTime = `${String(displayH).padStart(2, "0")}:${String(entryM).padStart(2, "0")} ${amPm}`;

        timelineEvents.push({
            time: entryTime,
            title: "Entered Work Radius",
            description: "GPS detected you within the work zone boundary.",
            dotColor: "text-[#22C55E]",
            iconBg: "bg-green-50",
            icon: MapPin,
        });
    } else {
        timelineEvents.push({
            time: "Waiting",
            title: "Awaiting Arrival",
            description: "Enter the office radius to clock in automatically.",
            dotColor: "text-[#64748B]",
            iconBg: "bg-slate-100",
            icon: Clock,
        });
    }

    // 4. Day started (always shown as the oldest event)
    timelineEvents.push({
        time: shiftStart,
        title: "Shift Timeline Started",
        description: "Your attendance window opened for today's shift.",
        dotColor: "text-[#3B82F6]",
        iconBg: "bg-[#EEF2FF]",
        icon: Activity,
    });

    return (
        <div className="flex flex-col bg-[#F4F7FB] min-h-full pb-10">

            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mx-4 mt-5"
            >
                <div className="bg-white rounded-[22px] px-5 py-4 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.05)] flex items-center gap-4 border border-white/50">
                    <div className="w-12 h-12 bg-[#EEF2FF] rounded-[16px] flex items-center justify-center shrink-0">
                        <Activity className="w-6 h-6 text-[#3B82F6]" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-[700] text-[#0F172A] leading-tight tracking-tight">Your Activity</h1>
                        <p className="text-[13px] font-[500] text-[#64748B] mt-[2px]">Track your daily work &amp; field visits.</p>
                    </div>
                </div>
            </motion.div>

            <div className="px-4 mt-4 flex flex-col gap-4">

                {/* Info Card – Why we track this */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-[#EFF6FF] border border-blue-100/80 rounded-[20px] p-5 shadow-sm"
                >
                    <h2 className="text-[16px] font-[700] text-[#0F172A] mb-1.5">Why we use this?</h2>
                    <p className="text-[13px] font-[500] text-[#64748B] mb-5 leading-relaxed">
                        Activity tracking helps simplify daily work and ensures fairness across the team.
                    </p>
                    <div className="flex flex-col gap-4">
                        <FeaturePoint
                            icon={ShieldCheck}
                            iconColor="text-[#22C55E]"
                            bgColor="bg-green-50"
                            title="Automatic Attendance"
                            description="Arrival is automatically logged when entering the work zone."
                        />
                        <FeaturePoint
                            icon={MapPin}
                            iconColor="text-[#3B82F6]"
                            bgColor="bg-blue-50"
                            title="Field Safety &amp; Proof"
                            description="Location verification confirms field visits and provides proof of work."
                        />
                        <FeaturePoint
                            icon={Camera}
                            iconColor="text-[#8B5CF6]"
                            bgColor="bg-violet-50"
                            title="Clear Records"
                            description="Geo-tagged photos and timestamps create transparent records."
                        />
                    </div>
                </motion.div>

                {/* Today's Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.05)] border border-white/50"
                >
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[16px] font-[700] text-[#0F172A] tracking-tight">
                            Today&apos;s Activity Timeline
                        </h2>
                        <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full">
                            <div className={`w-[7px] h-[7px] rounded-full ${isTracking ? "bg-[#22C55E] animate-pulse" : "bg-slate-300"}`} />
                            <span className={`text-[10px] font-[700] uppercase tracking-widest ${isTracking ? "text-[#22C55E]" : "text-[#64748B]"}`}>
                                {isTracking ? "Live" : "Offline"}
                            </span>
                        </div>
                    </div>

                    {/* Events */}
                    <div className="flex flex-col">
                        {timelineEvents.map((event, idx) => (
                            <TimelineEvent
                                key={idx}
                                time={event.time}
                                title={event.title}
                                description={event.description}
                                dotColor={event.dotColor}
                                iconBg={event.iconBg}
                                icon={event.icon}
                                delay={0.16 + idx * 0.08}
                                isLast={idx === timelineEvents.length - 1}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Active Status Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className={`rounded-[18px] p-4 border flex items-center gap-3.5 ${
                        !isTracking
                            ? "bg-slate-50 border-slate-100"
                            : isInsideRadius
                            ? "bg-green-50/70 border-green-100"
                            : "bg-amber-50/70 border-amber-100"
                    }`}
                >
                    <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${
                        !isTracking ? "bg-white" : isInsideRadius ? "bg-white" : "bg-white"
                    }`}>
                        {isInsideRadius ? (
                            <CheckCircle2 className="w-5 h-5 text-[#22C55E]" strokeWidth={2.5} />
                        ) : (
                            <AlertTriangle className={`w-5 h-5 ${isTracking ? "text-[#F59E0B]" : "text-[#64748B]"}`} strokeWidth={2.5} />
                        )}
                    </div>
                    <div>
                        <p className="text-[14px] font-[700] text-[#0F172A] leading-tight">
                            {!isTracking
                                ? "Tracking Inactive"
                                : isInsideRadius
                                ? "Working Inside Zone"
                                : "Currently Outside Zone"}
                        </p>
                        <p className="text-[12px] font-[500] text-[#64748B] mt-[3px]">
                            {!isTracking
                                ? "Enable location to start tracking."
                                : isInsideRadius
                                ? "Attendance is being counted."
                                : "GPS is actively syncing your presence."}
                        </p>
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
                <div className="w-8 h-8 border-[3px] border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ActivityContent />
        </Suspense>
    );
}
