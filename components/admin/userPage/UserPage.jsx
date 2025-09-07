"use client";

import React, { useEffect, useState } from "react";
import { BiPencil, BiTrash } from "react-icons/bi";
import { IoMdAdd } from "react-icons/io";
import { IoMdSearch } from "react-icons/io";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import PaginationComponent from "@/components/ui/PaginationComponent";
import LoaderEffect from "@/components/ui/LoaderEffect";

function UserPage() {
  const [allUserDetails, setAllUserDetails] = useState([]);
  const [searchUserEmail, setSearchUserEmail] = useState("");

  // pagination logic here
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPage, setRowsPage] = useState(10);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const totalPages = Math.ceil(totalUsersCount / rowsPage);

  const handleSubmitSearchProductQuery = (e) => {
    e.preventDefault();
  };

  // FETCHING ALL THE User DETAILS
  const fetchAllUserDetails = async (
    page = currentPage,
    rowsPerPage = rowsPage
  ) => {
    // pagination offset
    const skip = (page - 1) * rowsPerPage;

    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/admin/users?limit=${rowsPerPage}&skip=${skip}`
      );
      const userDetails = response.data.data;

      setAllUserDetails(userDetails);
      setTotalUsersCount(response.data.totalCount);
      setIsLoading(false);
    } catch (error) {
      console.log("Internal Server Error While Fetching User Details", error);
    } finally {
      setIsLoading(false);
    }
  };

  // handling confirmation for user delete
  const handleConfirmAction = (id) => {
    toast(
      (t) => (
        <div className="space-y-3">
          <p className="font-medium">Are you sure you want to Delete?</p>

          <div className="flex justify-start items-center gap-2 flex-row-reverse">
            <button
              className="btn bg-green-600 text-white rounded-md"
              onClick={() => {
                handleUserDeleteById(id);
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

  // DELETING THE USER DELETE CODE
  const handleUserDeleteById = async (id) => {
    try {
      const response = await axios.delete(`/api/admin/users/${id}`);

      if (response.status === 200) {
        toast.success("User Deleted", { duration: 1000 });
        setTimeout(() => {
          fetchAllUserDetails();
        }, 1200);
      }
    } catch (error) {
      console.log("Internal Server Error While Deleting the user", error);
    }
  };

  useEffect(() => {
    fetchAllUserDetails();
  }, [currentPage, rowsPage]);

  if (isLoading) {
    return <LoaderEffect />;
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl text-blue-700 dark:text-blue-400 font-bold">Manage Users</h1>
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
          placeholder="search by user email..."
          onChange={(e) => setSearchUserEmail(e.target.value)}
          value={searchUserEmail}
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
              <th className="p-3 text-left">Gender</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Contact</th>
              <th className="p-3 text-left">Created On</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600 text-gray-900 dark:text-gray-100">
            {allUserDetails
              .filter((user) =>
                user.email.includes(searchUserEmail.toLowerCase())
              )
              .map((user, index) => (
                <tr key={user.id}>
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{user?.gender || "Not Defined"}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.mobileNo}</td>
                  <td className="p-3">
                    {moment(user.createdAt).format("MM-DD-YYYY")}
                  </td>
                  <td className="p-3 space-x-2 flex items-center">
                    <Link
                      href={`/admin/users/edit/${user.id}`}
                      className="text-white bg-indigo-600 px-3 py-2 rounded hover:bg-indigo-700 text-xs flex items-center cursor-pointer "
                    >
                      <BiPencil fontSize={16} />
                    </Link>
                    <button
                      onClick={() => handleConfirmAction(user.id)}
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

export default UserPage;
