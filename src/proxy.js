import { NextResponse } from 'next/server';

export default function proxy(request) {
  const { pathname } = request.nextUrl;

  // Allow static assets to pass through without auth check
  const staticExtensions = ['.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp', '.woff', '.woff2', '.ttf', '.eot'];
  if (staticExtensions.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Only protect the admin HTML page
  if (pathname.startsWith('/admin')) {
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
