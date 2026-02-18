const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@college.edu';
    console.log(`Seeding admin user: ${email}...`);

    const user = await prisma.user.upsert({
        where: { email },
        update: { role: 'PRINCIPAL' },
        create: {
            email,
            role: 'PRINCIPAL',
            department: null, // Principal has access to all
        },
    });

    console.log('Admin user created/updated:', user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
