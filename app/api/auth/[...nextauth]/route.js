import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

// Ensure this route runs on the Node.js runtime and is always dynamic.
// This avoids edge-runtime incompatibilities (e.g., bcrypt) and caching issues for auth.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const authOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt", // Use "jwt" strategy to avoid DB-stored sessions
  },

  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        mobileNo: { label: "Mobile Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.mobileNo || !credentials?.password) {
          throw new Error(
            encodeURIComponent("Mobile number and password are required")
          );
        }

        const user = await prisma.user.findUnique({
          where: { mobileNo: credentials.mobileNo },
        });

        if (!user) {
          throw new Error(encodeURIComponent("No user found with this user id"));
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) {
          throw new Error(encodeURIComponent("Incorrect password"));
        }

        return {
          id: user.id,
          name: user.fullName,
          fullName: user.fullName,
          mobileNo: user.mobileNo,
          role: user.role,
        };
      },
    }),
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        userId: { label: "User ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.userId || !credentials?.password) {
          throw new Error("User ID and password are required");
        }

        // Check if user exists in database with mobile number or email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { mobileNo: credentials.userId },
              { email: credentials.userId }
            ],
            role: "admin" // Only allow users with admin role
          }
        });

        if (!user) {
          throw new Error("No admin user found with this user ID");
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid admin credentials");
        }

        return {
          id: user.id.toString(),
          name: user.fullName,
          fullName: user.fullName,
          email: user.email,
          mobileNo: user.mobileNo,
          role: user.role,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login", // custom login page for regular users
    error: "/login-register", // redirect auth errors to login page
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.fullName = user.fullName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.fullName = token.fullName;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle admin redirects - if redirecting to admin area and not already on admin login
      if (url.includes("/admin") && !url.includes("/admin/login")) {
        return `${baseUrl}/admin/login`;
      }
      // If someone tries to access /api/auth/signin with admin callback, redirect to admin login
      if (url.includes("callbackUrl") && url.includes("/admin")) {
        return `${baseUrl}/admin/login`;
      }
      // Default redirect behavior
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };