"use client";

import React, { useContext, useEffect, useState } from "react";
import ProductRightContent from "./ProductRightContent";
import Image from "next/image";
import Link from "next/link";
import { 
  ShoppingCart, 
  Filter, 
  Grid3X3, 
  List, 
  ChevronDown,
  Package,
  Search,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import CreateContext from "@/components/context/createContext";
import LoaderEffect from "@/components/ui/LoaderEffect";

function ProductListingSection() {
  // destructuring the productFilters ,addToCartList, setProductList from Context API
  const { setProductList, addToCartList, productFilters, setProductFilters } =
    useContext(CreateContext);

  const [productCategory, setProductCategory] = useState([]);
  const [selectedFilterCategoryId, setSelectedFilterCategoryId] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // FETCHING ALL PRODUCTS LIST FROM DB
  const fetchProductsList = async () => {
    try {
      const query = new URLSearchParams({
        categoryId: selectedFilterCategoryId || productFilters.category || "",
        minPrice: productFilters.minPrice || "",
        maxPrice: productFilters.maxPrice || "",
        search: productFilters.search || "",
        sortBy: productFilters.sortBy || "",
      }).toString();

      const response = await axios.get(`/api/products/?${query}`);
      const productArrayData = response.data.data;
      setProductList(productArrayData);
    } catch (error) {
      console.log("Internal Server Error While Fetching The data", error);
      toast.error("Failed to fetch products. Please try again.");
    }
  };

  // USE FOR API CALL AFTER 500MS WITH DEPENDENCIES
  useEffect(() => {
    //THIS IS USED FOR PRODUCT FILTER AND USING SETTIMEOUT TO AVOID CONTINIOUS API CALL FOR FILTER(SIMPLY DEBOUNCING LIKE)
    const timeout = setTimeout(() => {
      fetchProductsList(); // your function to get filtered products
    }, 500); // wait 500ms after user stops typing

    return () => clearTimeout(timeout); // cleanup on re-render
  }, [productFilters, selectedFilterCategoryId, addToCartList]);

  // FETCH ALL CATEGORY LIST FROM DB
  const fetchAllCategoryList = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/category");
      const data = response.data.data;
      setProductCategory(data);
      setIsLoading(false);
    } catch (error) {
      console.log("Internal Server Error While Fetching the Category", error);
      toast.error("Failed to fetch categories. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetFilterCategory = (categoryId, categoryName) => {
    setSelectedCategoryName(categoryName);
    setSelectedFilterCategoryId(categoryId);
    // Clear dropdown category selection when sidebar category is selected
    setProductFilters(prev => ({ ...prev, category: "" }));
    setShowMobileFilters(false); // Close mobile filters when category is selected
  };

  const clearCategoryFilter = () => {
    setSelectedCategoryName("");
    setSelectedFilterCategoryId(null);
    // Also clear dropdown category selection
    setProductFilters(prev => ({ ...prev, category: "" }));
  };

  // USER FOR API
  useEffect(() => {
    fetchAllCategoryList();
  }, []);

  if (isLoading) {
    return <LoaderEffect />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* Desktop Sidebar - Categories */}
      <aside className="hidden lg:block lg:w-80 lg:min-w-80 lg:flex-shrink-0">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-8 w-full">
          {/* Quick Cart Access */}
          <Link
            href="/cart"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors mb-6 font-medium w-full"
          >
            <ShoppingCart className="h-5 w-5" />
            View Cart ({addToCartList.length})
          </Link>

          {/* Categories Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Categories
            </h2>
            {selectedCategoryName && (
              <button
                onClick={clearCategoryFilter}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>

          {/* Selected Category Badge */}
          {selectedCategoryName && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                Filtered by: {selectedCategoryName}
              </p>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {productCategory.map((category, i) => {
              const isSelected = category.name.toLowerCase() === selectedCategoryName?.toLowerCase();
              return (
                <button
                  key={i}
                  onClick={() => handleSetFilterCategory(category.id, category.name)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 shadow-sm' : 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {category.products[0]?.mainImage ? (
                      <Image
                        width={56}
                        height={56}
                        className="h-14 w-14 object-cover rounded-xl"
                        src={category.products[0].mainImage}
                        alt={category.name}
                      />
                    ) : (
                      <div className="h-14 w-14 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                        <Package className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h3 className={`font-semibold text-base ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'} truncate`}>
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {category.productCount || 0} products
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg shadow-sm text-gray-700 dark:text-gray-300"
        >
          <Filter className="h-5 w-5" />
          Filters & Categories
          <ChevronDown className={`h-4 w-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Mobile Categories Dropdown */}
        {showMobileFilters && (
          <div className="mt-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Categories</h3>
              {selectedCategoryName && (
                <button
                  onClick={clearCategoryFilter}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
              {productCategory.map((category, i) => {
                const isSelected = category.name.toLowerCase() === selectedCategoryName?.toLowerCase();
                return (
                  <button
                    key={i}
                    onClick={() => handleSetFilterCategory(category.id, category.name)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800' : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {category.products[0]?.mainImage ? (
                      <Image
                        width={40}
                        height={40}
                        className="h-10 w-10 object-cover rounded-lg flex-shrink-0"
                        src={category.products[0].mainImage}
                        alt={category.name}
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <span className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'} truncate block`}>
                        {category.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {category.productCount || 0} items
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {/* View Toggle & Product Count */}
        <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400 font-medium">View:</span>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <Link
            href="/cart"
            className="lg:hidden flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart ({addToCartList.length})
          </Link>
        </div>

        {/* Product Content */}
        <ProductRightContent
          setSelectedCategoryName={setSelectedCategoryName}
          setSelectedFilterCategoryId={setSelectedFilterCategoryId}
          selectedCategoryName={selectedCategoryName}
          viewMode={viewMode}
        />
      </main>
    </div>
  );
}

export default ProductListingSection;
