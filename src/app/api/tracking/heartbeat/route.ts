import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { setHeartbeat, getAllHeartbeats, getEmployee, getOfficeLocation, addAlert, addLocationHistory } from "@/lib/firestore";
import { getDistanceInMeters } from "@/lib/geo";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { employee_id, latitude, longitude, accuracy, timestamp } = body;

        if (!employee_id || !latitude || !longitude) {
            return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
        }

        // Store heartbeat in Firebase Realtime Database
        await setHeartbeat(employee_id, {
            latitude,
            longitude,
            accuracy,
            timestamp,
            last_seen: Date.now(),
        });

        // Store in location history for Route Replay & Heatmap
        try {
            await addLocationHistory(employee_id, {
                lat: latitude,
                lng: longitude,
                accuracy: accuracy || 0,
                timestamp: timestamp || Date.now()
            });
        } catch (e) {
            console.error("Location history save failed:", e);
        }

        // Check if employee left office radius (for office/factory staff)
        try {
            const employee = await getEmployee(employee_id);
            if (employee && (employee.role === "office" || employee.role === "factory")) {
                const office = await getOfficeLocation();
                const distance = getDistanceInMeters(office.latitude, office.longitude, latitude, longitude);

                if (distance > office.radius) {
                    await addAlert({
                        type: "LEFT_WORK",
                        employeeId: employee_id,
                        employeeName: employee.name,
                        message: `${employee.name} left office radius (${Math.round(distance)}m from office, limit: ${office.radius}m)`,
                        severity: "critical",
                        timestamp: Date.now(),
                        read: false,
                    });
                }
            }
        } catch (e) {
            // Don't fail heartbeat if alert creation fails
            console.error("Alert check failed:", e);
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Heartbeat error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const heartbeats = await getAllHeartbeats();
        return NextResponse.json({ heartbeats });
    } catch (e: any) {
        console.error("Heartbeat fetch error:", e);
        return NextResponse.json({ heartbeats: {} });
    }
}
