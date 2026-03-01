import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE() {
    try {
        // Delete all timetable records
        await prisma.timetable.deleteMany({});

        return NextResponse.json({ success: true, message: "Timetable cleared successfully." });
    } catch (error) {
        console.error("Failed to clear timetable:", error);
        return NextResponse.json({ error: "Failed to clear timetable" }, { status: 500 });
    }
}
