import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const sections = await prisma.section.findMany({
            include: {
                timetables: {
                    include: {
                        subject: true,
                        faculty: true,
                        room: true
                    }
                }
            }
        });
        return NextResponse.json(sections);
    } catch (e) {
        console.error("Failed to fetch all timetables:", e);
        return NextResponse.json({ error: "Failed to fetch timetables" }, { status: 500 });
    }
}
