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
      
      // ✅ PENTING: Simpan customer ke DB terlebih dahulu agar FK tidak violated
      if (customer && customer.id) {
        const { id: custId, name, address, phone, email } = customer;
        await prisma.customer.upsert({
          where: { id: custId },
          update: { name: name || '', address: address || '', phone: phone || '', email: email || '' },
          create: { id: custId, name: name || '', address: address || '', phone: phone || '', email: email || '' }
        });
        orderData.customerId = custId;
      }

      // Bersihkan field yang bukan kolom Order — sesuai Prisma schema
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

      // Upsert order
      result = await prisma.order.upsert({
        where: { id: cleanOrder.id },
        update: cleanOrder,
        create: cleanOrder
      });
      
      // Handle items
      await prisma.orderItem.deleteMany({ where: { orderId: cleanOrder.id } });
      const validItems = (items || []).filter(it => it.id || it.itemId);
      if (validItems.length > 0) {
        await prisma.orderItem.createMany({
          data: validItems.map(it => ({
            orderId: cleanOrder.id,
            itemId: it.id || it.itemId,
            qty: Number(it.qty) || 1,
            days: Number(it.days) || 1,
            price: Number(it.price) || 0,
            total: Number(it.total) || 0
          }))
        });
      }
      result = await prisma.order.findUnique({ where: { id: cleanOrder.id }, include: { customer: true, items: true } });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Prisma Error:', error.message);
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
