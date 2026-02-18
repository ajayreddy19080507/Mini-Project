const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check(url) {
    console.log(`\n--- Checking DB: ${url} ---`);
    try {
        const client = new PrismaClient({
            datasources: {
                db: {
                    url: url,
                },
            },
        });
        const count = await client.user.count();
        console.log(`User count: ${count}`);
        const user = await client.user.findUnique({ where: { email: 'principal@srecnandyal.edu.in' } });
        console.log('Principal found:', user);
        await client.$disconnect();
    } catch (e) {
        console.log("Error:", e.message);
    }
}

async function main() {
    await check('file:C:/Users/AJAY REDDY/OneDrive/Desktop/Mini-Project/dev.db');
    await check('file:C:/Users/AJAY REDDY/OneDrive/Desktop/Mini-Project/prisma/dev.db');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
