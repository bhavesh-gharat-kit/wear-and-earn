"use client";

import React, { useEffect, useState } from "react";
import { BiTrash } from "react-icons/bi";
import { IoMdAdd } from "react-icons/io";
import { IoMdSearch } from "react-icons/io";
import axios from "axios";
import toast from "react-hot-toast";
import moment from "moment";
import PaginationComponent from "@/components/ui/PaginationComponent";
import LoaderEffect from "@/components/ui/LoaderEffect";

function UserPage() {
  const [allUserDetails, setAllUserDetails] = useState([]);
  const [searchUserEmail, setSearchUserEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // pagination logic here
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPage, setRowsPage] = useState(20);
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

  // VIEW USER DETAILS
  const handleViewUserDetails = async (userId) => {
    setModalLoading(true);
    setIsModalOpen(true);
    
    try {
      console.log('Fetching user details for ID:', userId);
      const response = await axios.get(`/api/admin/users/${userId}`);
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        setSelectedUser(response.data.data);
        console.log('User data set:', response.data.data);
      } else {
        console.error('API returned error:', response.data.message);
        toast.error(response.data.message || "Failed to fetch user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(`Failed to fetch user details: ${error.response?.data?.message || error.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  // CLOSE MODAL
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
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
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Contact</th>
              <th className="p-3 text-left">Created On</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600 text-gray-900 dark:text-gray-100">
            {allUserDetails
              .filter((user) =>
                user.email && user.email.toLowerCase().includes(searchUserEmail.toLowerCase())
              )
              .map((user, index) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleViewUserDetails(user.id)}
                >
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{user?.fullName || "Not Defined"}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.mobileNo}</td>
                  <td className="p-3">
                    {moment(user.createdAt).format("MM-DD-YYYY")}
                  </td>
                  <td className="p-3 space-x-2 flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewUserDetails(user.id);
                      }}
                      className="text-white bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 text-xs flex items-center cursor-pointer"
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmAction(user.id);
                      }}
                      className="text-white bg-red-600 px-3 py-2 rounded hover:bg-red-700 text-xs flex items-center cursor-pointer"
                      title="Delete User"
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

      {/* User Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                User Details
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {modalLoading ? (
                <div className="flex justify-center items-center py-8">
                  <LoaderEffect />
                </div>
              ) : selectedUser ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedUser.fullName || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                        <p className="text-gray-900 dark:text-white">{selectedUser.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Mobile Number</label>
                        <p className="text-gray-900 dark:text-white">{selectedUser.mobileNo || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Gender</label>
                        <p className="text-gray-900 dark:text-white">{selectedUser.gender || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Referral Code</label>
                        <p className="text-gray-900 dark:text-white">{selectedUser.referralCode || 'Not generated'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">KYC Status</label>
                        <p className={`font-medium ${
                          selectedUser.kycStatus === 'APPROVED' 
                            ? 'text-green-600 dark:text-green-400' 
                            : selectedUser.kycStatus === 'REJECTED'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {selectedUser.kycStatus || 'Not submitted'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Status</label>
                        <p className={`font-medium ${
                          selectedUser.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {selectedUser.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</label>
                        <p className="text-gray-900 dark:text-white">
                          {moment(selectedUser.createdAt).format("DD/MM/YYYY HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  {selectedUser?.address && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Delivery Address
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">House No.</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.address?.houseNumber || selectedUser.address?.houseNo || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Area</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.address?.area || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Landmark</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.address?.landmark || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Village/City</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.address?.villageOrCity || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Taluka</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.address?.taluka || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">District</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.address?.district || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">State</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.address?.state || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">PIN Code</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.address?.pinCode || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* KYC Information */}
                  {selectedUser?.kycData && (
                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        KYC Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Father's Name</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.kycData?.fatherName || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date of Birth</label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedUser.kycData?.dateOfBirth 
                              ? moment(selectedUser.kycData.dateOfBirth).format("DD/MM/YYYY")
                              : 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Aadhar Number</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.kycData?.aadharNumber || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">PAN Number</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.kycData?.panNumber || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Bank Account</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.kycData?.bankAccountNumber || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">IFSC Code</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.kycData?.ifscCode || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Bank Name</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.kycData?.bankName || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Branch</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.kycData?.branchName || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Orders */}
                  {selectedUser?.orders && selectedUser.orders.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recent Orders
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Order ID</th>
                              <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                              <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                              <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {selectedUser.orders.map((order) => (
                              <tr key={order.id}>
                                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">#{order.id}</td>
                                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">₹{order.totalAmount}</td>
                                <td className="px-3 py-2 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                                  {moment(order.createdAt).format("DD/MM/YYYY")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* No Address Message */}
                  {!selectedUser?.address && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                      <p className="text-gray-600 dark:text-gray-400">No delivery address provided yet</p>
                    </div>
                  )}

                  {/* No KYC Message */}
                  {!selectedUser?.kycData && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                      <p className="text-gray-600 dark:text-gray-400">No KYC information submitted yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">No user data available</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default UserPage;
