"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";
import { FaBars, FaSignOutAlt, FaUser } from "react-icons/fa";

function AdminNavbar({ setShowMenus }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleShowMenus = () => {
    setShowMenus((prev) => !prev);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      toast.success("Logged out successfully");
      router.push("/admin/login");
    } catch (error) {
      toast.error("Error logging out");
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header id="header" className="w-full">
        <div className="w-full">
          {/* NAVBAR HEADER TOP - Improved Mobile Responsive Layout */}
          <div className="flex items-center justify-between shadow-sm px-3 sm:px-4 md:px-6 lg:px-8 min-h-14 sm:min-h-16 md:min-h-20 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            
            {/* Mobile Menu Button - Only visible on mobile */}
            <div className="lg:hidden">
              <button 
                onClick={handleShowMenus}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <FaBars className="text-lg sm:text-xl" />
              </button>
            </div>

            {/* Logo Section - Centered on mobile, left on desktop */}
            <div className="flex-1 flex justify-center lg:justify-start">
              <Link href={"/admin"} className="block">
                <Image
                  alt="brand-logo"
                  src={"/images/brand-logo.png"}
                  className="rounded-xl h-10 sm:h-12 md:h-14 lg:h-16 w-auto"
                  width={200}
                  height={200}
                  priority
                />
              </Link>
            </div>

            {/* Admin Dashboard Title - Hidden on mobile, visible on larger screens */}
            <div className="hidden md:flex flex-1 justify-center">
              <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-blue-700 dark:text-blue-400">
                Admin Dashboard
              </h1>
            </div>
            
            {/* Profile Section - Always visible */}
            <div className="flex items-center">
              {session?.user?.role === "admin" && (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-1 sm:gap-2 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 px-2 sm:px-3 py-2 rounded-lg transition-colors"
                  >
                    <FaUser className="text-blue-600 dark:text-blue-400 text-sm sm:text-base" />
                    <span className="text-blue-800 dark:text-blue-200 font-medium text-xs sm:text-sm hidden sm:inline">
                      {session?.user?.name || "Admin"}
                    </span>
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-44 sm:w-48 md:w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {session?.user?.name || "Administrator"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel Access</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoggingOut ? (
                          <div className="animate-spin border-2 border-current border-t-transparent rounded-full w-3 h-3"></div>
                        ) : (
                          <FaSignOutAlt className="text-sm" />
                        )}
                        {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
      </header>
    </>
  );
}

export default AdminNavbar;
