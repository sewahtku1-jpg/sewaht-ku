import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const getLogosDir = () => path.join(process.cwd(), 'public', 'uploads', 'logos');

export async function GET() {
  try {
    const dir = getLogosDir();
    let files = [];
    try {
      files = await fs.readdir(dir);
    } catch (e) {
      // Ignore errors (like directory not existing or read-only filesystem on Vercel)
      files = [];
    }

    const images = files.filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f));
    
    // Provide nice default mock sponsors if empty so the marquee looks gorgeous immediately
    let logos = images.map(filename => ({
      id: filename,
      name: filename.replace(/\.[^/.]+$/, ''),
      url: `/uploads/logos/${filename}`
    }));

    return NextResponse.json({ success: true, logos });
  } catch (err) {
    console.error('Error reading logos:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const dir = getLogosDir();

    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }

    const filepath = path.join(dir, filename);
    await fs.writeFile(filepath, buffer);

    return NextResponse.json({ 
      success: true, 
      logo: {
        id: filename,
        name: filename.replace(/\.[^/.]+$/, ''),
        url: `/uploads/logos/${filename}`
      } 
    });
  } catch (err) {
    console.error('Error saving logo:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ success: false, error: 'Nama file wajib disertakan' }, { status: 400 });
    }

    if (filename.startsWith('default-')) {
      return NextResponse.json({ success: true, message: 'Mock ignored' });
    }

    const filepath = path.join(getLogosDir(), path.basename(filename));
    try {
      await fs.unlink(filepath);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting logo:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
