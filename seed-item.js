require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.item.upsert({
    where: { id: 'I-001' },
    update: {
      name: 'Handy Talkie Baofeng BF-888S',
      unit: 'Unit',
      price: 25000,
      desc: 'Handy Talkie andalan untuk event. Tahan lama dan mudah digunakan.',
      img: '/assets/baofeng.png',
      specs: [
        'Frequency Range 400-470MHz',
        'RF Rated Power < 5W',
        'Channel Capacity 16',
        'Operated Voltage 3.7V',
        'Battery 1500mAh'
      ]
    },
    create: {
      id: 'I-001',
      name: 'Handy Talkie Baofeng BF-888S',
      unit: 'Unit',
      price: 25000,
      desc: 'Handy Talkie andalan untuk event. Tahan lama dan mudah digunakan.',
      img: '/assets/baofeng.png',
      specs: [
        'Frequency Range 400-470MHz',
        'RF Rated Power < 5W',
        'Channel Capacity 16',
        'Operated Voltage 3.7V',
        'Battery 1500mAh'
      ]
    }
  });
  console.log('Item BF-888S updated in DB');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
