const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const cleanOrder = {
    "id": "ORD-CURL3",
    "invoiceNo": "ORD-CURL3",
    "date": "2026-05-26",
    "status": "Draf",
    "paymentStatus": "Belum Lunas",
    "grandTotal": 10000,
    "event": null,
    "location": null,
    "loadingDate": null,
    "discount": 0,
    "pph": 0,
    "note": null
  };
  const result = await prisma.order.upsert({
    where: { id: cleanOrder.id },
    update: cleanOrder,
    create: cleanOrder
  });
  console.log(result.id);
}

run();
