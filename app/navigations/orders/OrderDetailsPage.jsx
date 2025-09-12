"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  CheckCircle, 
  Package, 
  MapPin, 
  Calendar,
  ArrowLeft,
  Receipt,
  Truck
} from 'lucide-react';
import LoaderEffect from '@/components/ui/LoaderEffect';
import toast from 'react-hot-toast';

export default function OrderDetailsPage({ orderId }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id && orderId) {
      fetchOrderDetails();
    }
  }, [session, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(`/api/orders/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.order);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      inProcess: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Order Pending',
      inProcess: 'Processing',
      delivered: 'Delivered'
    };
    return texts[status] || status;
  };

  if (isLoading) {
    return <LoaderEffect />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center text-gray-900 dark:text-gray-100">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Order not found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => router.push('/orders')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            View All Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
  <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order Details</h1>
              <p className="text-gray-600 dark:text-gray-300">Order #{order.id}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
  <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <h2 className="text-lg font-semibold text-green-900 dark:text-green-200">Order Placed Successfully!</h2>
              <p className="text-green-700 dark:text-green-300">Thank you for your order. We'll send you shipping confirmation once your items are on the way.</p>
            </div>
          </div>
        </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Items
              </h3>
              <div className="space-y-4">
                {order.orderProducts?.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                        <span>Qty: {item.quantity}</span>
                        <span>₹{(item.sellingPrice / 100).toLocaleString()}</span>
                        {item.discount > 0 && (
                          <span className="text-green-600">{item.discount}% off</span>
                        )}
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      ₹{(item.totalPrice / 100).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Delivery Address
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-gray-900 dark:text-gray-100 font-medium">{session?.user?.fullName}</p>
                <p className="text-gray-700 dark:text-gray-300 mt-1">{order.address}</p>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Phone: {session?.user?.mobileNo}</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Order Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Order ID:</span>
                  <span className="font-medium">#{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Order Date:</span>
                  <span className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Payment Method:</span>
                  <span className="font-medium">Razorpay</span>
                </div>
                {order.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Delivered:</span>
                    <span className="font-medium text-green-600 dark:text-green-300">
                      {new Date(order.deliveredAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                  <span className="font-medium">
                    ₹{((order.total - order.deliveryCharges - order.gstAmount) / 100).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Delivery Charges:</span>
                  <span className={`font-medium ${order.deliveryCharges === 0 ? 'text-green-600 dark:text-green-300' : ''}`}>
                    {order.deliveryCharges === 0 ? 'FREE' : `₹${(order.deliveryCharges / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">GST:</span>
                  <span className="font-medium">₹{(order.gstAmount / 100).toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      ₹{(order.total / 100).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Delivery Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    order.status === 'pending' || order.status === 'inProcess' || order.status === 'delivered' 
                      ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                  }`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Order Confirmed</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    order.status === 'inProcess' || order.status === 'delivered' 
                      ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                  }`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Processing</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                  }`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Delivered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
