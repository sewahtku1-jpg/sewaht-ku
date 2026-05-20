require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.item.update({
    where: { id: 'I-001' },
    data: { price: 10000 }
  });
  await prisma.item.update({
    where: { id: 'I-002' },
    data: { price: 20000 }
  });
  console.log('Prices updated');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
