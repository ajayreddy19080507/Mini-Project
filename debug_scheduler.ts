import { prisma } from "./src/lib/db";
import { generateTimetable } from "./src/lib/algorithm/scheduler";

async function debug() {
    console.log("Starting debug...");

    const sections = await prisma.section.count();
    const faculties = await prisma.faculty.count();
    const rooms = await prisma.room.count();
    const subjects = await prisma.subject.count();

    console.log(`Resources: Sections=${sections}, Faculty=${faculties}, Rooms=${rooms}, Subjects=${subjects}`);

    const allFaculty = await prisma.faculty.findMany({ include: { subjects: true } });
    for (const f of allFaculty) {
        console.log(`Faculty ${f.name} teaches: ${f.subjects.map(s => s.code).join(", ")}`);
    }

    const allRooms = await prisma.room.findMany();
    console.log(`Rooms: ${allRooms.map(r => r.name + " (" + r.type + ")").join(", ")}`);

    console.log("Running generation...");
    const result = await generateTimetable();
    console.log("Result:", result);
}

debug().catch(console.error);
