const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function GET() {
    try {
        // Mock the API logic
        const faculty = await prisma.faculty.findFirst({
            include: {
                subjects: true,
                timetables: {
                    include: {
                        section: true,
                        subject: true,
                        room: true
                    }
                }
            }
        });

        if (!faculty) {
            console.log("No faculty found");
            return;
        }

        console.log(`Faculty: ${faculty.name}`);
        console.log(`Timetables Count: ${faculty.timetables.length}`);

        const scheduleByDay = {};
        ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day => {
            scheduleByDay[day] = faculty.timetables
                .filter(t => t.day === day)
                .sort((a, b) => a.slot - b.slot);
        });

        console.log("Schedule for MON:", JSON.stringify(scheduleByDay['MON'], null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

GET();
