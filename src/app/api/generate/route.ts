import { NextResponse } from "next/server";
import { generateTimetable } from "@/lib/algorithm/scheduler"; // Path needs to be verified

export async function POST() {
    try {
        const result = await generateTimetable();

        if (result.success) {
            return NextResponse.json({ message: "Timetable generated successfully" });
        } else {
            return NextResponse.json({ error: result.error || "Generation failed" }, { status: 500 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
