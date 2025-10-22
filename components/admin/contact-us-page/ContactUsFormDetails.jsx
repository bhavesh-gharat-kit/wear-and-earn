"use client";

import React, { useEffect, useState } from "react";
import { BiPencil, BiTrash } from "react-icons/bi";
import { IoMdAdd } from "react-icons/io";
import { IoMdSearch } from "react-icons/io";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import moment from "moment";
import { FaEye } from "react-icons/fa";
import Swal from "sweetalert2";
import PaginationComponent from "@/components/ui/PaginationComponent";

function ContactUsFormDetails() {
  const [allFormsDetails, setAllFormsDetails] = useState([]);
  const [searchContactName, setSearchContactName] = useState("");

  // pagination logic here
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPage, setRowsPage] = useState(20);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  const totalPages = Math.ceil(totalUsersCount / rowsPage);

  const handleSubmitsearchContactNameQuery = (e) => {
    e.preventDefault();
  };


  // FETCHING ALL THE User DETAILS
  const fetchAllFormsDetails = async (
    page = currentPage,
    rowsPerPage = rowsPage
  ) => {
    // offset
    const skip = (page - 1) * rowsPerPage;

    try {
      const response = await axios.get(
        `/api/contact?limit=${rowsPerPage}&skip=${skip}`
      );
      const contactDetails = response.data.data;
      setAllFormsDetails(contactDetails);
      setTotalUsersCount(response.data.totalCount);
    } catch (error) {
      console.log("Internal Server Error While Fetching User Details", error);
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
                handleUserContactFormDeleteById(id);
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
  const handleUserContactFormDeleteById = async (id) => {
    try {

      const response = await axios.delete(`/api/contact/${id}`);

      if (response.status === 200) {
        toast.success("Contact Form Deleted", { duration: 1000 });
        setTimeout(() => {
          fetchAllFormsDetails();
        }, 1200);
      }
    } catch (error) {
      console.log("Internal Server Error While Deleting the user", error);
    }
  };

  //  HANDLE USER DETAILS PREVIEW
  const handleUserPreviewShowModal = (user) => {
    const { name, email, subject, message, createdAt } = user;

    Swal.fire({
      title: `<strong class="text-blue-700 text-lg">User Form Details</strong>`,
      icon: "",
      html: `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 text-left">

      <!-- Name -->
      <div>
        <label class="block mb-1 font-medium text-gray-700">Name</label>
        <p class="px-3 py-1 border border-gray-300 rounded-md bg-gray-100">${name}</p>
      </div>

      <!-- Email -->
      <div>
        <label class="block mb-1 font-medium text-gray-700">Email</label>
        <p class="px-3 py-1 border border-gray-300 rounded-md bg-gray-100 break-all">${email}</p>
      </div>

      <!-- Subject (optional) -->
      ${
        subject
          ? `
        <div class="col-span-2">
          <label class="block mb-1 font-medium text-gray-700">Subject</label>
          <p class="px-3 py-1 border border-gray-300 rounded-md bg-gray-100">${subject}</p>
        </div>`
          : ""
      }

      <!-- Message (optional) -->
      ${
        message
          ? `
        <div class="col-span-2">
          <label class="block mb-1 font-medium text-gray-700">Message</label>
          <p class="px-3 py-1 border border-gray-300 rounded-md bg-gray-100 whitespace-pre-wrap">${message}</p>
        </div>`
          : ""
      }

      <!-- Created At -->
      <div>
        <label class="block mb-1 font-medium text-gray-700">Submitted On</label>
        <p class="px-3 py-1 border border-gray-300 rounded-md bg-gray-100">
          ${moment(createdAt).format("MMMM D, YYYY h:mm A")}
        </p>
      </div>
    </div>
  `,
      showCloseButton: true,
      showConfirmButton: false,
      confirmButtonText: `
    <i class="fa fa-reply mr-1"></i> Reply
  `,
      cancelButtonText: `
    <i class="fa fa-trash-alt mr-1"></i> Delete
  `,
      customClass: {
        popup: "rounded-xl p-6",
        confirmButton:
          "bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded",
        cancelButton:
          "bg-red-100 text-red-700 hover:bg-red-200 font-medium px-4 py-2 rounded ml-2",
      },
      buttonsStyling: false,
    });
  };

  useEffect(() => {
    fetchAllFormsDetails();
  }, [currentPage, rowsPage]);

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl text-blue-700 dark:text-blue-400 font-bold">Manage Contact Us Form</h1>
      </div>

      {/* Search - Responsive */}
      <form
        onSubmit={handleSubmitsearchContactNameQuery}
        className="w-full sm:w-2/3 lg:w-1/2 xl:w-5/12 p-0.5 rounded h-10 sm:h-12 flex items-center border border-gray-300 dark:border-gray-600"
        action=""
      >
        <input
          className="w-full px-3 py-2 bg-slate-200 dark:bg-gray-700 dark:text-white h-full rounded-l outline-none text-sm sm:text-base"
          type="search"
          placeholder="Search by username..."
          onChange={(e) => setSearchContactName(e.target.value)}
          value={searchContactName}
        />
        <button
          type="submit"
          className="bg-blue-600 h-full text-white px-3 sm:px-4 cursor-pointer rounded-r hover:bg-blue-700 transition-colors"
        >
          <IoMdSearch fontSize={18} />
        </button>
      </form>

      {/* Contact Form Table/Cards - Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          {allFormsDetails
            .filter((user) =>
              user.name
                .toLowerCase()
                .includes(searchContactName.toLowerCase())
            )
            .map((user, index) => (
              <div key={user.id} className="border-b border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{user?.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{user.subject}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    #{index + 1}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {moment(user.createdAt).format("MM-DD-YYYY")}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUserPreviewShowModal(user)}
                      className="text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 text-xs flex items-center cursor-pointer transition-colors"
                      title="View Details"
                    >
                      <FaEye fontSize={14} />
                    </button>
                    <button
                      onClick={() => handleConfirmAction(user.id)}
                      className="text-white bg-red-600 px-2 py-1 rounded hover:bg-red-700 text-xs flex items-center cursor-pointer transition-colors"
                      title="Delete"
                    >
                      <BiTrash fontSize={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          
          {allFormsDetails.filter((user) =>
            user.name.toLowerCase().includes(searchContactName.toLowerCase())
          ).length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>No contact forms found</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
            <thead className="bg-indigo-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Full Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Subject</th>
                <th className="p-3 text-left">Created On</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600 text-gray-900 dark:text-gray-100">
              {allFormsDetails
                .filter((user) =>
                  user.name
                    .toLowerCase()
                    .includes(searchContactName.toLowerCase())
                )
                .map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{user?.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.subject}</td>
                    <td className="p-3">
                      {moment(user.createdAt).format("MM-DD-YYYY")}
                    </td>
                    <td className="p-3 space-x-2 flex items-center">
                      <button
                        onClick={() => handleUserPreviewShowModal(user)}
                        className="text-white bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 text-xs flex items-center cursor-pointer transition-colors"
                      >
                        <FaEye fontSize={16} />
                      </button>
                      <button
                        onClick={() => handleConfirmAction(user.id)}
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
              totalCount={totalUsersCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ContactUsFormDetails;
