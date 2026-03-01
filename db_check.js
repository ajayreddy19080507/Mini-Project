const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function check() {
    const faculties = await prisma.faculty.findMany({ include: { subjects: true } });
    const sections = await prisma.section.findMany({ include: { subjects: true } });
    const rooms = await prisma.room.findMany();

    let totalTheoryNeeded = 0;
    let totalLabNeeded = 0;

    for (const section of sections) {
        for (const subject of section.subjects) {
            if (subject.isLab) {
                totalLabNeeded += subject.duration || 3;
            } else {
                totalTheoryNeeded += subject.sessionsPerWeek || 4;
            }
        }
    }

    let totalFacultyCapacity = 0;
    for (const f of faculties) {
        totalFacultyCapacity += f.maxLoad || 12;
    }

    const output = {
        summary: {
            TheoryHoursNeeded: totalTheoryNeeded,
            LabHoursNeeded: totalLabNeeded,
            TotalHoursNeeded: totalTheoryNeeded + totalLabNeeded,
            TotalFacultyCapacity: totalFacultyCapacity,
            TotalRooms: rooms.length,
            LabRooms: rooms.filter(r => r.type === "LAB").length,
            TheoryRooms: rooms.filter(r => r.type === "THEORY").length,
        },
        faculties: faculties.map(f => ({ name: f.name, maxLoad: f.maxLoad, subjects: f.subjects.map(s => s.code) })),
        sections: sections.map(s => ({ name: s.name, subjects: s.subjects.map(s => s.code) })),
        rooms: rooms.map(r => ({ name: r.name, type: r.type }))
    };

    fs.writeFileSync('db_out.json', JSON.stringify(output, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
