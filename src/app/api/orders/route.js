import { createClient } from '@sanity/client';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    
    const token = process.env.SANITY_API_TOKEN;
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'SANITY_API_TOKEN belum diatur di .env.local server.' 
      }, { status: 500 });
    }

    const client = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 't787jxnr',
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
      useCdn: false,
      apiVersion: '2023-05-03',
      token: token
    });

    // 1. Create or ensure Customer exists
    const customerDoc = {
      _type: 'customer',
      name: data.customerName,
      phone: data.whatsapp,
      address: '',
      email: ''
    };
    const customerRes = await client.create(customerDoc);

    // 2. Map items to references
    const mappedItems = data.cart.map(item => ({
      _key: Math.random().toString(36).substring(7),
      itemRef: { _type: 'reference', _ref: item.id },
      qty: item.qty,
      days: data.duration,
      price: item.price,
      total: item.price * item.qty * data.duration
    }));

    // 3. Create Quotation/Order
    const orderId = 'ORD-' + Date.now().toString().slice(-6);
    const quotationDoc = {
      _type: 'quotation',
      invoiceNo: orderId,
      date: new Date().toISOString().split('T')[0],
      status: 'Draf',
      paymentStatus: 'Lainnya',
      customer: { _type: 'reference', _ref: customerRes._id },
      event: 'Website Order',
      location: '-',
      loadingDate: new Date().toISOString().split('T')[0],
      note: 'Pesanan masuk dari website.',
      discount: 0,
      pph: 0,
      grandTotal: data.totalCart,
      items: mappedItems
    };

    const orderRes = await client.create(quotationDoc);

    return NextResponse.json({ success: true, orderId: orderRes._id });
  } catch (err) {
    console.error('API Sanity Order Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
