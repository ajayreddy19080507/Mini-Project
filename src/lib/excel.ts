import * as XLSX from 'xlsx';
import { prisma } from '@/lib/db';

// Interfaces matching the Excel columns
interface FacultyRow {
    Name: string;
    Designation: string; // "Assistant Professor", "Professor", etc.
    Department?: string; // e.g. "CSE"
    MaxLoad?: number;    // Optional override
    Subjects: string;    // Comma separated codes
}

interface SectionRow {
    Name: string; // "CSE-A"
    Department: string;
    Year: number;
    Semester: number;
}

interface SubjectRow {
    Code: string;
    Name: string;
    Type: "Theory" | "Lab";
    Duration: number; // 1 or 3
    SessionsPerWeek?: number; // e.g. 4 for theory, 1 for lab
}

export async function parseAndImportExcel(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // 1. Parse Subjects (Dependencies for Faculty)
    const subjectSheet = workbook.Sheets['Subjects'];
    if (subjectSheet) {
        const subjects: SubjectRow[] = XLSX.utils.sheet_to_json(subjectSheet);
        await importSubjects(subjects);
    }

    // 2. Parse Faculty
    const facultySheet = workbook.Sheets['Faculty'];
    if (facultySheet) {
        const faculty: FacultyRow[] = XLSX.utils.sheet_to_json(facultySheet);
        await importFaculty(faculty);
    }

    // 3. Parse Sections
    const sectionSheet = workbook.Sheets['Sections'];
    if (sectionSheet) {
        const sections: SectionRow[] = XLSX.utils.sheet_to_json(sectionSheet);
        await importSections(sections);
    }

    // 4. Parse Curriculum (Semesters -> Subjects)
    const curriculumSheet = workbook.Sheets['Semesters'];
    if (curriculumSheet) {
        const curriculum: CurriculumRow[] = XLSX.utils.sheet_to_json(curriculumSheet);
        await importCurriculum(curriculum);
    }
}

interface CurriculumRow {
    Department: string;
    Year: number;
    Semester: number;
    Subjects: string; // Comma separated codes
}

async function importCurriculum(rows: CurriculumRow[]) {
    for (const row of rows) {
        const subjectCodes = row.Subjects ? String(row.Subjects).split(',').map(s => s.trim()) : [];
        if (subjectCodes.length === 0) continue;

        const subjects = await prisma.subject.findMany({
            where: { code: { in: subjectCodes } }
        });

        // Update all sections matching Dept/Year/Sem
        const sections = await prisma.section.findMany({
            where: {
                department: row.Department,
                year: row.Year,
                semester: row.Semester
            }
        });

        for (const section of sections) {
            await prisma.section.update({
                where: { id: section.id },
                data: {
                    subjects: {
                        connect: subjects.map(s => ({ id: s.id }))
                    }
                }
            });
        }
    }
}

async function importSubjects(rows: SubjectRow[]) {
    for (const row of rows) {
        await prisma.subject.upsert({
            where: { code: String(row.Code) },
            update: {
                name: row.Name,
                isLab: row.Type === 'Lab',
                duration: row.Duration ? Number(row.Duration) : (row.Type === 'Lab' ? 3 : 1),
                sessionsPerWeek: row.SessionsPerWeek ? Number(row.SessionsPerWeek) : (row.Type === 'Lab' ? 1 : 4)
            },
            create: {
                code: String(row.Code),
                name: row.Name,
                isLab: row.Type === 'Lab',
                duration: row.Duration ? Number(row.Duration) : (row.Type === 'Lab' ? 3 : 1),
                sessionsPerWeek: row.SessionsPerWeek ? Number(row.SessionsPerWeek) : (row.Type === 'Lab' ? 1 : 4)
            }
        });
    }
}

async function importFaculty(rows: FacultyRow[]) {
    for (const row of rows) {
        // Handle subjects linking
        const subjectCodes = row.Subjects ? String(row.Subjects).split(',').map(s => s.trim()) : [];

        // Find existing subjects to connect
        const subjects = await prisma.subject.findMany({
            where: { code: { in: subjectCodes } }
        });

        await prisma.faculty.create({
            data: {
                name: String(row.Name),
                designation: String(row.Designation),
                department: row.Department ? String(row.Department) : "General",
                maxLoad: row.MaxLoad ? Number(row.MaxLoad) : 12,
                subjects: {
                    connect: subjects.map(s => ({ id: s.id }))
                }
            }
        });
    }
}

async function importSections(rows: SectionRow[]) {
    for (const row of rows) {
        await prisma.section.create({
            data: {
                name: row.Name,
                department: row.Department,
                year: row.Year,
                semester: row.Semester
            }
        });
    }
}
