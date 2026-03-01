import { NextResponse } from "next/server";
import { generateTimetable } from "@/lib/algorithm/scheduler";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
    try {
        console.log("API: Triggering timetable generation...");
        // Fast-fail if not enough data
        const sectionsCount = await prisma.section.count();
        if (sectionsCount === 0) {
            return NextResponse.json({ error: "No sections to schedule." }, { status: 400 });
        }

        const facultyCount = await prisma.faculty.count();
        if (facultyCount === 0) {
            return NextResponse.json({ error: "No faculty found." }, { status: 400 });
        }

        const result = await generateTimetable();

        if (result.success) {
            return NextResponse.json({ success: true, message: "Timetable generated!" });
        } else {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

    } catch (error: any) {
        console.error("API /generate Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
