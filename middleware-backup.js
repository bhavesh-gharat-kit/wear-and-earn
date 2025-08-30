// Alternative minimal middleware if the current one still causes issues
import { NextResponse } from 'next/server';

export function middleware(request) {
  return NextResponse.next();
}

// Even more restrictive matcher - only runs on specific paths
export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/((?!api|_next|favicon.ico|uploads).*)',
  ],
};
