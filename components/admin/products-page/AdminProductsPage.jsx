"use client";

import React, { useEffect, useState } from "react";
import { BiPencil, BiTrash } from "react-icons/bi";
import { IoMdAdd } from "react-icons/io";
import { IoMdSearch } from "react-icons/io";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import PaginationComponent from "@/components/ui/PaginationComponent";

function AdminProductsPage() {
  const [allProductDetails, setAllProductDetails] = useState([]);
  const [searchProduct, setSearchProduct] = useState("");

  // pagination logic here
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPage, setRowsPage] = useState(5);
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
    <div className="space-y-6">
      {/* header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl text-blue-700 font-bold">Manage Products</h1>
        <Link
          href={"/admin/products/add"}
          className="flex items-center gap-2 btn btn-primary font-semibold"
        >
          <i className="text-xl">
            <IoMdAdd fontSize={22} />
          </i>
          <span>Add Product</span>
        </Link>
      </div>

      {/* Search */}

      <form
        onSubmit={handleSubmitSearchProductQuery}
        className="w-5/12 p-0.5 rounded h-10 flex items-center"
        action=""
      >
        <input
          className=" w-full px-3 py-1 bg-slate-200 h-full rounded outline-none"
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

      <div className="overflow-x-auto rounded-lg shadow bg-white py-4 ">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-indigo-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">price</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allProductDetails
              .filter((product) =>
                product.title
                  .toLowerCase()
                  .includes(searchProduct.toLowerCase())
              )
              .map((product, index) => (
                <tr key={product.id}>
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{product.title}</td>
                  <td className="p-3">{product.inStock}</td>
                  <td className="p-3">₹{product.price}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleProductStatusToggler(product.id)}
                      className={` ${
                        product.isActive ? "bg-green-700" : "bg-red-700"
                      } px-2 py-1 cursor-pointer rounded text-xs  text-white`}
                      title="toggle status"
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-3 space-x-2 flex items-center">
                    <Link
                      href={`/admin/products/edit/${product.id}`}
                      className="text-white bg-indigo-600 px-3 py-2 rounded hover:bg-indigo-700 text-xs flex items-center cursor-pointer "
                    >
                      <BiPencil fontSize={16} />
                    </Link>
                    <button
                      onClick={() => handleConfirmAction(product.id)}
                      className="text-white bg-red-600 px-3 py-2 rounded hover:bg-red-700 text-xs flex items-center cursor-pointer "
                    >
                      <BiTrash fontSize={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <PaginationComponent
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      </div>

      
    </div>
  );
}

export default AdminProductsPage;
