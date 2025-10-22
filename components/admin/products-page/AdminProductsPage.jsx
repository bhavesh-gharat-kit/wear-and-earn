"use client";

import React, { useEffect, useState } from "react";
import { BiPencil, BiTrash } from "react-icons/bi";
import { IoMdAdd } from "react-icons/io";
import { IoMdSearch } from "react-icons/io";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import PaginationComponent from "@/components/ui/PaginationComponent";

function AdminProductsPage() {
  const [allProductDetails, setAllProductDetails] = useState([]);
  const [searchProduct, setSearchProduct] = useState("");

  // pagination logic here
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPage, setRowsPage] = useState(20);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  const totalPages = Math.ceil(totalProductsCount / rowsPage);

  const handleSubmitSearchProductQuery = (e) => {
    e.preventDefault();
  };

  // FETCHING ALL THE PRODUCTS DETAILS
  const fetchAllProductsDetails = async (
    page = currentPage,
    rowsPerPage = rowsPage
  ) => {
    const skip = (page - 1) * rowsPerPage;

    try {
      const response = await axios.get(
        `/api/admin/products?limit=${rowsPerPage}&skip=${skip}`
      );
      const productDetails = response.data.products;

      setAllProductDetails(productDetails);
      setTotalProductsCount(response.data.totalCount);
    } catch (error) {
      console.log(
        "Internal Server Error While Fetching Product Details",
        error
      );
    }
  };

  // DELETING THE CATEGORY
  const handleProductDelete = async (id) => {
    try {
      const response = await axios.delete(`/api/admin/products/${id}`);
      if (response.status === 200) {
        fetchAllProductsDetails();
      }
    } catch (error) {
      console.log("Internal Server Error While Deleting Category", error);
    }
  };

  // handling confirmation for product delete
  const handleConfirmAction = (productId) => {
    toast(
      (t) => (
        <div className="space-y-3">
          <p className="font-medium">Are you sure you want to Delete?</p>

          <div className="flex justify-start items-center gap-2 flex-row-reverse">
            <button
              className="btn bg-green-600 text-white rounded-md"
              onClick={() => {
                handleProductDelete(productId);
                toast.dismiss(t.id);
              }}
            >
              Confirm
            </button>
            <button
              className="btn bg-rose-600 text-white rounded-md"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity, // Keep the toast visible until user interaction
      }
    );
  };

  // TOGGLING THE PRODUCT STATUS
  const handleProductStatusToggler = async (id) => {

    const toastId = toast.loading("Saving product status...");
    try {
      const response = await axios.patch(`/api/admin/products/${id}`);

      if (response.status === 200) {
        toast.success("Status Updated", { id: toastId, duration: 1000 });
        setTimeout(() => {
          fetchAllProductsDetails();
        }, 1200);
      }
    } catch (error) {
      console.log("Internal Server Error While Updating Status", error);
    }
  };

  useEffect(() => {
    fetchAllProductsDetails();
  }, [currentPage, rowsPage]);

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl text-blue-700 dark:text-blue-400 font-bold">Manage Products</h1>
        <Link
          href={"/admin/products/add"}
          className="flex items-center justify-center gap-2 btn btn-primary font-semibold px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          <IoMdAdd fontSize={20} />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Search - Responsive */}
      <form
        onSubmit={handleSubmitSearchProductQuery}
        className="w-full sm:w-2/3 lg:w-1/2 xl:w-5/12 p-0.5 rounded h-10 sm:h-12 flex items-center border border-gray-300 dark:border-gray-600"
        action=""
      >
        <input
          className="w-full px-3 py-2 bg-slate-200 dark:bg-gray-800 h-full rounded-l border-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
          type="search"
          placeholder="Search products..."
          onChange={(e) => setSearchProduct(e.target.value)}
          value={searchProduct}
        />
        <button
          type="submit"
          className="bg-blue-600 h-full text-white px-3 sm:px-4 cursor-pointer rounded-r border-0 hover:bg-blue-700 transition-colors"
        >
          <IoMdSearch fontSize={18} />
        </button>
      </form>

      {/* Products Table/Cards - Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          {allProductDetails
            .filter((product) =>
              product.title
                .toLowerCase()
                .includes(searchProduct.toLowerCase())
            )
            .map((product, index) => (
              <div key={product.id} className="border-b border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0].imageUrl}
                      alt={product.title}
                      width={60}
                      height={60}
                      className="w-15 h-15 rounded-md object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-15 h-15 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                      No Image
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{product.title}</h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        product.type === 'MLM' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        product.type === 'TRENDING' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {product.type}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">Stock: {product.inStock}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span>Price: ₹{product.price}</span>
                      <span>GST: {product.gst || 0}%</span>
                      <span>Shipping: ₹{product.homeDelivery || 0}</span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">MLM: ₹{product.mlmPrice || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => handleProductStatusToggler(product.id)}
                    className={`${
                      product.isActive ? "bg-green-600" : "bg-red-600"
                    } px-3 py-1 cursor-pointer rounded text-xs text-white hover:opacity-80 transition-opacity`}
                    title="Toggle status"
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </button>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/products/edit/${product.id}`}
                      className="text-white bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 text-xs flex items-center cursor-pointer transition-colors"
                    >
                      <BiPencil fontSize={16} />
                    </Link>
                    <button
                      onClick={() => handleConfirmAction(product.id)}
                      className="text-white bg-red-600 px-3 py-2 rounded hover:bg-red-700 text-xs flex items-center cursor-pointer transition-colors"
                    >
                      <BiTrash fontSize={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-indigo-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Image</th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">GST %</th>
                <th className="p-3 text-left">Shipping</th>
                <th className="p-3 text-left">MLM Price</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {allProductDetails
                .filter((product) =>
                  product.title
                    .toLowerCase()
                    .includes(searchProduct.toLowerCase())
                )
                .map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0].imageUrl}
                          alt={product.title}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-xs text-gray-500">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">{product.title}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.type === 'MLM' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        product.type === 'TRENDING' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {product.type}
                      </span>
                    </td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">{product.inStock}</td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">₹{product.price}</td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">{product.gst || 0}%</td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">₹{product.homeDelivery || 0}</td>
                    <td className="p-3">
                      <span className="font-medium text-purple-600 dark:text-purple-400">₹{product.mlmPrice || 0}</span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleProductStatusToggler(product.id)}
                        className={`${
                          product.isActive ? "bg-green-600" : "bg-red-600"
                        } px-2 py-1 cursor-pointer rounded text-xs text-white hover:opacity-80 transition-opacity`}
                        title="Toggle status"
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-3 space-x-2 flex items-center">
                      <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="text-white bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 text-xs flex items-center cursor-pointer transition-colors"
                      >
                        <BiPencil fontSize={16} />
                      </Link>
                      <button
                        onClick={() => handleConfirmAction(product.id)}
                        className="text-white bg-red-600 px-3 py-2 rounded hover:bg-red-700 text-xs flex items-center cursor-pointer transition-colors"
                      >
                        <BiTrash fontSize={16} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <PaginationComponent
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              setRowsPage={setRowsPage}
              rowsPage={rowsPage}
              totalCount={totalProductsCount}
            />
          </div>
        )}
      </div>

      
    </div>
  );
}

export default AdminProductsPage;
