import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const getProductsUploadDir = () => path.join(process.cwd(), 'public', 'uploads', 'products');

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'File gambar produk tidak ditemukan' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const dir = getProductsUploadDir();

    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }

    const filepath = path.join(dir, filename);
    await fs.writeFile(filepath, buffer);

    const fileUrl = `/uploads/products/${filename}`;

    return NextResponse.json({ 
      success: true, 
      url: fileUrl 
    });
  } catch (err) {
    console.error('Error saving product image:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
