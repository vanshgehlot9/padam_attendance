import { NextResponse } from "next/server";
import { getActiveEmployees, getHolidays } from "@/lib/firestore";
import { collection, query, getDocs, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const monthQuery = searchParams.get("month"); // YYYY-MM

        if (!monthQuery || !/^\d{4}-\d{2}$/.test(monthQuery)) {
            return NextResponse.json({ error: "Invalid or missing month parameter (format: YYYY-MM)" }, { status: 400 });
        }

        const employees = await getActiveEmployees();
        const holidays = await getHolidays();

        // Let's get all attendance for this month
        // We'll query where date >= 'YYYY-MM-01' and date <= 'YYYY-MM-31'
        const startDate = `${monthQuery}-01`;
        const endDate = `${monthQuery}-31`;

        const q = query(
            collection(getDb(), "attendance"),
            where("date", ">=", startDate),
            where("date", "<=", endDate)
        );

        const snap = await getDocs(q);
        const attendanceRecords = snap.docs.map(d => d.data());

        // Group attendance by employee
        // Format: { [employeeId]: { [date]: { status, arrivalTime } } }
        const attendanceByEmployee: Record<string, Record<string, any>> = {};

        employees.forEach(emp => {
            attendanceByEmployee[emp.id] = {};
        });

        attendanceRecords.forEach(record => {
            if (attendanceByEmployee[record.employeeId]) {
                attendanceByEmployee[record.employeeId][record.date] = record;
            }
        });

        return NextResponse.json({
            employees,
            attendanceByEmployee,
            month: monthQuery,
            holidays
        });

    } catch (error: unknown) {
        console.error("Error fetching monthly attendance:", error);
        const desc = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: desc }, { status: 500 });
    }
}
