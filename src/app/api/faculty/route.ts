import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper to check permissions
async function checkPermission(request: Request) {
    const email = request.headers.get("x-user-email");
    if (!email) return null;

    const user = await prisma.user.findUnique({
        where: { email },
    });
    return user;
}

export async function GET(request: Request) {
    const user = await checkPermission(request);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        let whereClause = {};
        if (user.role === "HOD" && user.department) {
            whereClause = { department: user.department };
        }

        const faculty = await prisma.faculty.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            include: { subjects: true }
        });

        return NextResponse.json(faculty);
    } catch (error) {
        console.error("GET Faculty Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await checkPermission(request);
    if (!user || (user.role !== "PRINCIPAL" && user.role !== "HOD")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await request.json();

        let dept = body.department;
        if (user.role === "HOD") {
            dept = user.department;
        }

        // Process subject codes
        const subjectCodes: string[] = body.subjectCodes
            ? body.subjectCodes.split(',').map((c: string) => c.trim()).filter(Boolean)
            : [];

        const newFaculty = await prisma.faculty.create({
            data: {
                name: body.name,
                designation: body.designation,
                maxLoad: parseInt(body.maxLoad),
                department: dept,
                subjects: {
                    connect: subjectCodes.map(code => ({ code }))
                }
            },
            include: { subjects: true }
        });
        return NextResponse.json(newFaculty);
    } catch (e) {
        console.error("POST Faculty Error:", e);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const user = await checkPermission(request);
    if (!user || (user.role !== "PRINCIPAL" && user.role !== "HOD")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await request.json();

        let dept = body.department;
        if (user.role === "HOD") {
            dept = user.department;
        }

        // Process subject codes
        const subjectCodes: string[] = body.subjectCodes
            ? body.subjectCodes.split(',').map((c: string) => c.trim()).filter(Boolean)
            : [];

        const updated = await prisma.faculty.update({
            where: { id: body.id },
            data: {
                name: body.name,
                designation: body.designation,
                maxLoad: parseInt(body.maxLoad),
                department: dept,
                subjects: {
                    set: [], // Clear existing
                    connect: subjectCodes.map(code => ({ code })) // Connect new
                }
            },
            include: { subjects: true }
        });

        return NextResponse.json(updated);
    } catch (e) {
        console.error("PUT Faculty Error:", e);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const user = await checkPermission(request);
    if (!user || (user.role !== "PRINCIPAL" && user.role !== "HOD")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    try {
        if (user.role === "HOD") {
            const faculty = await prisma.faculty.findUnique({ where: { id } });
            if (faculty?.department !== user.department) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        await prisma.faculty.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
