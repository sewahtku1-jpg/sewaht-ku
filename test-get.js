const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg({ pool });
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    const data = await prisma.order.findMany({ include: { customer: true, items: { include: { item: true } } } });
    console.log("Quotations:", data.length);
  } catch (err) {
    console.error("GET ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
