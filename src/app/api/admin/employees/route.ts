import { NextResponse } from "next/server";
import {
    getAllEmployees, getAttendance, getDashboardStats,
    getDeals, addEmployee, updateEmployee, getOfficeLocation,
    getAllHeartbeats, getAlerts
} from "@/lib/firestore";
import { adminAuth } from "@/lib/firebase-admin";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET() {
    try {
        const [employees, stats, attendance, heartbeats, officeLocation, deals, alerts] = await Promise.all([
            getAllEmployees(),
            getDashboardStats(),
            getAttendance(),
            getAllHeartbeats(),
            getOfficeLocation(),
            getDeals(),
            getAlerts(),
        ]);

        return NextResponse.json({
            employees,
            stats,
            attendance,
            heartbeats,
            officeLocation,
            deals,
            alerts,
        });
    } catch (error: any) {
        console.error("Error fetching admin data:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, phone, role, shiftStart, shiftEnd, graceMinutes, active, avatarInitials, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
        }

        // 1. Create Firebase Auth user
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
        });

        // 2. Save employee doc in Firestore using Auth UID as doc ID
        const employeeData = {
            name,
            phone: phone || "",
            role: role || "office",
            shiftStart: shiftStart || "09:00",
            shiftEnd: shiftEnd || "18:00",
            graceMinutes: graceMinutes || 15,
            active: active !== false,
            avatarInitials: avatarInitials || name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
            email,
            createdAt: Date.now(),
        };

        await setDoc(doc(db, "employees", userRecord.uid), employeeData);

        return NextResponse.json({
            employee: { id: userRecord.uid, ...employeeData },
            credentials: {
                uid: userRecord.uid,
                email,
                password, // Return to admin so they can share with employee
            },
        });
    } catch (error: any) {
        console.error("Error creating employee:", error);
        // Handle Firebase Auth specific errors
        if (error.code === "auth/email-already-exists") {
            return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
        }
        if (error.code === "auth/weak-password") {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        // Update Firestore employee doc
        const emp = await updateEmployee(id, updates);
        if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // If disabling account, also disable in Firebase Auth
        if (updates.active === false) {
            try {
                await adminAuth.updateUser(id, { disabled: true });
            } catch (e) {
                console.error("Failed to disable auth account:", e);
            }
        } else if (updates.active === true) {
            try {
                await adminAuth.updateUser(id, { disabled: false });
            } catch (e) {
                console.error("Failed to enable auth account:", e);
            }
        }

        return NextResponse.json({ employee: emp });
    } catch (error: any) {
        console.error("Error updating employee:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
