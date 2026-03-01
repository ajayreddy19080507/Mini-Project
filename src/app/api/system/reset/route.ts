import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(req: Request) {
    try {
        // Optional: you can add a permission check here using x-user-role if provided via headers
        console.log("Resetting entire database...");

        // Delete all data in reverse order of dependencies
        await prisma.timetable.deleteMany({});
        await prisma.section.deleteMany({});

        // Disconnect relations for faculty and subjects before deleting them
        const faculties = await prisma.faculty.findMany({ include: { subjects: true } });
        for (const f of faculties) {
            await prisma.faculty.update({
                where: { id: f.id },
                data: {
                    subjects: { set: [] }
                }
            });
        }

        await prisma.faculty.deleteMany({});
        await prisma.subject.deleteMany({});
        // Depending on if rooms are meant to be kept or not. We'll clear them too for a full reset.
        await prisma.room.deleteMany({});

        console.log("Database reset complete.");
        return NextResponse.json({ success: true, message: "Database cleared." });
    } catch (error: any) {
        console.error("API /system/reset Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
