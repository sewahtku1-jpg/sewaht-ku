import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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

    if (logos.length === 0) {
      const makeSvg = (str) => `data:image/svg+xml;utf8,${encodeURIComponent(str)}`;
      logos = [
        { 
          id: 'default-1', 
          name: 'Telkomsel', 
          url: makeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40" width="160" height="40"><rect x="0" y="5" width="30" height="30" rx="6" fill="#E11D48"/><circle cx="15" cy="20" r="6" fill="#ffffff"/><text x="38" y="27" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#1E293B">TELKOMSEL</text></svg>') 
        },
        { 
          id: 'default-2', 
          name: 'Bank Mandiri', 
          url: makeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 40" width="140" height="40"><path d="M5 20 C 12 5, 18 35, 25 20" stroke="#FBBF24" stroke-width="4" fill="none" stroke-linecap="round"/><text x="32" y="27" font-family="Arial, sans-serif" font-weight="800" font-size="20" fill="#1E3A8A">mandiri</text></svg>') 
        },
        { 
          id: 'default-3', 
          name: 'Gojek', 
          url: makeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 40" width="110" height="40"><circle cx="15" cy="20" r="12" fill="#10B981"/><circle cx="15" cy="20" r="5" fill="#ffffff"/><text x="34" y="27" font-family="Arial, sans-serif" font-weight="800" font-size="20" fill="#10B981">gojek</text></svg>') 
        },
        { 
          id: 'default-4', 
          name: 'Tokopedia', 
          url: makeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 40" width="140" height="40"><rect x="0" y="6" width="26" height="24" rx="6" fill="#22C55E"/><circle cx="8" cy="18" r="2.5" fill="#ffffff"/><circle cx="18" cy="18" r="2.5" fill="#ffffff"/><text x="34" y="27" font-family="Arial, sans-serif" font-weight="800" font-size="19" fill="#22C55E">tokopedia</text></svg>') 
        },
        { 
          id: 'default-5', 
          name: 'Shopee', 
          url: makeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" width="120" height="40"><rect x="0" y="6" width="26" height="24" rx="5" fill="#F97316"/><text x="13" y="23" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle">S</text><text x="34" y="27" font-family="Arial, sans-serif" font-weight="800" font-size="20" fill="#F97316">Shopee</text></svg>') 
        },
      ];
    }

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

    const filepath = path.join(getLogosDir(), path.basename(filename));
    await fs.unlink(filepath);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting logo:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
