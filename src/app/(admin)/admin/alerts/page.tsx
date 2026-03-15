"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, MapPin, Shield, Clock, ExternalLink, X } from "lucide-react";
import Link from "next/link";

type AlertType = "GPS_OFF" | "LEFT_WORK" | "FIELD_INACTIVE" | "ATTENDANCE_INVALID" | "LATE_ARRIVAL" | "EARLY_LEAVE";

interface Alert {
    id: string;
    type: AlertType;
    employeeId: string;
    employeeName: string;
    message: string;
    severity: "info" | "warning" | "critical";
    timestamp: number;
    read: boolean;
    latitude?: number | null;
    longitude?: number | null;
    role?: string;
}

const typeConfig: Record<AlertType, { icon: any; label: string; color: string; bg: string; border: string }> = {
    GPS_OFF: { icon: AlertTriangle, label: "GPS Off", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    LEFT_WORK: { icon: MapPin, label: "Left Office", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
    FIELD_INACTIVE: { icon: Clock, label: "Field Inactive", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    ATTENDANCE_INVALID: { icon: Shield, label: "Invalid Attendance", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    LATE_ARRIVAL: { icon: Clock, label: "Late Arrival", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    EARLY_LEAVE: { icon: AlertTriangle, label: "Early Leave", color: "text-red-700", bg: "bg-red-50", border: "border-red-300" },
};

const severityBadge: Record<string, string> = {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
};

/** Play a short alert beep using Web Audio API (no file needed) */
function playBeep() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        // Second beep
        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            osc2.connect(g2);
            g2.connect(ctx.destination);
            osc2.type = "square";
            osc2.frequency.setValueAtTime(1100, ctx.currentTime);
            g2.gain.setValueAtTime(0.3, ctx.currentTime);
            g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.4);
        }, 450);
    } catch (e) {
        // Browser may block AudioContext without user gesture — silently ignore
    }
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [filterType, setFilterType] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [newAlertBanner, setNewAlertBanner] = useState<Alert | null>(null);
    const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const knownIdsRef = useRef<Set<string>>(new Set());
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const startListener = async () => {
            const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
            const { getDb } = await import("@/lib/firebase");
            const db = getDb();

            const q = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
            unsubscribe = onSnapshot(q, (snap) => {
                const fetched: Alert[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Alert));

                // Detect NEW unread alerts for beep + banner (skip on first load)
                if (!isFirstLoadRef.current) {
                    for (const alert of fetched) {
                        if (!alert.read && !knownIdsRef.current.has(alert.id)) {
                            // New alert arrived!
                            playBeep();
                            setNewAlertBanner(alert);
                            if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
                            bannerTimeoutRef.current = setTimeout(() => setNewAlertBanner(null), 10000);
                            break; // show banner for first new one
                        }
                    }
                }

                // Update known IDs
                fetched.forEach(a => knownIdsRef.current.add(a.id));
                isFirstLoadRef.current = false;

                setAlerts(fetched);
                setLoading(false);
            });
        };

        startListener().catch(console.error);
        return () => {
            unsubscribe?.();
            if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
        };
    }, []);

    const markRead = async (alertId: string) => {
        const { doc, updateDoc } = await import("firebase/firestore");
        const { getDb } = await import("@/lib/firebase");
        await updateDoc(doc(getDb(), "alerts", alertId), { read: true });
    };

    const filtered = filterType === "all" ? alerts : alerts.filter(a => a.type === filterType);
    const unreadCount = alerts.filter(a => !a.read).length;

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        const diff = Date.now() - ts;
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
            {/* ── New Alert Pulsing Banner ── */}
            {newAlertBanner && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-xl px-4">
                    <div className="bg-red-600 text-white rounded-2xl shadow-2xl px-5 py-4 flex items-start gap-4 animate-pulse border border-red-400">
                        <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">🚨 Early Leave Alert</p>
                            <p className="text-sm text-red-100 truncate">{newAlertBanner.employeeName} — {newAlertBanner.message}</p>
                            {newAlertBanner.latitude && newAlertBanner.longitude && (
                                <p className="text-xs text-red-200 mt-0.5">
                                    📍 {newAlertBanner.latitude.toFixed(5)}, {newAlertBanner.longitude.toFixed(5)}
                                </p>
                            )}
                        </div>
                        <button onClick={() => setNewAlertBanner(null)} className="p-1 rounded-full hover:bg-red-500 transition-colors flex-shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        Alerts &amp; Notifications
                        {unreadCount > 0 && (
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">{unreadCount} new</span>
                        )}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Real-time workforce anomaly detection</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-green-700">Live</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {["all", "EARLY_LEAVE", "GPS_OFF", "LEFT_WORK", "FIELD_INACTIVE", "LATE_ARRIVAL", "ATTENDANCE_INVALID"].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${filterType === type
                            ? type === "EARLY_LEAVE" || type === "all" && filterType === "all"
                                ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                                : "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        {type === "all"
                            ? `All (${alerts.length})`
                            : `${typeConfig[type as AlertType]?.label || type} (${alerts.filter(a => a.type === type).length})`
                        }
                    </button>
                ))}
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No alerts at this time</p>
                        <p className="text-xs text-slate-400 mt-1">Alerts appear in real-time when anomalies are detected</p>
                    </div>
                ) : (
                    filtered.map(alert => {
                        const config = typeConfig[alert.type] || typeConfig.GPS_OFF;
                        const Icon = config.icon;
                        const isEarlyLeave = alert.type === "EARLY_LEAVE";
                        const hasLocation = typeof alert.latitude === "number" && typeof alert.longitude === "number";

                        return (
                            <div
                                key={alert.id}
                                onClick={() => !alert.read && markRead(alert.id)}
                                className={`bg-white rounded-2xl border shadow-sm p-5 flex items-start gap-4 transition-all cursor-pointer hover:shadow-md ${alert.read
                                    ? "border-slate-100 opacity-70"
                                    : isEarlyLeave
                                        ? "border-l-4 border-l-red-500 border-t-slate-100 border-r-slate-100 border-b-slate-100 bg-red-50/30"
                                        : "border-l-4 border-l-amber-400 border-t-slate-100 border-r-slate-100 border-b-slate-100"
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0 ${!alert.read && isEarlyLeave ? "ring-2 ring-red-400 ring-offset-1" : ""}`}>
                                    <Icon className={`w-5 h-5 ${config.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${severityBadge[alert.severity]}`}>{alert.severity}</span>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${config.bg} ${config.color}`}>{config.label}</span>
                                        {alert.role && <span className="px-2 py-0.5 rounded-md text-[10px] font-medium uppercase bg-slate-100 text-slate-500">{alert.role}</span>}
                                        {!alert.read && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">{alert.employeeName}</p>
                                    <p className="text-sm text-slate-600 mt-0.5">{alert.message}</p>

                                    {/* Location row */}
                                    {hasLocation && (
                                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                                                <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                                <span className="text-xs text-slate-600 font-mono">
                                                    {(alert.latitude as number).toFixed(5)}, {(alert.longitude as number).toFixed(5)}
                                                </span>
                                            </div>
                                            <Link
                                                href={`/admin/live-map?focus=${alert.employeeId}`}
                                                onClick={e => e.stopPropagation()}
                                                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                View on Map
                                            </Link>
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&origin=26.3217462,73.0733824&destination=${alert.latitude},${alert.longitude}`}
                                                onClick={e => e.stopPropagation()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors ml-2"
                                            >
                                                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11.5 5 9 4-9 4-4 9-4-9 9-4Z" /><path d="m11.5 5-9 4 9 4 4 9 4-9-9-4Z" /></svg>
                                                Get Directions
                                            </a>
                                        </div>
                                    )}
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
