"use client";

import React, { useContext, useEffect, useState } from "react";
import {
  Search,
  IndianRupee,
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
  Package,
  ShoppingBag
} from "lucide-react";
import ProductCard from "../product-card/ProductCard";
import axios from "axios";
import CreateContext from "@/components/context/createContext";
import LoaderEffect from "@/components/ui/LoaderEffect";

function ProductRightContent({setSelectedFilterCategoryId, setSelectedCategoryName, selectedCategoryName, viewMode = 'grid'}){

  // DESTRUCTURING THE PRODUCTLIST,PRODUCTFILTERS,SETPRODUCTFILTERS FROM CONTEXT API
  const { productList, productFilters, setProductFilters } = useContext(CreateContext);
  
  const [categories, setCategories] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch categories for the dynamic dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/category");
        setCategories(response.data.data);
      } catch (error) {
        console.log("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // HANDLING PRODUCT FILTERS INPUT
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // If category is selected from dropdown, clear sidebar selection
    if (name === 'category') {
      setSelectedFilterCategoryId(null);
      setSelectedCategoryName("");
    }
  };

  // ḤANDLING PRODUCT FILTER ON SUBMIT
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsFilterOpen(false);
  };

  // HANDLE TO CLEAR THE PREVIOUS FILTERS VALUES
  const handleReset = () => {
    setProductFilters({
      search: "",
      minPrice: "",
      maxPrice: "",
      category: "",
      sortBy: "",
    });
    // Also clear sidebar category selection
    if (setSelectedFilterCategoryId && setSelectedCategoryName) {
      setSelectedFilterCategoryId(null);
      setSelectedCategoryName("");
    }
  };

  if (productList === null) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoaderEffect />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile-Enhanced Filter Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Mobile-Optimized Search Bar */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                name="search"
                value={productFilters.search}
                onChange={handleChange}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 text-base sm:text-lg border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="Search products..."
              />
            </div>
          </div>

          {/* Secondary Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Price Range (spans 2 cols on desktop for wider inputs) */}
            <div className="grid grid-cols-2 gap-2 lg:col-span-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min Price</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                  <input
                    type="number"
                    name="minPrice"
                    value={productFilters.minPrice}
                    onChange={handleChange}
                    className="w-full pl-8 pr-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max Price</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                  <input
                    type="number"
                    name="maxPrice"
                    value={productFilters.maxPrice}
                    onChange={handleChange}
                    className="w-full pl-8 pr-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    placeholder="∞"
                    min="0"
                  />
                </div>
              </div>
            </div>
            {/* Desktop-only Clear Filters button */}
            <div className="hidden lg:flex items-center justify-end lg:mt-3.5">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <X className="h-6 w-4 mr-1.5" />
                <span className="hidden xl:inline">Clear Filters</span>
              </button>
            </div>

            {/*
            Category Dropdown
            <div>...</div>

            Sort Dropdown
            <div>...</div>

            Clear Button
            <div className="flex items-end">...</div>
            */}
          </div>
        </div>

        {/* Active Filters Display */}
        {(productFilters.search || productFilters.minPrice || productFilters.maxPrice || productFilters.category || selectedCategoryName || productFilters.sortBy) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Active filters:</span>
              {productFilters.search && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: {productFilters.search}
                </span>
              )}
              {productFilters.minPrice && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Min: ₹{productFilters.minPrice}
                </span>
              )}
              {productFilters.maxPrice && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Max: ₹{productFilters.maxPrice}
                </span>
              )}
              {(productFilters.category || selectedCategoryName) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Category: {selectedCategoryName || categories.find(c => c.id.toString() === productFilters.category)?.name}
                </span>
              )}
              {productFilters.sortBy && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Sort: {productFilters.sortBy.replace('-', ' ')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile-Optimized Results Header */}
  <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 sm:bg-white sm:dark:bg-gray-900 sm:p-4 sm:rounded-lg sm:shadow-sm sm:border sm:border-gray-200 sm:dark:border-gray-700">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Products</h2>
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">
          {productList.length} items found
        </span>
      </div>

      {/* MOBILE-ENHANCED PRODUCT LISTING SECTION */}
      {productList.length <= 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 md:p-12 text-center">
          <Package className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">Try adjusting your filters or search terms</p>
          <button
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base active:scale-95"
          >
            <X className="h-4 w-4 mr-2" />
            Clear all filters
          </button>
        </div>
      ) : (
        <div className={`grid gap-3 sm:gap-4 md:gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        }`}>
          {productList.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              variant={viewMode === 'grid' ? 'grid' : 'list'} 
            />
          ))}
        </div>
      )}

      {/* Mobile-Optimized Load More Button */}
      {productList.length > 0 && productList.length >= 20 && (
        <div className="text-center mt-6 sm:mt-8">
          <button className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium active:scale-95">
            Load More Products
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductRightContent;
