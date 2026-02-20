const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const nullFaculty = await prisma.timetable.count({ where: { facultyId: null } });
    const assignedFaculty = await prisma.timetable.count({ where: { NOT: { facultyId: null } } });

    console.log(`Unassigned (NULL): ${nullFaculty}`);
    console.log(`Assigned: ${assignedFaculty}`);
}

main().finally(() => prisma.$disconnect());
