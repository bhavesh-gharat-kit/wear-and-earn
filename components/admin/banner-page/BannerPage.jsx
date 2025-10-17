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
    <div className="space-y-6">
      {/* header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl text-blue-700 dark:text-blue-400 font-bold">Manage Banners</h1>
        <button
          onClick={() => setShowAddBannerModal(true)}
          className="flex items-center gap-2 btn btn-primary font-semibold border border-blue-600"
        >
          <i className="text-xl">
            <IoMdAdd fontSize={22} />
          </i>
          <span>Add Banner</span>
        </button>
      </div>

      {/* Search */}

      <form
        onSubmit={handleSubmitSearchProductQuery}
        className="w-5/12 p-0.5 rounded h-10 flex items-center border border-gray-300 dark:border-gray-600"
        action=""
      >
        <input
          className="w-full px-3 py-1 bg-slate-200 dark:bg-gray-700 dark:text-white h-full rounded-l border-0 outline-none"
          type="search"
          placeholder="search by slider title..."
          onChange={(e) => setSearchSliderTitle(e.target.value)}
          value={searchSliderTitle}
        />
        <button
          type="submit"
          className="bg-primary h-full text-white px-2 cursor-pointer rounded-r border-0"
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
                <tr key={banner.id}>
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 whitespace-nowrap">{banner?.title}</td>
                  <td className="p-3">
                    <Image
                      src={banner.imageUrl}
                      width={300}
                      height={300}
                      className="object-fill min-w-36 max-w-36 h-16"
                      alt={banner.title}
                    />
                  </td>
                  <td className="p-3 line-clamp-1 w-36">
                    <Link
                      className="text-blue-700 underline"
                      href={banner.link || "#"}
                    >
                      {banner.link || "not define"}
                    </Link>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleBannerActiveToggler(banner.id)}
                      className={`px-4 btn font-medium whitespace-nowrap text-white rounded py-1 ${
                        banner.isActive ? "bg-green-600" : "bg-red-600"
                      }`}
                    >
                      {banner.isActive ? "active" : "not active"}
                    </button>
                  </td>
                  <td className="p-3 space-x-2 flex items-center">
                    <Link
                      href={`/admin/banners/${banner.id}`}
                      className="text-white bg-indigo-600 px-3 py-2 rounded hover:bg-indigo-700 text-xs flex items-center cursor-pointer "
                    >
                      <BiPencil fontSize={16} />
                    </Link>
                    <button
                      onClick={() => handleBannerDelete(banner.id)}
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
