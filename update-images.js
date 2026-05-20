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
    where: { id: 'I-002' },
    data: { img: '/assets/uv82_new_1.png,/assets/uv82_new_2.png,/assets/uv82_new_3.png' }
  });
  console.log('Images updated');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
