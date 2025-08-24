"use client";

import ProductListingSection from "@/components/product/ProductListingSection";
import React from "react";
import { ShoppingBag, Filter, Grid, List } from "lucide-react";
import Link from "next/link";

function ProductPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Hero Section */}
      <div className="bg-gradient-to-r from-[#e0e7ff] to-[#f3e8ff] text-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-2 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Our Products
              </h1>
              <p className="text-lg text-blue-900 max-w-2xl">
                Discover our curated collection of premium products designed for modern lifestyle
              </p>
            </div>
            <div className="flex items-center space-x-2 text-blue-900">
              <Link href="/" className="hover:text-white transition-colors cursor-pointer">Home</Link>
              <span>/</span>
              <span className="text-blue-900 font-medium">Products</span>
            </div>
          </div>
          
          
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductListingSection />
      </div>
    </div>
  );
}

export default ProductPage;
