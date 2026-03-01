import ExcelJS from 'exceljs';
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

    const workbook = new ExcelJS.Workbook();

    for (const section of sections) {
        const sheetName = `${section.department}-${section.year}-${section.name}`.substring(0, 31);
        const worksheet = workbook.addWorksheet(sheetName);

        // --- Column Sizing ---
        worksheet.columns = [
            { width: 15 }, // Day
            { width: 35 }, // Period 1
            { width: 35 }, // Period 2
            { width: 35 }, // Period 3
            { width: 35 }, // Period 4
            { width: 35 }, // Period 5
            { width: 35 }, // Period 6
            { width: 35 }  // Period 7
        ];

        // --- Timetable Grid ---
        // Header Row (Row 1)
        const headerRowIndex = 1;
        const headerRow = worksheet.getRow(headerRowIndex);
        headerRow.height = 30;
        headerRow.values = ["Day / Period", ...[1, 2, 3, 4, 5, 6, 7].map(p => `Period ${p}`)];

        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }; // Dark grey header
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
            };
        });

        // Data Rows
        let currentRowIndex = 2;
        for (const day of DAYS) {
            const row = worksheet.getRow(currentRowIndex);
            row.height = 70; // Taller rows for multi-line text

            const rowData: string[] = [day];
            for (let p = 1; p <= 7; p++) {
                const entry = section.timetables.find(t => t.day === day && t.slot === p);
                if (entry) {
                    rowData.push(`${entry.subject?.name || entry.subject?.code}\n(${entry.faculty?.name || 'TBA'})`);
                } else {
                    rowData.push("-");
                }
            }

            row.values = rowData;

            row.eachCell((cell, colNumber) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
                };

                // Style Day column differently
                if (colNumber === 1) {
                    cell.font = { bold: true };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
                }
            });

            currentRowIndex++;
        }
    }

    // Workload Sheet
    const workloadSheet = workbook.addWorksheet('Faculty Workload');
    workloadSheet.columns = [
        { header: 'Faculty Name', key: 'name', width: 25 },
        { header: 'Designation', key: 'designation', width: 20 },
        { header: 'Total Load (Periods)', key: 'load', width: 20 },
        { header: 'Details', key: 'details', width: 80 }
    ];

    const faculty = await prisma.faculty.findMany({
        include: { timetables: { include: { section: true, subject: true } } }
    });

    for (const f of faculty) {
        const details = f.timetables.map(t => `${t.day} P${t.slot} (${t.section.name})`).join(", ");
        workloadSheet.addRow({
            name: f.name,
            designation: f.designation,
            load: f.timetables.length,
            details: details
        });
    }

    // Style Workload header
    workloadSheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
}
