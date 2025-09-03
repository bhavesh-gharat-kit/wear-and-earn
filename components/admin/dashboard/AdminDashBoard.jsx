"use client";

import LoaderEffect from "@/components/ui/LoaderEffect";
import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

function AdminDashBoard() {
  const [allDatabaseDetails, setAllDatabaseDetails] = useState(null);

  const fetchAllDatabasesDetails = async () => {
    try {
      const response = await axios.get("/api/admin/dashboard");
      if (response.status === 200) {
        // toast.success("Data Fetched Successfully");
        setAllDatabaseDetails(response.data);
        return;
      }
    } catch (error) {
      console.log("Internal Server Error While Fetching Details");
      toast.error("Internal Server Error While Fetching Details");
    }
  };

  useEffect(() => {
    fetchAllDatabasesDetails();
  }, []);

  if (allDatabaseDetails === null || !allDatabaseDetails) {
    return <LoaderEffect />;
  }

  const { totalInStockQuantity, totalOrders, totalProducts, totalUsers, mlmStats } =
    allDatabaseDetails;

  return (
    <div className="bg-white min-h-screen text-gray-800 mx-auto">
      <section>
        <section className="min-h-screen bg-gray-50 p-6 text-gray-800 font-sans">
          {/* Header */}
          <h1 className="text-4xl font-bold mb-8 text-blue-700">
            Welcome Admin,
          </h1>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/* Orders */}
            <div className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition group border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-blue-600">Total Orders</h2>
                  <p className="text-xl md:text-2xl font-bold mt-2 text-blue-900">
                    {" "}
                    {totalOrders}{" "}
                  </p>
                </div>
                <svg
                  className="w-10 h-10 text-blue-500 group-hover:scale-110 transition"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h18v4H3V3zM3 7h18v4H3V7zM3 11h18v4H3v-4z"
                  />
                </svg>
              </div>
            </div>

            {/* Users */}
            <div className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition group border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-blue-600">Total Users</h2>
                  <p className="text-xl md:text-2xl font-bold mt-2 text-blue-900">
                    {totalUsers}
                  </p>
                </div>
                <svg
                  className="w-10 h-10 text-blue-500 group-hover:scale-110 transition"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a4 4 0 00-5-4M9 20H4v-2a4 4 0 015-4M12 4a4 4 0 100 8 4 4 0 000-8z"
                  />
                </svg>
              </div>
            </div>

            {/* Products */}
            <div className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition group border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-blue-600">Products</h2>
                  <p className="text-xl md:text-2xl font-bold mt-2 text-blue-900">
                    {totalProducts}
                  </p>
                </div>
                <svg
                  className="w-10 h-10 text-blue-500 group-hover:scale-110 transition"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6M4 17h16M4 21h16"
                  />
                </svg>
              </div>
            </div>

            {/* In Stock */}
            <div className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition group border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-blue-600">In Stock</h2>
                  <p className="text-xl md:text-2xl font-bold mt-2 text-blue-900">
                    {totalInStockQuantity}
                  </p>
                </div>
                <svg
                  className="w-10 h-10 text-blue-500 group-hover:scale-110 transition"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* MLM Summary Cards */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-green-700">MLM Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Active MLM Users */}
              <div className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition group border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-green-600">Active MLM Users</h2>
                    <p className="text-xl md:text-2xl font-bold mt-2 text-green-900">
                      {mlmStats?.activeMLMUsers || 0}
                    </p>
                  </div>
                  <svg
                    className="w-10 h-10 text-green-500 group-hover:scale-110 transition"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a4 4 0 00-5-4M9 20H4v-2a4 4 0 515-4M12 4a4 4 0 100 8 4 4 0 000-8z"
                    />
                  </svg>
                </div>
              </div>

              {/* Total Commissions */}
              <div className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition group border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-green-600">Total Commissions</h2>
                    <p className="text-xl md:text-2xl font-bold mt-2 text-green-900">
                      ₹{mlmStats?.totalCommissionAmount?.toLocaleString() || 0}
                    </p>
                  </div>
                  <svg
                    className="w-10 h-10 text-green-500 group-hover:scale-110 transition"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>

              {/* Total Referrals */}
              <div className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition group border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-green-600">Users with Referrals</h2>
                    <p className="text-xl md:text-2xl font-bold mt-2 text-green-900">
                      {mlmStats?.totalReferrals || 0}
                    </p>
                  </div>
                  <svg
                    className="w-10 h-10 text-green-500 group-hover:scale-110 transition"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Link
                href="/admin/products/add"
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl shadow hover:shadow-md transition"
              >
                Add New Product
              </Link>
              <Link
                href="/admin/orders"
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl shadow hover:shadow-md transition"
              >
                View Orders
              </Link>
              <Link
                href="/admin/stock"
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl shadow hover:shadow-md transition"
              >
                Manage Stock
              </Link>
              <Link
                href="/admin/mlm-panel"
                className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl shadow hover:shadow-md transition"
              >
                MLM Management
              </Link>
            </div>
          </div>

        </section>
      </section>
      <div className="w-full max-w-screen-xl mx-auto px-4 py-6">
        <hr className="mb-4 border-gray-300" />

        {/* Copyright */}
        <p className="text-center text-sm text-gray-600">
          © 2025{" "}
          <a href="#" className="text-blue-600 hover:underline font-medium">
            wearnearn
          </a>
          . All rights reserved.
        </p>

        {/* Designed by */}
        <p className="text-center text-sm text-gray-500 mt-1">
          Designed by{" "}
          <a href="#" className="text-green-600 hover:underline font-medium">
            KumarInfotech
          </a>
        </p>
      </div>
      
    </div>
  );
}

export default AdminDashBoard;
