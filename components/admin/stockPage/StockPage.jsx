"use client";

import React, { useEffect, useState } from "react";
import { BiPencil, BiTrash } from "react-icons/bi";
import { IoMdAdd } from "react-icons/io";
import { IoMdSearch } from "react-icons/io";
import axios from "axios";
import toast from "react-hot-toast";
import AddStockModal from "./add-stock-modal/AddStockModal";
import ReduceStockModal from "./reduce-stock-modal/ReduceStockModal";
import LoaderEffect from "@/components/ui/LoaderEffect";
import PaginationComponent from "@/components/ui/PaginationComponent";

function StockPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [productsStockDetails, setProductsStockDetails] = useState([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showReduceStockModal, setShowReduceStockModal] = useState(false);

  // pagination logic here
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPage, setRowsPage] = useState(20);
  const [totalStocksCount, setTotalStocksCount] = useState(0);
  const totalPages = Math.ceil(totalStocksCount / rowsPage);

  const handleSubmitSearchProductQuery = async (e) => {
    e.preventDefault();
  };

  // FETCHING ALL THE PRODUCTS DETAILS
  const fetchproductsStockDetails = async (
    page = currentPage,
    rowsPerPage = rowsPage
  ) => {
    // pagination offset
    const skip = (page - 1) * rowsPerPage;

    try {
      const response = await axios.get(
        `/api/admin/stocks?limit=${rowsPerPage}&skip=${skip}`
      );
      const productsStockDet = response.data.data;
      setProductsStockDetails(productsStockDet);
      setTotalStocksCount(response.data.totalCount);
    } catch (error) {
      setError(true);
      console.log(
        "Internal Server Error While Fetching Products Stocks Details",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchproductsStockDetails();
  }, [currentPage, rowsPage]);

  if (isLoading) {
    return <LoaderEffect />;
  }

  if (error) {
    return <h1>Internal Error</h1>;
  }

  if (productsStockDetails.length <= 0) {
    return <h1>Not Found</h1>;
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl text-blue-700 dark:text-blue-400 font-bold">Stock Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddStockModal(true)}
            className="flex items-center gap-2 btn btn-primary font-semibold border border-blue-600"
          >
            <i className="text-xl">
              <IoMdAdd fontSize={22} />
            </i>
            <span>Add Stock</span>
          </button>
          <button
            onClick={() => setShowReduceStockModal(true)}
            className="flex items-center gap-2 btn btn-secondary font-semibold bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            <i className="text-xl">
              <BiTrash fontSize={22} />
            </i>
            <span>Reduce Stock</span>
          </button>
        </div>
      </div>

      {/* Search */}

      <form
        onSubmit={handleSubmitSearchProductQuery}
        className="w-5/12 p-0.5 rounded h-10 flex items-center"
        action=""
      >
        <input
          className="w-full px-3 py-1 bg-slate-200 dark:bg-gray-700 dark:text-white h-full rounded outline-none"
          type="search"
          placeholder="search category..."
          onChange={(e) => setSearchProduct(e.target.value)}
          value={searchProduct}
        />
        <button
          type="submit"
          className="bg-primary h-full text-white px-2 cursor-pointer rounded"
        >
          <IoMdSearch fontSize={20} />
        </button>
      </form>

      {/* Category table */}

      <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800 py-4">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
          <thead className="bg-indigo-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Stock</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600 text-gray-900 dark:text-gray-100">
            {productsStockDetails
              .filter((product) =>
                product.title
                  .toLowerCase()
                  .includes(searchProduct.toLowerCase())
              )
              .map((product, index) => (
                <tr key={product.id}>
                  <td className="p-3"> {index + 1} </td>
                  <td className="p-3"> {product.title} </td>
                  <td className="p-3"> {product.inStock} </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* PAGINATION COMPONENT START*/}
        <PaginationComponent
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
        {/* PAGINATION COMPONENT END*/}
      </div>
      {showAddStockModal && (
        <AddStockModal
          fetchproductsStockDetails={fetchproductsStockDetails}
          productsStockDetails={productsStockDetails}
          onClose={() => setShowAddStockModal(false)}
        />
      )}
      {showReduceStockModal && (
        <ReduceStockModal
          fetchproductsStockDetails={fetchproductsStockDetails}
          productsStockDetails={productsStockDetails}
          onClose={() => setShowReduceStockModal(false)}
        />
      )}
      
    </div>
  );
}

export default StockPage;
