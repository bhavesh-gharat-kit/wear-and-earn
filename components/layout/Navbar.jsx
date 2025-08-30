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
    <header id="header" className="w-full sticky top-0 z-50" data-theme="light">
      <div className="w-full mx-auto">
        {/* NAVBAR HEADER TOP (single row) */}
        <div className="navbar min-h-20 md:min-h-24 py-2 md:py-3 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 text-slate-800 shadow-sm border-b border-gray-100 gap-4 px-4 sm:px-6 md:px-8 lg:px-10">
          {/* Left: Logo */}
          <div className="navbar-start">
            <Link href={"/"}>
              <Image
                alt="brand-logo"
                src={"/images/brand-logo-png.png"}
                className="rounded-xl h-14 md:h-16 w-auto object-contain transition-opacity hover:opacity-90 drop-shadow-sm"
                width={200}
                height={200}
              />
            </Link>
          </div>

          {/* Center: Nav items (desktop) */}
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1 gap-10">
              {navMenus.map((menu, i) => (
                <li key={i} className="m-0">
                  <Link
                    style={{ backgroundColor: "transparent", color: "black" }}
                    href={menu.path}
                    className={` text-[17px] md:text-[18px] font-medium ${
                      pathname === menu.path &&
                      "text-[#007bff] border-b-2 border-[#007bff] rounded-none"
                    } flex items-center justify-center hover:text-blue-700 transition-all nav-link-hover-effect py-4 px-0 hover:bg-transparent rounded-none bg-none active:bg-none active:bg-white`}
                  >
                    <span className="text-[22px] md:text-[24px] mr-3 text-slate-600"> {menu.icon} </span>
                    <span className="capitalize"> {menu.title} </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Download, Cart, Profile, Mobile menu button */}
          <div className="navbar-end gap-2">
            <Link
              href={"#"}
              className="hidden md:flex items-center justify-center h-9 gap-1.5 bg-[#ffc107] rounded px-4 py-0.5"
            >
              <span className="max-sm:hidden">Dowload App</span>
              <i>
                <FaDownload />
              </i>
            </Link>

            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle mr-2 hover:bg-slate-100 ring-1 ring-gray-200 transition"
              >
                <div className="indicator">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {" "}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />{" "}
                  </svg>
                  <span className="badge badge-sm indicator-item rounded-full bg-blue-600 text-white">
                    {" "}
                    {addToCartList?.length}{" "}
                  </span>
                </div>
              </div>
              <div
                tabIndex={0}
                className="card card-compact dropdown-content bg-base-100 z-1 mt-3 w-52 shadow"
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
              className="btn btn-ghost btn-circle avatar hover:bg-slate-100 transition"
            >
              <div className="w-10 md:w-11 rounded-full ring-1 ring-gray-200 hover:ring-blue-300 transition">
                <span className="flex justify-center items-center h-full">
                  {" "}
                  <FaUserCog style={{ width: 24, height: 24 }} className="text-slate-600" />
                </span>
              </div>
            </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-72 p-4 shadow-lg"
              >
                <div className="p-3 text-[#e9b008] font-medium text-lg">
                  Welcome to wearearn
                  <p className="text-sm text-black font-normal mt-1">
                    Access account & manage orders
                  </p>
                </div>
                <li>
                  {!id ? (
                    <Link href={"/login-register"} className="flex items-center gap-3 py-3 px-2 text-base hover:bg-gray-100 rounded-lg">
                      <i className="text-lg">
                        <FiUser />
                      </i>
                      <span>Login</span>
                    </Link>
                  ) : (
                    <>
                      <Link href={"/account"} className="flex items-center gap-3 py-3 px-2 text-base hover:bg-gray-100 rounded-lg">
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
                    <Link href={"/login-register"} className="flex items-center gap-3 py-3 px-2 text-base hover:bg-gray-100 rounded-lg">
                      <i className="text-lg">
                        <FaUserPlus />
                      </i>
                      <span>Register</span>
                    </Link>
                  ) : (
                    <button 
                    onClick={handleUserLogOut}
                    className="flex items-center gap-3 py-3 px-2 text-base hover:bg-red-500 hover:text-white rounded-lg transition-colors w-full text-left">
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
                className="hidden lg:flex items-center gap-1.5 rounded text-white btn bg-amber-500"
              >
                <MdLogout fontSize={20} /> Logout
              </button>
            )}

            <div className="text-3xl lg:hidden block" onClick={handleSetOpenMenu}>
              <button>
                <i>
                  <MdOutlineMenuOpen />{" "}
                </i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile slide-out menu */}
        <nav className="lg:hidden shadow-sm mb-0.5 bg-white relative border-b border-gray-100">
          <div
      className={` shadow-sm justify-start transition-all duration-300 absolute right-0 z-50 px-4 sm:px-6 md:px-8 py-3 items-center text-slate-800 bg-white w-12/12 ${
              isMenuOpen ? "max-sm:right-0" : "max-sm:right-[700px]"
            }`}
          >
            <div className="block">
              <ul
        className="menu px-1 flex-col justify-start gap-4 p-0 m-0 w-full pr-4"
                onClick={handleSetOpenMenu}
              >
                {navMenus.map((menu, i) => (
                  <li key={i} className=" m-0">
                    <Link
                      style={{ backgroundColor: "transparent", color: "black" }}
                      href={menu.path}
            className={` text-[17px] md:text-[18px] font-medium ${
                        pathname === menu.path &&
                        "text-[#007bff] border-b-2 border-[#007bff] rounded-none"
            } flex items-center justify-start hover:text-blue-700 transition-all nav-link-hover-effect py-3 px-0 hover:bg-transparent rounded-none bg-none active:bg-none active:bg-white`}
                    >
            <span className="text-[20px] mr-2.5 text-slate-600"> {menu.icon} </span>
                      <span className="capitalize"> {menu.title} </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div>
                {loginSession === "user" && (
                  <button
                    onClick={handleUserLogOut}
                    className=" flex items-center gap-1.5 rounded text-white btn bg-amber-500"
                  >
                    <MdLogout fontSize={20} /> Logout
                  </button>
                )}
              </div>
            </div>
          </div>
  </nav>
      </div>
    </header>
  );
}

export default Navbar;
