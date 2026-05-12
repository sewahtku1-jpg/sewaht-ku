import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { password } = await request.json();
    
    // Gunakan password dari env, atau default "admin123" jika belum diatur
    const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === correctPassword) {
      const response = NextResponse.json({ success: true });
      // Set cookie yang berlaku selama 24 jam
      response.cookies.set('admin_auth', 'true', {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 24 hours
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      return response;
    }
    
    return NextResponse.json({ success: false, message: 'Password salah' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
