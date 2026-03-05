import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const sections = await prisma.section.findMany({
            orderBy: [
                { department: 'asc' },
                { year: 'asc' },
                { name: 'asc' }
            ]
        });
        return NextResponse.json(sections);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validation (basic)
        if (!body.name || !body.department || !body.year || !body.semester) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newSection = await prisma.section.create({
            data: {
                name: body.name,
                department: body.department,
                year: parseInt(body.year),
                semester: parseInt(body.semester)
            }
        });

        return NextResponse.json(newSection);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
    }
}
