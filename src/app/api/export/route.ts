import { NextResponse } from "next/server";
import { generateExcelBuffer } from "@/lib/excel-export";

export async function GET() {
    try {
        const buffer = await generateExcelBuffer();

        return new NextResponse(buffer, {
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
