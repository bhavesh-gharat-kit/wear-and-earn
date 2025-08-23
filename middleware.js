import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes protection
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
      if (!token || token.role !== "admin") {
        // Force redirect to admin login
        const adminLoginUrl = new URL("/admin/login", req.url);
        return NextResponse.redirect(adminLoginUrl);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Always allow access to admin login page
        if (pathname === "/admin/login") {
          return true;
        }
        
        // For admin routes, check if user has admin role
        if (pathname.startsWith("/admin")) {
          return token?.role === "admin";
        }
        
        // Allow all other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"]
};
