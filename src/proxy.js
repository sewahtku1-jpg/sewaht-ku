import { NextResponse } from 'next/server';

export function proxy(request) {
  // Hanya lindungi rute yang mengarah ke /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const auth = request.cookies.get('admin_auth');
    
    // Jika tidak ada cookie admin_auth, redirect ke halaman login
    if (!auth) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
