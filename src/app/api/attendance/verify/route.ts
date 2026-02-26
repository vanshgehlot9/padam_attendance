import { NextResponse } from "next/server";
import { getDistanceInMeters } from "@/lib/geo";
import { markAttendance, getOfficeLocation, getEmployee, addAlert } from "@/lib/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { employee_id, latitude, longitude, type } = body;

        if (!employee_id || !latitude || !longitude) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get office location from Firestore
        const office = await getOfficeLocation();

        // Distance Server Calculation
        const distance = getDistanceInMeters(
            office.latitude,
            office.longitude,
            latitude,
            longitude
        );

        if (type === "office_entry") {
            const isInside = distance <= office.radius;

            if (isInside) {
                const now = new Date();
                const arrivalTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                const today = now.toISOString().split("T")[0];

                // Fetch employee to get their specific shift time
                const employee = await getEmployee(employee_id);
                let status: "ON_TIME" | "LATE" = "ON_TIME";

                if (employee) {
                    // Parse shift start time and grace
                    const [shiftH, shiftM] = employee.shiftStart.split(":").map(Number);
                    const grace = employee.graceMinutes || 0;
                    const shiftMinutes = shiftH * 60 + shiftM + grace;
                    const arrivalMinutes = now.getHours() * 60 + now.getMinutes();

                    if (arrivalMinutes > shiftMinutes) {
                        status = "LATE";
                        // Create alert for late arrival
                        await addAlert({
                            type: "LATE_ARRIVAL",
                            employeeId: employee_id,
                            employeeName: employee.name,
                            message: `${employee.name} arrived late at ${arrivalTime} (shift: ${employee.shiftStart}, grace: ${grace}min)`,
                            severity: "warning",
                            timestamp: Date.now(),
                            read: false,
                        });
                    }
                }

                // Save attendance to Firestore
                await markAttendance({
                    employeeId: employee_id,
                    date: today,
                    status,
                    arrivalTime,
                    departureTime: null,
                    latitude,
                    longitude,
                    distanceFromOffice: Math.round(distance),
                });

                return NextResponse.json({
                    success: true,
                    message: status === "LATE" ? "Attendance marked — LATE" : "Attendance marked successfully",
                    distance: Math.round(distance),
                    status: status === "LATE" ? "LATE" : "INSIDE_OFFICE",
                    arrivalTime,
                    shiftStart: employee?.shiftStart,
                });
            } else {
                return NextResponse.json({
                    success: false,
                    error: "Outside office radius",
                    distance: Math.round(distance),
                    required: office.radius,
                }, { status: 403 });
            }
        }

        return NextResponse.json({ error: "Invalid attendance type" }, { status: 400 });
    } catch (e: any) {
        console.error("Attendance verify error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
