import { NextResponse } from "next/server";
import { generateExcelBuffer } from "@/lib/excel-export";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const buffer = await generateExcelBuffer();

        return new NextResponse(buffer as unknown as BodyInit, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="college_timetable.xlsx"'
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
    }
}
