import { NextResponse } from 'next/server';

export function middleware(request) {
  // If you need to check URL, you can still access:
  // request.nextUrl.pathname
  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};
