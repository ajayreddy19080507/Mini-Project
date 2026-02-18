import * as XLSX from 'xlsx';
import { prisma } from '@/lib/db';
import { DAYS } from '@/lib/algorithm/types';

export async function generateExcelBuffer() {
    const sections = await prisma.section.findMany({
        include: {
            timetables: {
                include: { subject: true, faculty: true, room: true }
            }
        }
    });

    const workbook = XLSX.utils.book_new();

    for (const section of sections) {
        // Create data grid
        // Row 0: Headers (Day/Period)
        // Row 1..6: Days
        const data: any[][] = [];

        // Header
        const headerRow = ["Day / Period", ...[1, 2, 3, 4, 5, 6, 7].map(p => `Period ${p}`)];
        data.push(headerRow);

        for (const day of DAYS) {
            const rowData = [day];
            for (let p = 1; p <= 7; p++) {
                const entry = section.timetables.find(t => t.day === day && t.slot === p);
                if (entry) {
                    // Format: "Subject (Faculty)"
                    const text = `${entry.subject?.code}\n(${entry.faculty?.name || 'TBA'})`;
                    rowData.push(text);
                } else {
                    rowData.push("-");
                }
            }
            data.push(rowData);
        }

        // Add Workload summary?
        // User asked for "workload of each and every faculty"
        // I'll add a separate sheet for "Faculty Workload" later.

        const sheetName = `${section.department}-${section.year}-${section.name}`.substring(0, 31); // Max 31 chars
        const worksheet = XLSX.utils.aoa_to_sheet(data);

        // Basic adjusting logic for column width provided bySheetJS auto (not available in basic)
        // worksheet['!cols'] = [{ wch: 15 }, { wch: 15 }, ...];

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    // Workload Sheet
    const faculty = await prisma.faculty.findMany({
        include: {
            timetables: {
                include: { section: true, subject: true }
            }
        }
    });

    const workloadData = [["Faculty Name", "Designation", "Total Load", "Details"]];
    for (const f of faculty) {
        const load = f.timetables.length;
        const details = f.timetables.map(t => `${t.day} P${t.slot} (${t.section.name})`).join(", ");
        workloadData.push([f.name, f.designation, String(load), details]);
    }
    const workloadSheet = XLSX.utils.aoa_to_sheet(workloadData);
    XLSX.utils.book_append_sheet(workbook, workloadSheet, "Faculty Workload");

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
