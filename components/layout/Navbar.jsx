"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import { GiCardboardBox } from "react-icons/gi";
import { FaBars, FaHome, FaUserPlus } from "react-icons/fa";
import { BsExclamationCircleFill } from "react-icons/bs";
import { IoLogOut, IoMail } from "react-icons/io5";
import { FaUserCog } from "react-icons/fa";
import { IoLogIn } from "react-icons/io5";
import { IoMdLogOut } from "react-icons/io";
import { FaDownload } from "react-icons/fa6";
import { MdAccountCircle, MdLogout, MdOutlineMenuOpen } from "react-icons/md";
import { FiUser } from "react-icons/fi";
import { FiUserPlus } from "react-icons/fi";
import PWAInstallButton from "../PWAInstallButton";
import "./navbar.css";

import { usePathname, useRouter } from "next/navigation";
import CreateContext from "../context/createContext";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";

function Navbar() {
  const [loginSession, setLoginSession] = useState(null);
  const { data } = useSession();
  const id = data?.user?.id;
  const session = data?.user?.role;

  useEffect(() => {
    setLoginSession(session);
  }, [session]);

  // Navigation (center) — login/account removed; use profile icon only
  const navMenus = [
  { title: "home", path: "/", icon: <FaHome /> },
    { title: "our product", path: "/products", icon: <GiCardboardBox /> },
    { title: "about-us", path: "/about-us", icon: <BsExclamationCircleFill /> },
    { title: "contact-us", path: "/contact-us", icon: <IoMail /> },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { addToCartList, setAddtoCartList } = useContext(CreateContext);
  const pathname = usePathname();

  const subTotal =
    addToCartList.length >= 1
      ? addToCartList.reduce(
          (result, items) =>
            result + items.product.sellingPrice * items.quantity,
          0
        )
      : 0;

  const handleSetOpenMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const router = useRouter();

  const handleUserLogOut = async () => {
    await signOut({ redirect: false });
    toast.success("Log Out Successfully", { duration: 1000 });
    setTimeout(() => {
      router.push("/login-register");
    }, 1200);
    location.href = location.href;
  };

  return (
  <header id="header" className="w-full sticky top-0 z-50 shadow-md" data-theme="light">
      <div className="w-full mx-auto">
        {/* NAVBAR HEADER TOP (single row) */}
  <div className="navbar min-h-14 sm:min-h-16 md:min-h-20 lg:min-h-24 py-2 sm:py-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-gray-900/90 text-slate-800 dark:text-gray-100 border-b border-gray-200/30 dark:border-gray-700/30 shadow-sm gap-1 sm:gap-2 md:gap-4 px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 justify-between">
          {/* Left: Logo */}
          <div className="navbar-start flex-shrink-0">
            <Link href={"/"} className="group">
              <Image
                alt="brand-logo"
                src={"/images/brand-logo.png"}
                className="rounded-lg sm:rounded-xl h-10 xs:h-11 sm:h-12 md:h-14 lg:h-16 w-auto object-contain transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-md"
                width={200}
                height={200}
                priority
              />
            </Link>
          </div>

          {/* Center: Nav items (desktop) */}
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1 gap-10" style={{ display: 'flex', flexDirection: 'row' }}>
              {navMenus.map((menu, i) => (
                <li key={i} className="m-0" style={{ display: 'inline-flex' }}>
                  <Link
                    style={{ backgroundColor: "transparent" }}
                    href={menu.path}
                    className={` text-[17px] md:text-[18px] font-medium ${
                      pathname === menu.path &&
                      "text-[#007bff] dark:text-yellow-400 border-b-2 border-[#007bff] dark:border-yellow-400 rounded-none"
                    } flex items-center justify-center hover:text-blue-700 dark:hover:text-yellow-400 transition-all nav-link-hover-effect py-4 px-0 hover:bg-transparent rounded-none bg-none active:bg-none active:bg-white dark:active:bg-gray-900`}
                  >
                    <span className="text-[22px] md:text-[24px] mr-3 text-slate-600 dark:text-gray-200"> {menu.icon} </span>
                    <span className="capitalize"> {menu.title} </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Download, Cart, Profile, Mobile menu button */}
          <div className="navbar-end gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>

            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle mr-1 sm:mr-2 hover:bg-slate-100 dark:hover:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 transition-all p-1 sm:p-2"
              >
                <div className="indicator">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="badge badge-xs sm:badge-sm indicator-item rounded-full bg-blue-600 text-white text-xs font-medium min-h-4 h-4 sm:min-h-5 sm:h-5">
                    {addToCartList?.length}
                  </span>
                </div>
              </div>
              <div
                tabIndex={0}
                className="card card-compact dropdown-content bg-base-100 dark:bg-gray-900 z-1 mt-3 w-52 shadow"
              >
                <div className="card-body">
                  <span className="text-lg font-bold">
                    {addToCartList?.length} Items
                  </span>
                  <span className="text-info">
                    Subtotal: ₹{subTotal.toLocaleString("en-IN")} {" "}
                  </span>
                  <div className="card-actions">
                    <Link
                      href={"/cart"}
                      className="btn btn-primary btn-block"
                    >
                      View cart
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar hover:bg-slate-100 dark:hover:bg-gray-800 transition-all p-1 sm:p-2"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-full ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-blue-300 dark:hover:ring-yellow-400 transition-all">
                <span className="flex justify-center items-center h-full">
                  <FaUserCog className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-slate-600 dark:text-gray-200" />
                </span>
              </div>
            </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 dark:bg-gray-900 rounded-box z-1 mt-3 w-72 p-4 shadow-lg"
              >
                <div className="p-3 text-[#e9b008] dark:text-yellow-400 font-medium text-lg">
                  Welcome to wearearn
                  <p className="text-sm text-black dark:text-gray-200 font-normal mt-1">
                    Access account & manage orders
                  </p>
                </div>
                <li>
                  {!id ? (
                    <Link href={"/login-register"} className="flex items-center gap-3 py-3 px-2 text-base hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                      <i className="text-lg">
                        <FiUser />
                      </i>
                      <span>Login</span>
                    </Link>
                  ) : (
                    <>
                      <Link href={"/account"} className="flex items-center gap-3 py-3 px-2 text-base hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <i className="text-lg">
                          <FiUser />
                        </i>
                        <span>My Account</span>
                      </Link>
                    </>
                  )}
                </li>
                <li>
                  {!id ? (
                    <Link href={"/login-register"} className="flex items-center gap-3 py-3 px-2 text-base hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                      <i className="text-lg">
                        <FaUserPlus />
                      </i>
                      <span>Register</span>
                    </Link>
                  ) : (
                    <button 
                    onClick={handleUserLogOut}
                    className="flex items-center gap-3 py-3 px-2 text-base hover:bg-red-500 hover:text-white dark:hover:bg-red-600 rounded-lg transition-colors w-full text-left">
                      <i className="text-lg">
                        <IoLogOut />
                      </i>
                      <span>Logout</span>
                    </button>
                  )}
                </li>
              </ul>
              </div>

            {loginSession === "user" && (
              <button
                onClick={handleUserLogOut}
                className="hidden lg:flex items-center gap-1.5 rounded text-white btn bg-amber-500 dark:bg-yellow-500 hover:bg-amber-600 dark:hover:bg-yellow-400 transition-colors"
              >
                <MdLogout fontSize={20} /> Logout
              </button>
            )}

            <div className="lg:hidden block" onClick={handleSetOpenMenu}>
              <button className="btn btn-ghost btn-circle p-1 sm:p-2 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all">
                <MdOutlineMenuOpen className="text-2xl sm:text-3xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile slide-out menu */}
  <nav className="lg:hidden relative">
          <div
      className={`shadow-lg justify-start transition-all duration-300 ease-in-out absolute right-0 z-50 px-4 sm:px-6 py-4 sm:py-6 text-slate-800 dark:text-gray-100 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-l border-gray-200 dark:border-gray-700 min-h-screen w-80 max-w-[85vw] ${
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Close button */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Menu</h3>
              <button 
                onClick={handleSetOpenMenu}
                className="btn btn-ghost btn-sm btn-circle hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="block">
              <ul className="menu flex-col justify-start gap-2 p-0 m-0 w-full">
                {navMenus.map((menu, i) => (
                  <li key={i} className="m-0 w-full">
                    <Link
                      href={menu.path}
                      onClick={handleSetOpenMenu}
            className={`text-base font-medium w-full ${
                        pathname === menu.path 
                        ? "text-blue-600 dark:text-yellow-400 bg-blue-50 dark:bg-yellow-400/10 border-r-2 border-blue-600 dark:border-yellow-400" 
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            } flex items-center justify-start transition-all py-3 px-4 rounded-lg`}
                    >
            <span className="text-lg mr-3 flex-shrink-0"> {menu.icon} </span>
                      <span className="capitalize font-medium"> {menu.title} </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Mobile-specific actions */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <div className="block sm:hidden">
                  <PWAInstallButton />
                </div>
                
                {loginSession === "user" && (
                  <button
                    onClick={handleUserLogOut}
                    className="flex items-center gap-2 rounded text-white btn bg-amber-500 dark:bg-yellow-500 hover:bg-amber-600 dark:hover:bg-yellow-400 transition-colors w-full justify-center"
                  >
                    <MdLogout fontSize={18} /> Logout
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile menu overlay */}
          {isMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={handleSetOpenMenu}
            />
          )}
  </nav>
      </div>
    </header>
  );
}

export default Navbar;
