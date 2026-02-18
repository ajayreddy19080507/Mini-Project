const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Verifying Data ---");

    // 1. Check Sections
    const sections = await prisma.section.findMany({ include: { subjects: true } });
    console.log(`Sections Found: ${sections.length}`);
    if (sections.length === 0) console.warn("WARNING: No sections found.");

    let sectionsWithNoSubjects = 0;
    for (const s of sections) {
        console.log(`Section ${s.name} (${s.department}): ${s.subjects.length} subjects`);
        if (s.subjects.length === 0) sectionsWithNoSubjects++;
    }
    if (sectionsWithNoSubjects > 0) console.warn(`WARNING: ${sectionsWithNoSubjects} sections have 0 subjects.`);

    // 2. Check Subjects & Faculty
    const subjects = await prisma.subject.findMany({ include: { faculty: true } });
    console.log(`Subjects Found: ${subjects.length}`);

    let subjectsWithNoFaculty = 0;
    for (const s of subjects) {
        if (s.faculty.length === 0) {
            console.warn(`WARNING: Subject ${s.code} (${s.name}) has NO FACULTY assigned.`);
            subjectsWithNoFaculty++;
        }
    }

    if (subjectsWithNoFaculty > 0) {
        console.error(`CRITICAL: ${subjectsWithNoFaculty} subjects have no faculty. This will cause the scheduler to fail.`);
    } else {
        console.log("OK: All subjects have at least one faculty.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
