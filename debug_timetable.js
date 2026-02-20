const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking Timetable Data...");
        const entries = await prisma.timetable.findMany({
            take: 5,
            include: { faculty: true, subject: true, room: true }
        });
        console.log(JSON.stringify(entries, null, 2));

        const nullFaculty = await prisma.timetable.count({ where: { facultyId: null } });
        console.log(`Timetable entries with NULL faculty: ${nullFaculty}`);

        const total = await prisma.timetable.count();
        console.log(`Total Timetable entries: ${total}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
