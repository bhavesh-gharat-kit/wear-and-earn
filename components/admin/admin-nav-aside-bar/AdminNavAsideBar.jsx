"use client";

import LoaderEffect from "@/components/ui/LoaderEffect";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { BsBoxSeamFill } from "react-icons/bs";
import {
  FaCartArrowDown,
  FaChartPie,
  FaCross,
  FaPhoneVolume,
  FaNetworkWired,
  FaWallet,
  FaUsers,
  FaIdCard,
} from "react-icons/fa";
import { MdCategory, MdLogout, MdOutlineMenu } from "react-icons/md";
import { PiUsersFill } from "react-icons/pi";
import { RiCloseLargeLine, RiStackFill } from "react-icons/ri";
import toast from "react-hot-toast";

function AdminNavAsideBar({ showMenus, setShowMenus }) {
  const router = useRouter();
  const pathname = usePathname();

  const { data, status } = useSession();
  const session = data?.user?.role;

  // ✅ Redirect if not admin
  useEffect(() => {
    if (status !== "loading" && (!session || session !== "admin")) {
      router.push("/admin/login");
    }
  }, [status, session, router]);

  // Show loading only while session is loading
  if (status === "loading") {
    return <LoaderEffect />;
  }

  // If not admin, don't render (redirect will happen)
  if (!session || session !== "admin") {
    return null;
  }

  const handleUserLogOut = async () => {
    await signOut({ redirect: false });
    toast.success("Logged out successfully", { duration: 1000 });
    setTimeout(() => {
      router.push("/login-register");
    }, 1200);
  };

  const asideMenus = [       //changes from /admin/dashboar to /admin
    { title: "Dashboard", path: "/admin", icon: <FaChartPie /> },
    { title: "Orders", path: "/admin/orders", icon: <FaCartArrowDown /> },
    {
      title: "Manage Categories",
      path: "/admin/manage-category",
      icon: <MdCategory />,
    },
    { title: "Products", path: "/admin/products", icon: <BsBoxSeamFill /> },
    { title: "Stock", path: "/admin/stock", icon: <RiStackFill /> },
    { title: "Users", path: "/admin/users", icon: <PiUsersFill /> },
    { title: "KYC Management", path: "/admin/kyc-management", icon: <FaIdCard /> },
    { title: "Pool Management", path: "/admin/pool-management", icon: <FaNetworkWired /> },
    { title: "Team Management", path: "/admin/team-management", icon: <FaUsers /> },
    { title: "Withdrawals", path: "/admin/pool-withdrawals", icon: <FaWallet /> },
    { title: "Contact Us", path: "/admin/contact-us", icon: <FaPhoneVolume /> },
    { title: "Banners", path: "/admin/banners", icon: <MdOutlineMenu /> },
  ];


  return (
    <aside
      className={`w-full lg:w-1/4 grow 
      sm:absolute sm:top-0 sm:left-0 lg:relative transition-all duration-300 z-40
      sm:border sm:border-slate-300/30 sm:bg-white/95 sm:backdrop-blur-sm dark:sm:bg-gray-900/95
      sm:w-80 md:w-96 lg:bg-transparent lg:border-0 lg:backdrop-blur-none
      ${
        showMenus ? "sm:-translate-x-full lg:translate-x-0" : "sm:translate-x-0"
      } `}
    >
      <div className="bg-base-100 dark:bg-gray-800 rounded-none sm:rounded-r-xl lg:rounded-box shadow-none sm:shadow-xl lg:shadow p-3 sm:p-4 h-full min-h-screen lg:min-h-auto">
        {/* Enhanced close button */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Admin Menu</h2>
          <button
            onClick={() => setShowMenus(true)}
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <RiCloseLargeLine className="text-lg" />
          </button>
        </div>

        <ul className="menu w-full space-y-2 sm:space-y-3">
          {asideMenus.map((menu, i) => (
            <li className="border-b border-slate-200 dark:border-gray-600 last:border-b-0" key={i}>
              <Link
                onClick={() => setShowMenus(true)}
                href={menu.path}
                className={`${
                  menu.path === pathname 
                    ? "bg-slate-900 dark:bg-gray-700 text-white shadow-md" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                } flex items-center gap-3 p-3 sm:p-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base`}
              >
                <i className="text-lg sm:text-xl flex-shrink-0">{menu.icon}</i> 
                <span className="truncate">{menu.title}</span>
              </Link>
            </li>
          ))}
          <li className="mt-4 sm:mt-6">
            <button
              onClick={handleUserLogOut}
              className="flex items-center justify-center gap-2 w-full rounded-lg text-white font-medium bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 p-3 sm:p-4 transition-colors text-sm sm:text-base"
            >
              <MdLogout className="text-lg" /> Logout
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default AdminNavAsideBar;
