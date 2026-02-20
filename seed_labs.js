const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const labs = [
        { name: 'CP LAB-1', type: 'LAB' },
        { name: 'CP LAB-2', type: 'LAB' },
        { name: 'CHEM LAB', type: 'LAB' },
        { name: 'PHYSICS LAB', type: 'LAB' },
        { name: 'ELCS LAB', type: 'LAB' },
        { name: 'IT WORKSHOP', type: 'LAB' },
        { name: 'ENGINEERING WORKSHOP', type: 'LAB' },
    ];

    console.log('Seeding Labs...');

    for (const lab of labs) {
        await prisma.room.upsert({
            where: { name: lab.name },
            update: { type: lab.type },
            create: {
                name: lab.name,
                type: lab.type,
                capacity: 60
            }
        });
    }

    // Also seed some theory rooms if needed
    for (let i = 101; i <= 110; i++) {
        const name = `LH-${i}`;
        await prisma.room.upsert({
            where: { name },
            update: {},
            create: { name, type: 'THEORY', capacity: 60 }
        });
    }

    console.log('Labs & Classrooms Seeded!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
