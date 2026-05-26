require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run() {
  try {
    const data = await prisma.order.findMany({ include: { customer: true, items: { include: { item: true } } } });
    console.log("Quotations native:", data.length);
  } catch (err) {
    console.error("GET ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
