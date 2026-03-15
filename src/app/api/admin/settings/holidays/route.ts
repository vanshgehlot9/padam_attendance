import { NextResponse } from "next/server";
import { saveHolidays, getHolidays } from "@/lib/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { dates } = body;

        if (!Array.isArray(dates)) {
            return NextResponse.json({ error: "Dates must be an array" }, { status: 400 });
        }

        await saveHolidays(dates);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("Error saving holidays:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const holidays = await getHolidays();
        return NextResponse.json({ holidays });
    } catch (error: unknown) {
        console.error("Error fetching holidays:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
