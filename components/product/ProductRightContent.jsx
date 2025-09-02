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
      {/* Enhanced Filter Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
        <div className="space-y-4">
          {/* Search Bar - Full Width and Prominent */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
              <input
                type="text"
                name="search"
                value={productFilters.search}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="Search for products, brands, categories..."
              />
            </div>
          </div>

          {/* Secondary Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Price Range */}
            <div className="grid grid-cols-2 gap-2">
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

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                name="category"
                value={productFilters.category}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sort by</label>
              <select
                name="sortBy"
                value={productFilters.sortBy}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">Default</option>
                <option value="name">Name A-Z</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {/* Clear Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleReset}
                className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            </div>
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

      {/* Results Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Products</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            {productList.length} items found
          </span>
        </div>
      </div>

      {/* PRODUCT LISTING SECTION */}
      {productList.length <= 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filters or search terms</p>
          <button
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Clear all filters
          </button>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
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

      {/* Load More Button (if pagination is needed) */}
      {productList.length > 0 && productList.length >= 20 && (
        <div className="text-center mt-8">
          <button className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Load More Products
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductRightContent;
