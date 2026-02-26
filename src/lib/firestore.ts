import {
    collection, doc, getDocs, getDoc, addDoc, updateDoc, setDoc,
    query, where, orderBy, Timestamp, serverTimestamp
} from "firebase/firestore";
import { ref, set, get, child } from "firebase/database";
import { db, rtdb } from "./firebase";

// ==================== TYPES ====================

export type EmployeeRole = "office" | "field" | "factory";
export type AttendanceStatus = "ON_TIME" | "LATE" | "ABSENT" | "GPS_OFF" | "LEFT_WORK" | "WORKING";

export interface Employee {
    id: string;
    name: string;
    phone: string;
    role: EmployeeRole;
    shiftStart: string;
    shiftEnd: string;
    graceMinutes: number;
    active: boolean;
    avatarInitials: string;
    createdAt: number;
}

export interface AttendanceRecord {
    employeeId: string;
    date: string;
    status: AttendanceStatus;
    arrivalTime: string | null;
    departureTime: string | null;
    latitude: number | null;
    longitude: number | null;
    distanceFromOffice: number | null;
}

export interface DealSubmission {
    id: string;
    employeeId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
    photoUrl: string;
    notes: string;
}

export interface OfficeLocation {
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
}

export interface HeartbeatRecord {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
    last_seen: number;
}

// ==================== EMPLOYEES ====================

const employeesCol = collection(db, "employees");

export async function getAllEmployees(): Promise<Employee[]> {
    const snap = await getDocs(employeesCol);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));
}

export async function getActiveEmployees(): Promise<Employee[]> {
    const q = query(employeesCol, where("active", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));
}

export async function getEmployee(id: string): Promise<Employee | null> {
    const snap = await getDoc(doc(db, "employees", id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Employee;
}

export async function addEmployee(data: Omit<Employee, "id" | "createdAt">): Promise<Employee> {
    const docRef = await addDoc(employeesCol, {
        ...data,
        createdAt: Date.now(),
    });
    return { id: docRef.id, ...data, createdAt: Date.now() };
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    const docRef = doc(db, "employees", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    await updateDoc(docRef, updates);
    return { id, ...snap.data(), ...updates } as Employee;
}

// ==================== ATTENDANCE ====================

const attendanceCol = collection(db, "attendance");

export async function getAttendance(date?: string): Promise<AttendanceRecord[]> {
    const d = date || new Date().toISOString().split("T")[0];
    const q = query(attendanceCol, where("date", "==", d));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as AttendanceRecord);
}

export async function getAttendanceForEmployee(employeeId: string): Promise<AttendanceRecord[]> {
    const q = query(attendanceCol, where("employeeId", "==", employeeId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as AttendanceRecord);
}

export async function markAttendance(record: AttendanceRecord): Promise<void> {
    // Use composite key: employeeId_date
    const docId = `${record.employeeId}_${record.date}`;
    await setDoc(doc(db, "attendance", docId), record, { merge: true });
}

// ==================== DEALS ====================

const dealsCol = collection(db, "deals");

export async function getDeals(): Promise<DealSubmission[]> {
    const snap = await getDocs(dealsCol);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as DealSubmission));
}

export async function getDealsForEmployee(employeeId: string): Promise<DealSubmission[]> {
    const q = query(dealsCol, where("employeeId", "==", employeeId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as DealSubmission));
}

export async function addDeal(data: Omit<DealSubmission, "id">): Promise<DealSubmission> {
    const docRef = await addDoc(dealsCol, data);
    return { id: docRef.id, ...data };
}

// ==================== HEARTBEATS (Realtime DB) ====================

export async function setHeartbeat(employeeId: string, data: HeartbeatRecord): Promise<void> {
    const heartbeatRef = ref(rtdb, `heartbeats/${employeeId}`);
    await set(heartbeatRef, data);
}

export async function getAllHeartbeats(): Promise<Record<string, HeartbeatRecord>> {
    const snapshot = await get(child(ref(rtdb), "heartbeats"));
    if (snapshot.exists()) {
        return snapshot.val() as Record<string, HeartbeatRecord>;
    }
    return {};
}

// ==================== SETTINGS ====================

export async function getOfficeLocation(): Promise<OfficeLocation> {
    const snap = await getDoc(doc(db, "settings", "office"));
    if (snap.exists()) {
        return snap.data() as OfficeLocation;
    }
    // Default fallback
    return {
        latitude: 26.3217462,
        longitude: 73.0733824,
        radius: 100,
        name: "Main Office — Jodhpur",
    };
}

export async function saveOfficeLocation(location: OfficeLocation): Promise<void> {
    await setDoc(doc(db, "settings", "office"), location);
}

// ==================== DASHBOARD STATS ====================

export async function getDashboardStats() {
    const employees = await getActiveEmployees();
    const attendance = await getAttendance();

    return {
        totalStaff: employees.length,
        present: attendance.filter(a => ["ON_TIME", "WORKING"].includes(a.status)).length,
        late: attendance.filter(a => a.status === "LATE").length,
        absent: employees.length - attendance.length,
        gpsOff: attendance.filter(a => a.status === "GPS_OFF").length,
        leftWork: attendance.filter(a => a.status === "LEFT_WORK").length,
    };
}

// ==================== ALERTS ====================

export type AlertType = "GPS_OFF" | "LEFT_WORK" | "FIELD_INACTIVE" | "ATTENDANCE_INVALID" | "LATE_ARRIVAL";
export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
    id?: string;
    type: AlertType;
    employeeId: string;
    employeeName: string;
    message: string;
    severity: AlertSeverity;
    timestamp: number;
    read: boolean;
}

const alertsCol = collection(db, "alerts");

export async function addAlert(data: Omit<Alert, "id">): Promise<Alert> {
    const docRef = await addDoc(alertsCol, data);
    return { id: docRef.id, ...data };
}

export async function getAlerts(limit?: number): Promise<Alert[]> {
    const q = query(alertsCol, orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Alert));
    return limit ? alerts.slice(0, limit) : alerts;
}

export async function markAlertRead(alertId: string): Promise<void> {
    await updateDoc(doc(db, "alerts", alertId), { read: true });
}

// ==================== LOCATION HISTORY (FOR REPLAY & HEATMAP) ====================

export interface LocationHistoryContent {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
}

export async function addLocationHistory(employeeId: string, data: LocationHistoryContent): Promise<void> {
    const today = new Date(data.timestamp).toISOString().split("T")[0];
    const historyCol = collection(db, "employees", employeeId, "location_history");
    const docRef = doc(historyCol, today);

    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const existingData = snap.data();
        const locations = existingData.locations || [];
        // Only keep last 24h of points, max 1440 points (1/min)
        locations.push(data);
        if (locations.length > 2000) locations.shift();
        await updateDoc(docRef, { locations });
    } else {
        await setDoc(docRef, { employeeId, date: today, locations: [data] });
    }
}

export async function getLocationHistory(employeeId: string, date: string): Promise<LocationHistoryContent[]> {
    const docRef = doc(db, "employees", employeeId, "location_history", date);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return snap.data().locations || [];
    }
    return [];
}
