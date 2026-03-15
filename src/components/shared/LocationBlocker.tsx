"use client";

import { useLiveLocation, LocationState, AttendanceState } from "@/hooks/useLiveLocation";
import { MapPinOff, WifiOff } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";

// Context to share live location data + punch actions with all dashboard children
interface LiveContextType {
    location: LocationState;
    attendance: AttendanceState;
    punchIn: (shiftStart: string, graceMinutes: number) => Promise<"ok" | "error" | "offline">;
    punchOut: () => Promise<"ok" | "error" | "offline">;
    employeeRole: string;
}

const LiveContext = createContext<LiveContextType | null>(null);

const noop = async () => "ok" as const;

const DEFAULT_LIVE: LiveContextType = {
    location: {
        latitude: null, longitude: null, accuracy: null, timestamp: null,
        status: "IDLE", error: null, distanceFromOffice: null,
        isInsideRadius: false, lastHeartbeatAge: null,
    },
    attendance: { arrivalTime: null, departureTime: null, attendanceStatus: "ABSENT", shiftStart: null, shiftEnd: null },
    punchIn: noop,
    punchOut: noop,
    employeeRole: "office",
};

export function useLiveData() {
    const ctx = useContext(LiveContext);
    return ctx || DEFAULT_LIVE;
}

export function LocationBlocker({
    employeeId,
    employeeRole,
    children,
}: {
    employeeId: string;
    employeeRole?: string;
    children: React.ReactNode;
}) {
    const { location, attendance, punchIn, punchOut } = useLiveLocation(employeeId);
    const [isClient, setIsClient] = useState(false);
    const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const role = employeeRole || "office";

    useEffect(() => {
        setIsClient(true);

        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => {
            setIsOffline(false);
            // On reconnect, sync automatically (handled in offlineSync class)
            setTimeout(() => checkPending(), 2000);
        };

        const checkPending = async () => {
            try {
                const { offlineSync } = await import("@/lib/offlineSync");
                const count = await offlineSync.getPendingCount();
                setPendingSyncCount(count);
            } catch (e) { }
        };

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        // Poll pending count occasionally if offline
        const iv = setInterval(() => {
            if (!navigator.onLine) checkPending();
        }, 5000);
        checkPending();

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
            clearInterval(iv);
        };
    }, []);

    if (!isClient) return <>{children}</>;

    // Factory workers: no GPS gate — they punch in manually
    const isGpsDenied = location.status === "DENIED" || location.error === "PERMISSION_DENIED";
    if (isGpsDenied && role !== "factory") {
        return (
            <div className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                    <MapPinOff className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-4">
                    Location Required
                </h1>
                <p className="text-lg text-slate-400 max-w-sm">
                    Location required to continue work. GPS must be enabled for attendance verification.
                </p>
                <div className="mt-12 p-4 bg-slate-800 rounded-2xl w-full max-w-sm shadow-xl border border-slate-700">
                    <p className="text-sm text-slate-300 font-medium">Please open your phone settings, enable Location Services for your browser, and refresh the page.</p>
                </div>
            </div>
        );
    }

    return (
        <LiveContext.Provider value={{ location, attendance, punchIn, punchOut, employeeRole: role }}>
            {/* Offline Mode Banner */}
            {isOffline && (
                <div className="bg-amber-500 text-white px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-md relative z-50 animate-in slide-in-from-top">
                    <div className="flex items-center gap-2 min-w-0">
                        <WifiOff className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold truncate">Offline Mode.</span>
                    </div>
                    {pendingSyncCount > 0 && (
                        <div className="flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-full">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            <span className="text-[10px] sm:text-xs font-bold">{pendingSyncCount} pending items will sync when online</span>
                        </div>
                    )}
                </div>
            )}
            {children}
        </LiveContext.Provider>
    );
}
