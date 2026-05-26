const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function wipe() {
  console.log("Wiping database...");
  await prisma.transaction.deleteMany();
  console.log("Deleted transactions");
  await prisma.orderItem.deleteMany();
  console.log("Deleted order items");
  await prisma.order.deleteMany();
  console.log("Deleted orders");
  await prisma.customer.deleteMany();
  console.log("Deleted customers");
  // Keep items (products) so the catalog is intact, unless they want everything gone?
  // Let's keep items, but they can be easily re-seeded.
  console.log("Database wiped successfully (kept Item catalog)!");
  process.exit(0);
}
wipe().catch(e => {
  console.error(e);
  process.exit(1);
});
