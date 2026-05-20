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
    where: { id: 'I-002' },
    update: {
      name: 'Handy Talkie Baofeng UV-82',
      unit: 'Unit',
      price: 35000,
      desc: 'Handy Talkie Dual Band andalan untuk event outdoor maupun indoor dengan jarak jangkauan luas.',
      img: '/assets/baofeng.png',
      specs: [
        'Frequency Range 65-108MHz',
        '(VHF 136-174MHz)',
        '(UHF 400-520MHz)',
        'Power 5W',
        'Voltage 7.4V',
        'RF Rated Power 5W/1W',
        'Battery 2800mAh'
      ]
    },
    create: {
      id: 'I-002',
      name: 'Handy Talkie Baofeng UV-82',
      unit: 'Unit',
      price: 35000,
      desc: 'Handy Talkie Dual Band andalan untuk event outdoor maupun indoor dengan jarak jangkauan luas.',
      img: '/assets/baofeng.png',
      specs: [
        'Frequency Range 65-108MHz',
        '(VHF 136-174MHz)',
        '(UHF 400-520MHz)',
        'Power 5W',
        'Voltage 7.4V',
        'RF Rated Power 5W/1W',
        'Battery 2800mAh'
      ]
    }
  });
  console.log('Item UV-82 updated in DB');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
