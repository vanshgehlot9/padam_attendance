"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDistanceInMeters, OFFICE_COORDS, OFFICE_RADIUS_METERS } from "@/lib/geo";

const HEARTBEAT_INTERVAL = 60000; // 60 seconds
const GPS_TIMEOUT = 120000; // 2 minutes
const LEFT_WORK_THRESHOLD = 120000; // 2 minutes outside before marking LEFT_WORK

// ── helpers ──────────────────────────────────────────────────────────────────
function parseTimeToMins(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function nowTimeMins(): number {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
}

function currentTimeStr(): string {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

/** One-shot GPS — resolves with coords or null (never rejects) */
async function getOneShot(): Promise<{ lat: number; lng: number } | null> {
    return new Promise(resolve => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
        );
    });
}

export interface LocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    timestamp: number | null;
    status: "IDLE" | "TRACKING" | "DENIED" | "TIMEOUT";
    error: string | null;
    // Computed live values
    distanceFromOffice: number | null;
    isInsideRadius: boolean;
    lastHeartbeatAge: number | null;
}

export interface AttendanceState {
    arrivalTime: string | null;
    departureTime: string | null;
    attendanceStatus: "ABSENT" | "ON_TIME" | "LATE" | "LEFT_WORK" | "GPS_OFF" | "PUNCHED_OUT";
    shiftStart: string | null;
    shiftEnd: string | null;
}

