import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { NextResponse } from 'next/server';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const store = searchParams.get('store');
  
  try {
    let data = [];
    if (store === 'quotations') {
      data = await prisma.order.findMany({ include: { customer: true, items: { include: { item: true } } } });
    } else if (store === 'customers') {
      data = await prisma.customer.findMany();
    } else if (store === 'items') {
      data = await prisma.item.findMany();
    } else if (store === 'transactions') {
      data = await prisma.transaction.findMany();
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { store, data } = await request.json();
  try {
    let result;
    if (store === 'customers') {
      result = await prisma.customer.upsert({
        where: { id: data.id },
        update: data,
        create: data
      });
    } else if (store === 'items') {
      result = await prisma.item.upsert({
        where: { id: data.id },
        update: data,
        create: data
      });
    } else if (store === 'transactions') {
      result = await prisma.transaction.upsert({
        where: { id: data.id },
        update: data,
        create: data
      });
    } else if (store === 'quotations') {
      const { items, customer, ...orderData } = data;
      if (customer && customer.id) {
        orderData.customerId = customer.id;
      }
      
      // Upsert the main order
      result = await prisma.order.upsert({
        where: { id: orderData.id },
        update: orderData,
        create: orderData
      });
      
      // Handle items
      await prisma.orderItem.deleteMany({ where: { orderId: orderData.id } });
      if (items && items.length > 0) {
        await prisma.orderItem.createMany({
          data: items.map(it => ({
            orderId: orderData.id,
            itemId: it.id,
            qty: it.qty,
            days: it.days,
            price: it.price,
            total: it.total
          }))
        });
      }
      result = await prisma.order.findUnique({ where: { id: orderData.id }, include: { customer: true, items: true } });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Prisma Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const store = searchParams.get('store');
  const id = searchParams.get('id');
  
  try {
    if (store === 'quotations') await prisma.order.delete({ where: { id } });
    if (store === 'customers') await prisma.customer.delete({ where: { id } });
    if (store === 'items') await prisma.item.delete({ where: { id } });
    if (store === 'transactions') await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
