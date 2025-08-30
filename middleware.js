import { NextResponse } from "next/server";

export function middleware(req) {
  return NextResponse.next();
}

// only protect private routes, not everything
export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
