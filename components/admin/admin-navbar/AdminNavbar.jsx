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
  const { data: session } = useSession();
  const router = useRouter();

  const handleShowMenus = () => {
    setShowMenus((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Logged out successfully");
      router.push("/admin/login");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  return (
    <>
      <header id="header" className="w-full">
        <div className="w-full">
          {/* NAVBAR HEADER TOP */}
          <div className="navbar shadow-sm gap-4 px-4 sm:px-6 lg:px-8 top-header-bg-color-animtion max-h-20 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <div className="text-3xl max-sm:block hidden">
              <button onClick={handleShowMenus}>
                <FaBars />
              </button>
            </div>
            <div className="flex-1 ">
              <Link href={"/admin"}>
                <Image
                  alt="brand-logo"
                  src={"/images/brand-logo.png"}
                  className="rounded-2xl h-16"
                  width={200}
                  height={200}
                />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400 max-sm:text-xl max-sm:hidden">
                Admin Dashboard
              </h1>
              
              {/* Admin Profile Dropdown - Only show if user is authenticated as admin */}
              {session?.user?.role === "admin" && (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
                  >
                    <FaUser className="text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-800 dark:text-blue-200 font-medium max-sm:hidden">
                      {session?.user?.name || "Admin"}
                    </span>
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {session?.user?.name || "Administrator"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel Access</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                      >
                        <FaSignOutAlt />
                        Sign Out
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
