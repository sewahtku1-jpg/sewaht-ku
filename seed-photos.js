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
    data: {
      img: '/assets/bf888s_1.png,/assets/bf888s_2.png,/assets/bf888s_3.png'
    }
  });
  await prisma.item.update({
    where: { id: 'I-002' },
    data: {
      img: '/assets/uv82_1.png,/assets/uv82_2.png,/assets/uv82_3.png,/assets/uv82_4.png'
    }
  });
  console.log('Photos updated');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
