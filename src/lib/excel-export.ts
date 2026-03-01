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
    // Define column widths for the 2-block layout: 
    // Left Block: A (Day), B-H (Periods 1-7). Column I: Spacer. Right Block: J (Day), K-Q (Periods 1-7)
    for (let c = 1; c <= 17; c++) {
        if (c === 9) {
            workloadSheet.getColumn(c).width = 4; // Spacer column I
        } else if (c === 1 || c === 10) {
            workloadSheet.getColumn(c).width = 8; // Day columns
        } else {
            workloadSheet.getColumn(c).width = 15; // Period columns
        }
    }

    const faculty = await prisma.faculty.findMany({
        include: {
            timetables: { include: { section: true, subject: true } },
            subjects: true
        }
    });

    let currentRow = 2; // Start on row 2 for top padding
    for (let i = 0; i < faculty.length; i++) {
        const f = faculty[i];

        const isRightColumn = i % 2 !== 0;
        const colOffset = isRightColumn ? 10 : 1; // 1 = A, 10 = J

        // Move down 10 rows for every new pair of faculties
        if (i > 0 && !isRightColumn) {
            currentRow += 10;
        }

        // 1. Faculty Yellow Header Row
        workloadSheet.mergeCells(currentRow, colOffset, currentRow, colOffset + 7);
        const headerCell = workloadSheet.getCell(currentRow, colOffset);

        // e.g. "Mr. P.BHASKAR - CNS A,B, IPR-C(15)"
        const subjectCodes = f.subjects.map(s => s.code).join(',');
        headerCell.value = `${f.name} - ${subjectCodes} (${f.timetables.length})`;
        headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Yellow
        headerCell.font = { bold: true };
        headerCell.alignment = { horizontal: 'center', vertical: 'middle' };

        for (let c = colOffset; c <= colOffset + 7; c++) {
            workloadSheet.getCell(currentRow, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        }

        // 2. Period Numbers Row (1 to 7)
        const periodRow = currentRow + 1;
        workloadSheet.getCell(periodRow, colOffset).value = ''; // Corner is blank
        workloadSheet.getCell(periodRow, colOffset).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        for (let p = 1; p <= 7; p++) {
            const cell = workloadSheet.getCell(periodRow, colOffset + p);
            cell.value = p;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        }

        // 3. Days Grid (MON to SAT)
        const dayAbbrs = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dbDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        for (let dIndex = 0; dIndex < 6; dIndex++) {
            const r = currentRow + 2 + dIndex;

            // Day label cell
            const dayCell = workloadSheet.getCell(r, colOffset);
            dayCell.value = dayAbbrs[dIndex];
            dayCell.alignment = { horizontal: 'center', vertical: 'middle' };
            dayCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

            // Find classes for this day
            for (let p = 1; p <= 7; p++) {
                const cell = workloadSheet.getCell(r, colOffset + p);

                const entry = f.timetables.find(t => t.day === dbDays[dIndex] && t.slot === p);
                if (entry) {
                    const subj = entry.subject?.name || entry.subject?.code || '';
                    const sec = entry.section.name || '';
                    cell.value = `${subj}-${sec}`;
                } else {
                    cell.value = '';
                }

                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }
        }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
}
