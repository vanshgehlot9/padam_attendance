import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getLocationHistory } from "@/lib/firestore";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const url = new URL(req.url);
        const date = url.searchParams.get("date");
        const resolvedParams = await params;

        if (!date) {
            return NextResponse.json({ error: "Date parameter is required (YYYY-MM-DD)" }, { status: 400 });
        }

        const history = await getLocationHistory(resolvedParams.id, date);

        return NextResponse.json({ history });
    } catch (e: any) {
        console.error("Fetch history error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
