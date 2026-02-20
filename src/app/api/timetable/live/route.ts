import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper to determine current period based on time
function getCurrentPeriod(date: Date): number | null {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Schedule (Adjust as needed)
    // 1: 09:00 - 09:55 (540 - 595)
    // 2: 09:55 - 10:50 (595 - 650)
    // 3: 11:00 - 11:55 (660 - 715)
    // 4: 11:55 - 12:50 (715 - 770)
    // Lunch: 12:50 - 13:40
    // 5: 13:40 - 14:35 (820 - 875)
    // 6: 14:35 - 15:30 (875 - 930)
    // 7: 15:30 - 16:25 (930 - 985)

    if (totalMinutes >= 540 && totalMinutes < 595) return 1;
    if (totalMinutes >= 595 && totalMinutes < 650) return 2;
    if (totalMinutes >= 660 && totalMinutes < 715) return 3;
    if (totalMinutes >= 715 && totalMinutes < 770) return 4;
    // Lunch gap
    if (totalMinutes >= 820 && totalMinutes < 875) return 5;
    if (totalMinutes >= 875 && totalMinutes < 930) return 6;
    if (totalMinutes >= 930 && totalMinutes < 985) return 7;

    return null;
}

export async function GET(request: Request) {
    try {
        const now = new Date();
        // Adjust for timezone if server is UTC but college is IST (UTC+5:30)
        // For simplicity, assuming local server time or handling offset
        // const offset = 5.5 * 60 * 60 * 1000;
        // const localTime = new Date(now.getTime() + offset); 

        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const currentDay = days[now.getDay()];
        const currentSlot = getCurrentPeriod(now);

        if (!currentSlot || currentDay === 'SUN') {
            return NextResponse.json({
                active: false,
                message: "No classes running currently.",
                day: currentDay,
                time: now.toLocaleTimeString()
            });
        }

        const liveClasses = await prisma.timetable.findMany({
            where: {
                day: currentDay,
                slot: currentSlot
            },
            include: {
                section: true,
                subject: true,
                faculty: true,
                room: true
            }
        });

        return NextResponse.json({
            active: true,
            day: currentDay,
            slot: currentSlot,
            classes: liveClasses
        });

    } catch (e) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
