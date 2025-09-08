
"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import { useState, useEffect } from "react";
import { 
  User, 
  Package, 
  Settings, 
  ShoppingCart, 
  HelpCircle,
  LogOut,
  Home
} from "lucide-react";

export default function AccountLayout({ children }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/account/profile');
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const asideMenus = [
    {
      title: "Dashboard",
      path: "/account",
      icon: <Home className="h-5 w-5" />
    },
    {
      title: "My Orders",
      path: "/account/orders",
      icon: <Package className="h-5 w-5" />
    },
    {
      title: "Cart",
      path: "/cart",
      icon: <ShoppingCart className="h-5 w-5" />
    },
    {
      title: "Account Settings",
      path: "/account/settings",
      icon: <Settings className="h-5 w-5" />
    },
    {
      title: "Help Center",
      path: "/account/help",
      icon: <HelpCircle className="h-5 w-5" />
    },
  ];

  const handleUserLogOut = async () => {
    await signOut({ redirect: false });
    toast.success("Logged out successfully", { duration: 1000 });
    setTimeout(() => {
      router.push("/login-register");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-80 w-full">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 sticky top-8">
              {/* Profile Section */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {session?.user?.fullName ? 
                      session.user.fullName.charAt(0).toUpperCase() :
                      userProfile?.fullName ? 
                      userProfile.fullName.charAt(0).toUpperCase() : 
                      session?.user?.name?.charAt(0).toUpperCase() || 
                      <User className="h-8 w-8" />
                    }
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-3 capitalize">
                  {session?.user?.fullName || userProfile?.fullName || session?.user?.name || 'User'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {userProfile?.email || session?.user?.email || 'Member'}
                </p>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-2">
                {asideMenus.map((menu, i) => {
                  const isActive = pathname === menu.path;
                  return (
                    <Link
                      key={i}
                      href={menu.path}
                      className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-r-4 border-blue-700 dark:border-blue-400"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <span className={`mr-3 ${isActive ? "text-blue-700 dark:text-blue-300" : "text-gray-400 dark:text-gray-500"}`}>
                        {menu.icon}
                      </span>
                      {menu.title}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={handleUserLogOut}
                  className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>

              {/* User Stats */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Member Since</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {userProfile?.createdAt ? 
                      new Date(userProfile.createdAt).getFullYear() : 
                      session?.user?.createdAt ? 
                      new Date(session.user.createdAt).getFullYear() : 
                      new Date().getFullYear()
                    }
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
