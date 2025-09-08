"use client";

import React, { useEffect, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { BsFillPatchExclamationFill } from "react-icons/bs";
import { FaEdit, FaEye } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import LoaderEffect from "@/components/ui/LoaderEffect";
import PaginationComponent from "@/components/ui/PaginationComponent";
import moment from "moment";

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPage, setRowsPage] = useState(20);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  
  const totalPages = Math.ceil(totalOrdersCount / rowsPage);

  // Fetch orders
  const fetchOrders = async (page = currentPage, rowsPerPage = rowsPage) => {
    try {
      setIsLoading(true);
      const skip = (page - 1) * rowsPerPage;
      
      const params = new URLSearchParams({
        limit: rowsPerPage.toString(),
        skip: skip.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const response = await axios.get(`/api/admin/orders?${params}`);
      
      if (response.data.success) {
        // Convert paise to rupees for display
        const ordersWithRupees = response.data.data.map(order => ({
          ...order,
          total: order.total / 100, // Convert paise to rupees
          deliveryCharges: order.deliveryCharges ? order.deliveryCharges / 100 : 0,
          gstAmount: order.gstAmount ? order.gstAmount / 100 : 0,
          commissionAmount: order.commissionAmount ? order.commissionAmount / 100 : 0,
          orderProducts: order.orderProducts ? order.orderProducts.map(product => ({
            ...product,
            sellingPrice: product.sellingPrice / 100,
            discount: product.discount ? product.discount / 100 : 0,
            finalMRP: product.finalMRP ? product.finalMRP / 100 : 0,
            homeDelivery: product.homeDelivery ? product.homeDelivery / 100 : 0,
            totalPrice: product.totalPrice / 100
          })) : []
        }));
        
        setOrders(ordersWithRupees);
        setTotalOrdersCount(response.data.totalCount);
      } else {
        toast.error(response.data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) {
        toast.error("Please login as admin");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. Admin role required.");
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch orders");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.patch('/api/admin/orders', {
        orderId,
        status: newStatus
      });
      
      if (response.data.success) {
        toast.success("Order status updated successfully");
        fetchOrders(currentPage, rowsPage);
      } else {
        toast.error(response.data.message || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      if (error.response?.status === 401) {
        toast.error("Please login as admin");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. Admin role required.");
      } else {
        toast.error(error.response?.data?.message || "Failed to update order status");
      }
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders(1, rowsPage);
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, rowsPage]);

  const getStatusBadge = (status) => {
    const statusStyles = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'inProcess': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return <LoaderEffect />;
  }

  return (
  <section className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      
      
      <h2 className="text-3xl font-bold mb-8 text-blue-700">Manage Orders</h2>

      {/* Search and Filter Form */}
      <form onSubmit={handleSearch} className="w-full mb-6 flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
              className="border border-blue-400 rounded-md p-1 px-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <span className="font-semibold">TO</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
              className="border border-blue-400 rounded-md p-1 px-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
        <div className="flex items-center md:max-w-sm border border-blue-400 rounded-lg overflow-hidden">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email or order ID..."
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white h-full px-4 py-2 hover:bg-blue-700"
          >
            <BiSearch fontSize={20} />
          </button>
        </div>
      </form>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 w-full px-4 text-center bg-white rounded-2xl shadow-md border border-gray-200">
          <BsFillPatchExclamationFill size={40} className="text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">
            No Orders Found
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            No orders to display right now. Orders will appear here once customers place them.
          </p>
        </div>
      ) : (
  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {order.user?.fullName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-300">
                        {order.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {order.orderProducts?.length || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      ₹{typeof order.total === 'number' ? order.total.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {moment(order.createdAt).format('DD/MM/YYYY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-gray-100">
                      <div className="flex space-x-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="pending">Pending</option>
                          <option value="inProcess">In Process</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                setRowsPage={setRowsPage}
                rowsPage={rowsPage}
                totalCount={totalOrdersCount}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default AdminOrdersPage;
