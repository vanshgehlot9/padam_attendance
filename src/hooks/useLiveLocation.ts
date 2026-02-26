"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDistanceInMeters, OFFICE_COORDS, OFFICE_RADIUS_METERS } from "@/lib/geo";

const HEARTBEAT_INTERVAL = 60000; // 60 seconds
const GPS_TIMEOUT = 120000; // 2 minutes
const LEFT_WORK_THRESHOLD = 120000; // 2 minutes outside before marking LEFT_WORK

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
    attendanceStatus: "ABSENT" | "ON_TIME" | "LATE" | "LEFT_WORK" | "GPS_OFF";
    shiftStart: string | null;
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
        attendanceStatus: "ABSENT",
        shiftStart: null,
    });

    const watchIdRef = useRef<number | null>(null);
    const lastHeartbeatTimeRef = useRef<number>(0);
    const lastPayloadRef = useRef<any>(null);
    const outsideStartRef = useRef<number | null>(null); // When employee first went outside
    const arrivalMarkedRef = useRef<boolean>(false); // Prevent duplicate arrival calls

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

    // Auto-mark attendance when entering radius
    const tryMarkAttendance = useCallback(async (lat: number, lng: number) => {
        if (arrivalMarkedRef.current) return;

        try {
            const res = await fetch("/api/attendance/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employee_id: employeeId,
                    latitude: lat,
                    longitude: lng,
                    type: "office_entry",
                }),
            });
            const data = await res.json();
            if (data.success) {
                arrivalMarkedRef.current = true;
                setAttendance(prev => ({
                    ...prev,
                    arrivalTime: data.arrivalTime,
                    attendanceStatus: data.status === "LATE" ? "LATE" : "ON_TIME",
                    shiftStart: data.shiftStart || prev.shiftStart,
                }));
            }
        } catch (err) {
            console.error("Auto-attendance failed:", err);
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

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
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
                }
            }
        }, 10000); // Check every 10s

        return () => clearInterval(checkInterval);
    }, []);

    // Fetch existing attendance on mount — direct Firestore reads (more reliable)
    useEffect(() => {
        const fetchExisting = async () => {
            try {
                const { doc, getDoc } = await import("firebase/firestore");
                const { getDb } = await import("@/lib/firebase");
                const db = getDb();

                const today = new Date().toISOString().split("T")[0];

                // Direct Firestore read: attendance doc uses key "{employeeId}_{date}"
                const attDocId = `${employeeId}_${today}`;
                const attSnap = await getDoc(doc(db, "attendance", attDocId));
                if (attSnap.exists()) {
                    const record = attSnap.data();
                    arrivalMarkedRef.current = true;
                    setAttendance(prev => ({
                        ...prev,
                        arrivalTime: record.arrivalTime || null,
                        attendanceStatus: record.status || "ON_TIME",
                    }));
                }

                // Direct Firestore read: employee doc for shift info
                const empSnap = await getDoc(doc(db, "employees", employeeId));
                if (empSnap.exists()) {
                    const emp = empSnap.data();
                    setAttendance(prev => ({
                        ...prev,
                        shiftStart: emp.shiftStart || null,
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
                                    attendanceStatus: record.status,
                                }));
                            }
                        }
                        if (data.employees) {
                            const emp = data.employees.find((e: any) => e.id === employeeId);
                            if (emp) {
                                setAttendance(prev => ({
                                    ...prev,
                                    shiftStart: emp.shiftStart,
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

    return { location, attendance };
}
