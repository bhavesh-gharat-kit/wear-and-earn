"use client";

import React, { useEffect, useState } from "react";
import { BiPencil, BiTrash } from "react-icons/bi";
import { IoMdAdd } from "react-icons/io";
import { IoMdSearch } from "react-icons/io";
import ManageCategoryModal from "./ManageCategoryModal";
import axios from "axios";
import toast from "react-hot-toast";
import PaginationComponent from "@/components/ui/PaginationComponent";
import LoaderEffect from "@/components/ui/LoaderEffect";

function AdminManageCategoryPage() {
  const [searchCategory, setSearchCategory] = useState("");
  const [categories, setCategories] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  // pagination logic here
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPage, setRowsPage] = useState(20);
  const [totalCategoriesCount, setTotalCategoriesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const totalPages = Math.ceil(totalCategoriesCount / rowsPage);

  const openAddModal = () => {
    console.log("openAddModal called");
    setEditData(null);
    setShowModal(true);
    console.log("Modal should be showing, showModal:", true);
  };

  const openEditModal = (category) => {
    setEditData(category);
    setShowModal(true);
  };

  const handleSearchCategory = (e) => {
    e.preventDefault();
  };

  // FETCHING ALL THE CATEGORIES DETAILS
  const fetchAllCategoryDetails = async (
    page = currentPage,
    rowsPerPage = rowsPage
  ) => {
    try {
      setIsLoading(true);
      const skip = (page - 1) * rowsPerPage;

      const response = await axios.get(
        `/api/admin/manage-category?limit=${rowsPerPage}&skip=${skip}`
      );
      const categoriesDetails = response.data.response;

      setTotalCategoriesCount(response.data.totalCount);
      setCategories(categoriesDetails);
      setIsLoading(false);
    } catch (error) {
      console.log(
        "Internal Server Error While Fetching Category Details",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  // DELETING THE CATEGORY
  const handleCategoryDelete = async (id) => {
    try {
      const response = await axios.delete(`/api/admin/manage-category/${id}`);
      if (response.status === 200) {
        fetchAllCategoryDetails();
      }
    } catch (error) {
      console.log("Internal Server Error While Deleting Category", error);
    }
  };

  // TOGGLING THE CATEGORY STATUS
  const handleToggleCategoryStatus = async (id) => {
    const toastId = toast.loading("Saving category status...");

    try {
      const response = await axios.patch(`/api/admin/manage-category/${id}`);

      if (response.status === 200) {
        toast.success("Status Updated", { id: toastId, duration: 1000 });
        setTimeout(() => {
          fetchAllCategoryDetails();
        }, 1200);
      }
    } catch (error) {
      console.log("Internal Server Error While Updating Status", error);
      toast.error("Server error", { id: toastId });
    }
  };

  useEffect(() => {
    fetchAllCategoryDetails();
  }, [currentPage, rowsPage]);


  if(isLoading){
    return <LoaderEffect/>
  }

  return (
    <div className="space-y-6">
      {/* ADD CATEGORY POP UP MODAL */}
      {showModal && (
        <ManageCategoryModal
          mode={editData ? "edit" : "add"}
          defaultValues={editData || { id: "", name: "", description: "" }}
          onClose={() => setShowModal(false)}
          fetchAllCategoryDetails={fetchAllCategoryDetails}
        />
      )}
      {/* header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl text-blue-700 font-bold">Manage Categories</h1>
        <button
          onClick={() => {
            console.log("Add Category button clicked");
            openAddModal();
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition-colors"
        >
          <IoMdAdd fontSize={22} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search */}

      <form
        onSubmit={handleSearchCategory}
        className="w-5/12 p-0.5 rounded h-10 flex items-center border border-gray-300 dark:border-gray-600"
        action=""
      >
        <input
          onChange={(e) => setSearchCategory(e.target.value)}
          value={searchCategory}
          className="w-full px-3 py-1 bg-slate-200 dark:bg-gray-800 h-full rounded-l border-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          type="search"
          placeholder="search category..."
        />
        <button
          type="submit"
          className="bg-primary h-full text-white px-2 cursor-pointer rounded-r border-0"
        >
          <IoMdSearch fontSize={20} />
        </button>
      </form>

      {/* Category table */}

  <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-900 py-4">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-indigo-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {categories
              .filter((category) =>
                category.name
                  .toLowerCase()
                  .includes(searchCategory.toLowerCase())
              )
              .map((category, index) => (
                <tr key={category.id}>
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{category.name}</td>
                  <td className="p-3">
                    {category.description || "description not available"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleCategoryStatus(category.id)}
                      className={` ${
                        category.status ? "bg-green-700" : "bg-red-700"
                      } px-2 py-1 cursor-pointer rounded text-xs  text-white`}
                      title="toggle status"
                    >
                      {category.status ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-3 space-x-2 flex items-center">
                    <button
                      onClick={() =>
                        openEditModal({
                          id: category.id,
                          name: category.name,
                          description: category.description,
                        })
                      }
                      className="text-white bg-indigo-600 px-3 py-2 rounded hover:bg-indigo-700 text-xs flex items-center cursor-pointer "
                    >
                      <BiPencil fontSize={16} />
                    </button>
                    <button
                      onClick={() => handleCategoryDelete(category.id)}
                      className="text-white bg-red-600 px-3 py-2 rounded hover:bg-red-700 text-xs flex items-center cursor-pointer "
                    >
                      <BiTrash fontSize={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* PAGINATION COMPONENET START HERE */}
        <PaginationComponent
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
        {/* PAGINATION COMPONENET START END */}
      </div>
      
    </div>
  );
}

export default AdminManageCategoryPage;
