const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
prisma.$connect()
    .then(() => {
        console.log('Connected');
        process.exit(0);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
