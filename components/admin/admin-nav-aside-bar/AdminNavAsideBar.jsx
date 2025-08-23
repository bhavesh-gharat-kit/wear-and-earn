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
    { title: "MLM Management", path: "/admin/mlm-panel", icon: <FaNetworkWired /> },
    { title: "Contact Us", path: "/admin/contact-us", icon: <FaPhoneVolume /> },
    { title: "Banners", path: "/admin/banners", icon: <MdOutlineMenu /> },
  ];


  return (
    <aside
      className={`lg:w-1/4 w-full grow 
      max-sm:absolute max-sm:top-0 max-sm:left-0 transition-all duration-300
      max-sm:border max-sm:border-slate-300/30 
      max-sm:w-10/12 
      ${
        showMenus ? "max-sm:-translate-x-[100%]" : "max-sm:-translate-x-[0%] "
      } `}
    >
      <div className="bg-base-100 rounded-box shadow p-4 h-full ">
        {/* close btn on screeen start */}
        <button
          onClick={() => setShowMenus(true)}
          className="w-fit ml-auto p-2 bg-slate-100 z-50 hidden max-sm:flex"
        >
          <i>
            <RiCloseLargeLine />
          </i>
        </button>
        {/* close btn on screeen end */}

        <ul className="menu w-full space-y-3.5">
          {asideMenus.map((menu, i) => (
            <li className="border-b border-slate-200" key={i}>
              <Link
                onClick={() => setShowMenus(true)}
                href={menu.path}
                className={`${
                  menu.path === pathname ? "bg-slate-900 text-white" : ""
                } p-3`}
              >
                <i className="text-xl">{menu.icon}</i> {menu.title}
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={handleUserLogOut}
              className="flex items-center gap-1.5 rounded text-white btn bg-amber-500"
            >
              <MdLogout fontSize={20} /> Logout
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default AdminNavAsideBar;
