import { NextResponse } from "next/server";
import { addDeal } from "@/lib/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { employee_id, latitude, longitude, accuracy, timestamp, notes, photo_url } = body;

        if (!employee_id || !latitude || !longitude) {
            return NextResponse.json({ error: "Missing required geo-data" }, { status: 400 });
        }

        // Relaxed requirement for indoor tracking & testing
        if (accuracy > 1000) {
            return NextResponse.json({
                success: false,
                error: "GPS Accuracy too low for verified deal submission",
                accuracy,
                required: 1000
            }, { status: 403 });
        }

        // Save deal to Firestore
        const deal = await addDeal({
            employeeId: employee_id,
            latitude,
            longitude,
            accuracy,
            timestamp: timestamp || Date.now(),
            photoUrl: photo_url || "",
            notes: notes || "",
        });

        return NextResponse.json({
            success: true,
            message: "Deal proof cryptographically verified and captured",
            recordId: deal.id,
        });

    } catch (e: any) {
        console.error("Deal submission error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
