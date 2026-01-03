import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'jalanea_lab_auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get(COOKIE_NAME);

  // Public paths that don't require authentication
  const publicPaths = ['/', '/api/auth'];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith('/api/'));

  // If trying to access protected route without auth
  if (!isPublicPath && !authCookie) {
    // Redirect to easter egg page
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('easter', 'true');
    return NextResponse.redirect(url);
  }

  // If authenticated and trying to access login page, redirect to dashboard
  if (pathname === '/' && authCookie && !request.nextUrl.searchParams.has('easter')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - Static files (favicon, icons, manifest, service worker, etc.)
     */
    '/((?!_next/static|_next/image|favicon|icon-|apple-touch-icon|jaldev-logo|manifest.json|sw.js|.*\\.png$|.*\\.svg$|.*\\.ico$).*)',
  ],
};
