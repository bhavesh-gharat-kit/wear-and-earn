// /app/admin/layout.js
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import LoaderEffect from "@/components/ui/LoaderEffect";
import AdminNavbar from "@/components/admin/admin-navbar/AdminNavbar";
import AdminNavAsideBar from "@/components/admin/admin-nav-aside-bar/AdminNavAsideBar";
import AdminBreadcrumb from "@/components/admin/breadcrumb/AdminBreadcrumb";

export default function AdminLayout({ children }) {
  const [showMenus, setShowMenus] = useState(false); // false = menu closed, true = menu open
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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 w-full relative">
        <div className="flex">
          <AdminNavAsideBar setShowMenus={setShowMenus} showMenus={showMenus} />
          {/* Dynamic Main Content */}
          <main className="flex-1 lg:ml-0 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 md:p-6 text-gray-900 dark:text-gray-100 overflow-x-auto min-h-screen">
              <AdminBreadcrumb />
              {children}
            </div>
          </main>
        </div>
      </div>
      
      {/* Mobile overlay */}
      {showMenus && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setShowMenus(false)}
        />
      )}
    </div>
  );
}
