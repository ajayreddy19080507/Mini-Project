import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function checkPermission(request: Request) {
    const email = request.headers.get("x-user-email");
    if (!email) return null;
    return prisma.user.findUnique({ where: { email } });
}

export async function GET(request: Request) {
    const user = await checkPermission(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const subjects = await prisma.subject.findMany({
            orderBy: { code: 'asc' }
        });
        return NextResponse.json(subjects);
    } catch (e) {
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
        const subject = await prisma.subject.create({
            data: {
                code: body.code,
                name: body.name,
                isLab: body.isLab,
                duration: body.duration,
                sessionsPerWeek: body.sessionsPerWeek || (body.isLab ? 1 : 4)
            }
        });
        return NextResponse.json(subject);
    } catch (e) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const user = await checkPermission(request);
    if (!user || (user.role !== "PRINCIPAL" && user.role !== "HOD")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
        const body = await request.json();
        const subject = await prisma.subject.update({
            where: { id: body.id },
            data: {
                code: body.code,
                name: body.name,
                isLab: body.isLab,
                duration: body.duration,
                sessionsPerWeek: body.sessionsPerWeek
            }
        });
        return NextResponse.json(subject);
    } catch (e) { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
    const user = await checkPermission(request);
    if (!user || (user.role !== "PRINCIPAL" && user.role !== "HOD")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    try {
        await prisma.subject.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
