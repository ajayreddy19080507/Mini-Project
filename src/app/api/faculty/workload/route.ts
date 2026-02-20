import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
    try {
        // Fetch all faculty with their subjects and timetables
        const faculty = await prisma.faculty.findMany({
            include: {
                subjects: true,
                timetables: {
                    include: {
                        section: true,
                        subject: true,
                        room: true
                    }
                }
            }
        });

        console.log(`[Workload] Found ${faculty.length} faculty`);

        // Calculate Workload Stats
        const workload = faculty.map(f => {
            const totalHours = f.timetables.length; // Assuming each slot = 1 hour (Labs occupy 3 slots, so they count as 3 hours)

            // Group timetable by day for easier frontend display
            const scheduleByDay: Record<string, any[]> = {};
            ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day => {
                scheduleByDay[day] = f.timetables
                    .filter(t => t.day === day)
                    .sort((a, b) => a.slot - b.slot);
            });

            return {
                id: f.id,
                name: f.name,
                designation: f.designation,
                department: f.department,
                maxLoad: f.maxLoad,
                currentLoad: totalHours,
                remainingLoad: f.maxLoad - totalHours,
                schedule: scheduleByDay
            };
        });

        return NextResponse.json(workload);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