export function useLiveLocation(employeeId: string) {
    const [location, setLocation] = useState<LocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        timestamp: null,
        status: "IDLE",
        error: null,
        distanceFromOffice: null,
        isInsideRadius: false,
        lastHeartbeatAge: null,
    });

    const [attendance, setAttendance] = useState<AttendanceState>({
        arrivalTime: null,
        departureTime: null,
        attendanceStatus: "ABSENT",
        shiftStart: null,
        shiftEnd: null,
    });

    const watchIdRef = useRef<number | null>(null);
    const lastHeartbeatTimeRef = useRef<number>(0);
    const lastPayloadRef = useRef<any>(null);
    const outsideStartRef = useRef<number | null>(null);
    const arrivalMarkedRef = useRef<boolean>(false);
    const earlyLeaveAlertFiredRef = useRef<boolean>(false);
    // Cache employee data fetched on mount for alert writing
    const employeeNameRef = useRef<string>("Unknown Employee");
    const employeeRoleRef = useRef<string>("factory");
    const shiftEndRef = useRef<string>("18:00"); // Will be updated after mount fetch

    // Send heartbeat + let backend handle attendance/alert logic
    const sendHeartbeat = useCallback(async (lat: number, lng: number, acc: number) => {
        const now = Date.now();
        if (now - lastHeartbeatTimeRef.current < HEARTBEAT_INTERVAL) return;

        try {
            const res = await fetch("/api/tracking/heartbeat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employee_id: employeeId,
                    latitude: lat,
                    longitude: lng,
                    accuracy: acc,
                    timestamp: now,
                }),
            });
            lastHeartbeatTimeRef.current = now;

            // Parse response for any backend state updates
            const data = await res.json();
            if (data.attendance) {
                setAttendance(prev => ({
                    ...prev,
                    arrivalTime: data.attendance.arrivalTime || prev.arrivalTime,
                    attendanceStatus: data.attendance.status || prev.attendanceStatus,
                    shiftStart: data.attendance.shiftStart || prev.shiftStart,
                }));
                if (data.attendance.arrivalTime) {
                    arrivalMarkedRef.current = true;
                }
            }
        } catch (err) {
            console.error("Heartbeat failed", err);
        }
    }, [employeeId]);

    // Auto-mark attendance when entering radius (Direct Firestore SDK for Offline Support)
    const tryMarkAttendance = useCallback(async (lat: number, lng: number) => {
        if (arrivalMarkedRef.current) return;

        try {
            const { doc, getDoc, setDoc } = await import("firebase/firestore");
            const { getDb } = await import("@/lib/firebase");
            const db = getDb();

            const today = new Date().toISOString().split("T")[0];
            const attDocId = `${employeeId}_${today}`;

            // Check employee shift info first
            const empSnap = await getDoc(doc(db, "employees", employeeId));
            let shiftStart = "09:00";
            let graceMinutes = 15;

            if (empSnap.exists()) {
                const emp = empSnap.data();
                shiftStart = emp.shiftStart || shiftStart;
                graceMinutes = emp.graceMinutes || graceMinutes;
            }

            // Determine if late
            const now = new Date();
            const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

            const parseTime = (timeStr: string) => {
                const [h, m] = timeStr.split(":").map(Number);
                return h * 60 + m;
            };

            const arrivalMins = parseTime(currentTimeStr);
            const shiftMins = parseTime(shiftStart);
            const isLate = arrivalMins > (shiftMins + graceMinutes);

            const attendanceStatus = isLate ? "LATE" : "ON_TIME";

            // Write Attendance Record directly to Firestore (Offline supported)
            await setDoc(doc(db, "attendance", attDocId), {
                employeeId,
                date: today,
                status: attendanceStatus,
                arrivalTime: currentTimeStr,
                departureTime: null,
                latitude: lat,
                longitude: lng,
                distanceFromOffice: Math.round(getDistanceInMeters(OFFICE_COORDS.latitude, OFFICE_COORDS.longitude, lat, lng))
            }, { merge: true });

            arrivalMarkedRef.current = true;
            setAttendance(prev => ({
                ...prev,
                arrivalTime: currentTimeStr,
                attendanceStatus: attendanceStatus,
                shiftStart: shiftStart,
            }));

        } catch (err) {
            console.error("Auto-attendance (offline write) failed:", err);
        }
    }, [employeeId]);

    // GPS Watch
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocation(prev => ({ ...prev, status: "DENIED", error: "UNSUPPORTED" }));
            return;
        }

        const handleSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude, accuracy } = position.coords;
            const updatedTime = position.timestamp;

            // Calculate distance from office
            const distance = getDistanceInMeters(
                OFFICE_COORDS.latitude, OFFICE_COORDS.longitude,
                latitude, longitude
            );
            const inside = distance <= OFFICE_RADIUS_METERS;

            setLocation({
                latitude,
                longitude,
                accuracy,
                timestamp: updatedTime,
                status: "TRACKING",
                error: null,
                distanceFromOffice: Math.round(distance),
                isInsideRadius: inside,
                lastHeartbeatAge: null,
            });

            lastPayloadRef.current = { latitude, longitude, accuracy, timestamp: updatedTime };

            // Send heartbeat
            sendHeartbeat(latitude, longitude, accuracy);

            // Auto-mark attendance if inside radius and not yet marked
            if (inside && !arrivalMarkedRef.current) {
                tryMarkAttendance(latitude, longitude);
            }

            // Track outside duration for LEFT_WORK
            if (!inside) {
                if (outsideStartRef.current === null) {
                    outsideStartRef.current = Date.now();
                }
            } else {
                outsideStartRef.current = null; // Reset when back inside
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            if (error.code === error.PERMISSION_DENIED) {
                setLocation(prev => ({ ...prev, status: "DENIED", error: "PERMISSION_DENIED" }));
            }
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
        // Visibility Change Listener: Force an immediate update when returning to tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                // Instantly request a single fresh position to fire a heartbeat
                navigator.geolocation.getCurrentPosition(
                    handleSuccess,
                    handleError,
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [sendHeartbeat, tryMarkAttendance]);

    // GPS timeout check + heartbeat age + left-work detection
    useEffect(() => {
        const checkInterval = setInterval(() => {
            // GPS timeout
            if (lastPayloadRef.current?.timestamp) {
                const age = Date.now() - lastPayloadRef.current.timestamp;
                if (age > GPS_TIMEOUT) {
                    setLocation(prev => ({
                        ...prev,
                        status: "TIMEOUT",
                        error: "GPS Signal Lost",
                    }));
                }
            }

            // Update heartbeat age for tracking indicator
            if (lastHeartbeatTimeRef.current > 0) {
                setLocation(prev => ({
                    ...prev,
                    lastHeartbeatAge: Date.now() - lastHeartbeatTimeRef.current,
                }));
            }

            // LEFT_WORK detection: outside for > 2 minutes
            if (outsideStartRef.current && arrivalMarkedRef.current) {
                const outsideDuration = Date.now() - outsideStartRef.current;
                if (outsideDuration > LEFT_WORK_THRESHOLD) {
                    setAttendance(prev => ({ ...prev, attendanceStatus: "LEFT_WORK" }));

                    // Fire EARLY_LEAVE alert if before shift end and not already fired
                    if (!earlyLeaveAlertFiredRef.current && nowTimeMins() < parseTimeToMins(shiftEndRef.current)) {
                        earlyLeaveAlertFiredRef.current = true;
                        const coords = lastPayloadRef.current as { latitude: number; longitude: number } | null;
                        import("firebase/firestore").then(({ addDoc, collection }) => {
                            import("@/lib/firebase").then(({ getDb }) => {
                                addDoc(collection(getDb(), "alerts"), {
                                    type: "EARLY_LEAVE",
                                    employeeId,
                                    employeeName: employeeNameRef.current,
                                    message: `Left work early — GPS detected absence before ${shiftEndRef.current}`,
                                    severity: "critical",
                                    timestamp: Date.now(),
                                    read: false,
                                    latitude: coords?.latitude ?? null,
                                    longitude: coords?.longitude ?? null,
                                    role: employeeRoleRef.current,
                                }).catch(console.error);
                            });
                        });
                    }
                }
            }
        }, 10000); // Check every 10s

        return () => clearInterval(checkInterval);
    }, [employeeId]);

    // Fetch existing attendance + employee info on mount
    useEffect(() => {
        const fetchExisting = async () => {
            try {
                const { doc, getDoc } = await import("firebase/firestore");
                const { getDb } = await import("@/lib/firebase");
                const db = getDb();

                const today = new Date().toISOString().split("T")[0];

                // Direct Firestore read: attendance doc
                const attDocId = `${employeeId}_${today}`;
                const attSnap = await getDoc(doc(db, "attendance", attDocId));
                if (attSnap.exists()) {
                    const record = attSnap.data();
                    arrivalMarkedRef.current = true;
                    setAttendance(prev => ({
                        ...prev,
                        arrivalTime: record.arrivalTime || null,
                        departureTime: record.departureTime || null,
                        attendanceStatus: record.status || "ON_TIME",
                    }));
                }

                // Direct Firestore read: employee doc
                const empSnap = await getDoc(doc(db, "employees", employeeId));
                if (empSnap.exists()) {
                    const emp = empSnap.data();
                    employeeNameRef.current = emp.name || "Unknown Employee";
                    employeeRoleRef.current = emp.role || "factory";
                    shiftEndRef.current = emp.shiftEnd || "18:00";
                    setAttendance(prev => ({
                        ...prev,
                        shiftStart: emp.shiftStart || null,
                        shiftEnd: emp.shiftEnd || null,
                    }));
                }
            } catch (e) {
                console.error("Failed to fetch existing attendance:", e);
                // Fallback: try through admin API
                try {
                    const res = await fetch("/api/admin/employees");
                    if (res.ok) {
                        const data = await res.json();
                        const today = new Date().toISOString().split("T")[0];
                        if (data.attendance) {
                            const record = data.attendance.find((a: any) =>
                                a.employeeId === employeeId && a.date === today
                            );
                            if (record) {
                                arrivalMarkedRef.current = true;
                                setAttendance(prev => ({
                                    ...prev,
                                    arrivalTime: record.arrivalTime,
                                    departureTime: record.departureTime || null,
                                    attendanceStatus: record.status,
                                }));
                            }
                        }
                        if (data.employees) {
                            const emp = data.employees.find((e: any) => e.id === employeeId);
                            if (emp) {
                                employeeNameRef.current = emp.name || "Unknown Employee";
                                employeeRoleRef.current = emp.role || "factory";
                                shiftEndRef.current = emp.shiftEnd || "18:00";
                                setAttendance(prev => ({
                                    ...prev,
                                    shiftStart: emp.shiftStart,
                                    shiftEnd: emp.shiftEnd || null,
                                }));
                            }
                        }
                    }
                } catch (e2) {
                    console.error("API fallback also failed:", e2);
                }
            }
        };
        if (employeeId && employeeId !== "unknown") {
            fetchExisting();
        }
    }, [employeeId]);

    // ── Manual Punch In (factory workers) ────────────────────────────────────
    const punchIn = useCallback(async (shiftStart: string, graceMinutes: number): Promise<"ok" | "error" | "offline"> => {
        if (arrivalMarkedRef.current) return "ok"; // already punched in
        try {
            const timeNow = currentTimeStr();
            const isLate = nowTimeMins() > parseTimeToMins(shiftStart) + graceMinutes;
            const status = isLate ? "LATE" : "ON_TIME";
            const today = new Date().toISOString().split("T")[0];
            const attDocId = `${employeeId}_${today}`;

            // Generate dummy coords if offline and can't get GPS
            let coords = null;
            try { coords = await getOneShot(); } catch (e) { }

            const payloadData = {
                employeeId,
                date: today,
                status,
                arrivalTime: timeNow,
                departureTime: null,
                latitude: coords?.lat ?? null,
                longitude: coords?.lng ?? null,
                distanceFromOffice: null,
            };

            // Offline Check
            if (typeof navigator !== "undefined" && !navigator.onLine) {
                const { offlineSync } = await import("@/lib/offlineSync");
                await offlineSync.addToQueue("punchIn", { date: today, data: payloadData }, employeeId);
                arrivalMarkedRef.current = true;
                setAttendance(prev => ({
                    ...prev,
                    arrivalTime: timeNow,
                    attendanceStatus: status,
                }));
                return "offline";
            }

            const { doc, setDoc } = await import("firebase/firestore");
            const { getDb } = await import("@/lib/firebase");
            const db = getDb();

            await setDoc(doc(db, "attendance", attDocId), payloadData, { merge: true });

            arrivalMarkedRef.current = true;
            setAttendance(prev => ({
                ...prev,
                arrivalTime: timeNow,
                attendanceStatus: status,
            }));
            return "ok";
        } catch (err) {
            console.error("punchIn failed:", err);
            return "error";
        }
    }, [employeeId]);

    // ── Manual Punch Out (factory workers) ───────────────────────────────────
    const punchOut = useCallback(async (): Promise<"ok" | "error" | "offline"> => {
        try {
            const timeNow = currentTimeStr();
            const today = new Date().toISOString().split("T")[0];
            const attDocId = `${employeeId}_${today}`;

            let coords = null;
            try { coords = await getOneShot(); } catch (e) { }

            const isEarly = nowTimeMins() < parseTimeToMins(shiftEndRef.current);
            let alertData: any = null;

            if (isEarly && !earlyLeaveAlertFiredRef.current) {
                earlyLeaveAlertFiredRef.current = true;
                alertData = {
                    type: "EARLY_LEAVE",
                    employeeId,
                    employeeName: employeeNameRef.current,
                    message: `Punched out early at ${timeNow} — shift ends at ${shiftEndRef.current}`,
                    severity: "critical",
                    timestamp: Date.now(),
                    read: false,
                    latitude: coords?.lat ?? null,
                    longitude: coords?.lng ?? null,
                    role: employeeRoleRef.current,
                };
            }

            const payloadData = {
                departureTime: timeNow,
                status: "PUNCHED_OUT",
            };

            // Offline Queue check
            if (typeof navigator !== "undefined" && !navigator.onLine) {
                const { offlineSync } = await import("@/lib/offlineSync");
                await offlineSync.addToQueue("punchOut", { date: today, data: payloadData, alertData }, employeeId);
                setAttendance(prev => ({
                    ...prev,
                    departureTime: timeNow,
                    attendanceStatus: "PUNCHED_OUT",
                }));
                return "offline";
            }

            const { doc, updateDoc, addDoc, collection } = await import("firebase/firestore");
            const { getDb } = await import("@/lib/firebase");
            const db = getDb();

            // Update attendance record
            await updateDoc(doc(db, "attendance", attDocId), payloadData);

            if (alertData) {
                await addDoc(collection(db, "alerts"), alertData);
            }

            setAttendance(prev => ({
                ...prev,
                departureTime: timeNow,
                attendanceStatus: "PUNCHED_OUT",
            }));
            return "ok";
        } catch (err) {
            console.error("punchOut failed:", err);
            return "error";
        }
    }, [employeeId]);

    return { location, attendance, punchIn, punchOut };
}
