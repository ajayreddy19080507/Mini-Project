const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.timetable.count();
        console.log(`Timetable entries: ${count}`);

        const facultyCount = await prisma.faculty.count();
        console.log(`Faculty entries: ${facultyCount}`);

        const subjectCount = await prisma.subject.count();
        console.log(`Subject entries: ${subjectCount}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
