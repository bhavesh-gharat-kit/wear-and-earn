"use client";

import React, { useEffect, useState } from "react";
import { BiPencil, BiTrash } from "react-icons/bi";
import { IoMdAdd } from "react-icons/io";
import { IoMdSearch } from "react-icons/io";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import AddBannerModel from "./AddBannerModel";
import Image from "next/image";
import Swal from "sweetalert2";
import PaginationComponent from "@/components/ui/PaginationComponent";

function BannerPage() {
  const [allBannersDetails, setAllBannersDetails] = useState([]);
  const [searchSliderTitle, setSearchSliderTitle] = useState("");
  const [showAddBannerModal, setShowAddBannerModal] = useState(false);

  // pagination logic here
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPage, setRowsPage] = useState(5);
  const [totalBannersCount, setTotalBannersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const totalPages = Math.ceil(totalBannersCount / rowsPage);

  const handleSubmitSearchProductQuery = (e) => {
    e.preventDefault();
  };

  // FETCHING ALL THE BANNERS DETAILS
  const fetchAllBannersDetails = async (
    page = currentPage,
    rowsPerPage = rowsPage
  ) => {
    try {
      setIsLoading(true);
      // pagination offset
      const skip = (page - 1) * rowsPerPage;

      const response = await axios.get(
        `/api/admin/banners?limit=${rowsPerPage}&skip=${skip}`
      );
      const bannersDetails = response.data.data;
      setTotalBannersCount(response.data.totalCount);
      setAllBannersDetails(bannersDetails);
      setIsLoading(false);
    } catch (error) {
      console.log(
        "Internal Server Error While Fetching banners Details",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBannerActiveToggler = async (id) => {
    try {
      const response = await axios.patch(`/api/admin/banners/${id}`);
      if (response.status === 200) {
        toast.success("Banner Status Updated", { duration: 800 });
        setTimeout(() => {
          fetchAllBannersDetails();
        }, 1000);
      }
    } catch (error) {
      console.log("Internal Error While", error);
    }
  };

  // handle to delete banner using its id
  const handleBannerDelete = async (id) => {
    try {
      const respone = await axios.delete(`/api/admin/banners/${id}`);
      if (respone.status === 200) {
        toast.success("Banner Deleted", { duration: 1000 });
        setTimeout(() => {
          fetchAllBannersDetails();
        }, 1200);
      }
    } catch (error) {
      console.log("Internal Server Error While Deleting Banner", error);
    }
  };

  useEffect(() => {
    fetchAllBannersDetails();
  }, [currentPage, rowsPage]);

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl text-blue-700 dark:text-blue-400 font-bold">Manage Banners</h1>
        <button
          onClick={() => setShowAddBannerModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold border border-blue-600 transition-colors w-full sm:w-auto"
        >
          <IoMdAdd fontSize={20} />
          <span>Add Banner</span>
        </button>
      </div>

      {/* Search - Responsive */}
      <form
        onSubmit={handleSubmitSearchProductQuery}
        className="w-full sm:w-2/3 lg:w-1/2 xl:w-5/12 p-0.5 rounded h-10 sm:h-12 flex items-center border border-gray-300 dark:border-gray-600"
        action=""
      >
        <input
          className="w-full px-3 py-2 bg-slate-200 dark:bg-gray-700 dark:text-white h-full rounded-l border-0 outline-none text-sm sm:text-base"
          type="search"
          placeholder="Search by slider title..."
          onChange={(e) => setSearchSliderTitle(e.target.value)}
          value={searchSliderTitle}
        />
        <button
          type="submit"
          className="bg-blue-600 h-full text-white px-3 sm:px-4 cursor-pointer rounded-r border-0 hover:bg-blue-700 transition-colors"
        >
          <IoMdSearch fontSize={18} />
        </button>
      </form>

      {/* Banners Table/Cards - Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          {allBannersDetails
            .filter((banner) =>
              banner?.title?.toLowerCase().includes(searchSliderTitle.toLowerCase())
            )
            .map((banner, index) => (
              <div key={banner.id} className="border-b border-gray-200 dark:border-gray-700 p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{banner?.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">#{index + 1}</p>
                  </div>
                  <button
                    onClick={() => handleBannerActiveToggler(banner.id)}
                    className={`px-3 py-1 font-medium text-white rounded text-xs ${
                      banner.isActive ? "bg-green-600" : "bg-red-600"
                    }`}
                  >
                    {banner.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <Image
                    src={banner.imageUrl}
                    width={80}
                    height={60}
                    className="object-cover rounded w-20 h-15 flex-shrink-0"
                    alt={banner.title}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Link:</p>
                    <Link
                      className="text-blue-600 dark:text-blue-400 underline text-xs truncate block"
                      href={banner.link || "#"}
                    >
                      {banner.link || "Not defined"}
                    </Link>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/banners/${banner.id}`}
                    className="text-white bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 text-xs flex items-center cursor-pointer transition-colors"
                    title="Edit"
                  >
                    <BiPencil fontSize={14} />
                  </Link>
                  <button
                    onClick={() => handleBannerDelete(banner.id)}
                    className="text-white bg-red-600 px-3 py-2 rounded hover:bg-red-700 text-xs flex items-center cursor-pointer transition-colors"
                    title="Delete"
                  >
                    <BiTrash fontSize={14} />
                  </button>
                </div>
              </div>
            ))}
          
          {allBannersDetails.filter((banner) =>
            banner?.title?.toLowerCase().includes(searchSliderTitle.toLowerCase())
          ).length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>No banners found</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
            <thead className="bg-indigo-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Image</th>
                <th className="p-3 text-left">Link</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600 text-gray-900 dark:text-gray-100">
              {allBannersDetails
                .filter((banner) =>
                  banner?.title?.toLowerCase().includes(searchSliderTitle.toLowerCase())
                )
                .map((banner, index) => (
                  <tr key={banner.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 whitespace-nowrap">{banner?.title}</td>
                    <td className="p-3">
                      <Image
                        src={banner.imageUrl}
                        width={120}
                        height={80}
                        className="object-cover rounded w-30 h-20"
                        alt={banner.title}
                      />
                    </td>
                    <td className="p-3 max-w-xs">
                      <Link
                        className="text-blue-600 dark:text-blue-400 underline truncate block"
                        href={banner.link || "#"}
                      >
                        {banner.link || "Not defined"}
                      </Link>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleBannerActiveToggler(banner.id)}
                        className={`px-4 py-1 font-medium text-white rounded text-xs transition-colors ${
                          banner.isActive ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {banner.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-3 space-x-2 flex items-center">
                      <Link
                        href={`/admin/banners/${banner.id}`}
                        className="text-white bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 text-xs flex items-center cursor-pointer transition-colors"
                      >
                        <BiPencil fontSize={16} />
                      </Link>
                      <button
                        onClick={() => handleBannerDelete(banner.id)}
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
              totalCount={totalBannersCount}
            />
          </div>
        )}
      </div>
      
      {showAddBannerModal && (
        <AddBannerModel 
          fetchAllBannersDetails={fetchAllBannersDetails} 
          onClose={() => setShowAddBannerModal(false)}
        />
      )}
      
    </div>
  );
}

export default BannerPage;
