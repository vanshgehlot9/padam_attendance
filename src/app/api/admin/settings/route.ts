import { NextResponse } from "next/server";
import { saveOfficeLocation, getOfficeLocation } from "@/lib/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { latitude, longitude, radius, name } = body;

        if (!latitude || !longitude || !radius || !name) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        await saveOfficeLocation({ latitude, longitude, radius, name });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error saving settings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const location = await getOfficeLocation();
        return NextResponse.json({ officeLocation: location });
    } catch (error: any) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
