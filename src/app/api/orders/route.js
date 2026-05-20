import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { NextResponse } from 'next/server';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(request) {
  try {
    const data = await request.json();

    const customerId = 'C-' + Date.now();
    const orderId = 'ORD-' + Date.now();

    const newOrder = await prisma.order.create({
      data: {
        id: orderId,
        invoiceNo: orderId,
        date: new Date().toISOString(),
        status: 'Draf',
        paymentStatus: 'Belum Lunas',
        grandTotal: data.totalCart,
        customer: {
          create: {
            id: customerId,
            name: data.customerName,
            phone: data.whatsapp,
          }
        },
        items: {
          create: data.cart.map(item => ({
            qty: item.qty || 1,
            days: data.duration || 1,
            price: item.price || 0,
            total: (item.qty || 1) * (data.duration || 1) * (item.price || 0)
          }))
        }
      }
    });

    return NextResponse.json({ success: true, orderId: newOrder.id });
  } catch (err) {
    console.error('API Prisma Order Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
