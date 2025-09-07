// /app/admin/layout.js
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import LoaderEffect from "@/components/ui/LoaderEffect";
import AdminNavbar from "@/components/admin/admin-navbar/AdminNavbar";
import AdminNavAsideBar from "@/components/admin/admin-nav-aside-bar/AdminNavAsideBar";

export default function AdminLayout({ children }) {
  const [showMenus, setShowMenus] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow access to login page without authentication
    if (pathname === "/admin/login") {
      return;
    }

    // If not loading and no session or not admin, redirect to login
    if (status !== "loading" && (!session || session.user?.role !== "admin")) {
      router.push("/admin/login");
    }
  }, [session, status, router, pathname]);

  // Show loading while checking authentication
  if (status === "loading") {
    return <LoaderEffect />;
  }

  // If on login page, render without admin layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // If not authenticated as admin, don't render anything (redirect will happen)
  if (!session || session.user?.role !== "admin") {
    return null;
  }

  return (
    <div className="w-full">
      <AdminNavbar setShowMenus={setShowMenus} />
      <div className="min-h-screen bg-base-200 dark:bg-gray-900 w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 relative">
        <div className="w-full max-sm:rounded-none max-sm:border-slate-200">
          <div className="flex flex-col lg:flex-row gap-6">
            <AdminNavAsideBar setShowMenus={setShowMenus} showMenus={showMenus} />
            {/* Dynamic Main Content */}
            <main className="lg:w-3/4 w-full">
              <div className="bg-base-100 dark:bg-gray-800 rounded-box shadow p-6 text-gray-900 dark:text-gray-100">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
