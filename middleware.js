import { NextResponse } from 'next/server';

export function middleware(request) {
  // If you need to check URL, you can still access:
  // request.nextUrl.pathname
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
     * - uploads (uploaded files)
     * - *.png, *.jpg, *.jpeg, *.gif, *.svg, *.webp (image files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)',
  ],
};
