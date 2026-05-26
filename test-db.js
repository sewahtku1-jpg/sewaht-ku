const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ path: '.env' });

async function run() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg({ pool });
  const prisma = new PrismaClient({ adapter });

  try {
    const data = {
      id: 'ORD-TEST1',
      invoiceNo: 'ORD-TEST1',
      date: '2026-05-26',
      status: 'Draf',
      paymentStatus: 'Belum Lunas',
      customer: { id: 'C-001', name: 'PT Maju Jaya' },
      event: '',
      location: '',
      loadingDate: '',
      note: '',
      discount: null,
      pph: null,
      grandTotal: 10000,
      items: [
        { id: 'I-001', qty: 1, days: 1, price: 10000, total: 10000 }
      ]
    };
    
    let { items, customer, ...orderData } = data;
    
    // same logic as route.js
    if (customer && customer.id) {
      const { id: custId, name, address, phone, email } = customer;
      await prisma.customer.upsert({
        where: { id: custId },
        update: { name: name || '', address: address || '', phone: phone || '', email: email || '' },
        create: { id: custId, name: name || '', address: address || '', phone: phone || '', email: email || '' }
      });
      orderData.customerId = custId;
    }

    const cleanOrder = {
      id: orderData.id,
      invoiceNo: orderData.invoiceNo || orderData.id,
      date: orderData.date || new Date().toISOString(),
      status: orderData.status || 'Draf',
      paymentStatus: orderData.paymentStatus || 'Belum Lunas',
      grandTotal: Number(orderData.grandTotal) || 0,
      event: orderData.eventName || orderData.event || null,
      location: orderData.location || null,
      loadingDate: orderData.loadDate || orderData.loadingDate || null,
      discount: Number(orderData.discount) || 0,
      pph: Number(orderData.pph) || 0,
      note: orderData.notes || orderData.note || null,
      ...(orderData.customerId ? { customerId: orderData.customerId } : {})
    };

    const result = await prisma.order.upsert({
      where: { id: cleanOrder.id },
      update: cleanOrder,
      create: cleanOrder
    });
    
    console.log("Upserted Order:", result.id);
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
