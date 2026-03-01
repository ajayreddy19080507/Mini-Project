import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const rooms = await prisma.room.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(rooms);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const newRoom = await prisma.room.create({
            data: {
                name: body.name,
                type: body.type || 'THEORY',
                capacity: body.capacity ? parseInt(body.capacity) : null
            }
        });

        return NextResponse.json(newRoom);
    } catch (e: any) {
        if (e.code === 'P2002') {
            return NextResponse.json({ error: "Room name already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }
}
