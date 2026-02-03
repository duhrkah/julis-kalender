/**
 * Next.js middleware for authentication and route protection
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/embed'];
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith('/embed'));

  // If trying to access protected route without token
  if (!isPublicRoute && !token) {
    // Check if token exists in localStorage (client-side only check)
    // Since middleware runs on server, we'll redirect and let client handle it
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (isAdminRoute && token) {
    // Note: We can't easily decode JWT in middleware without adding a library
    // Client-side AuthProvider will handle final admin check
    // For now, we allow access and let the client verify
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)',
  ],
};
