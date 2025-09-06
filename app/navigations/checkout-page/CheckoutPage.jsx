"use client";

import React, { useState, useEffect, useContext } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  MapPin, 
  CreditCard, 
  Package, 
  User, 
  Edit3,
  ArrowLeft,
  Shield,
  Truck
} from 'lucide-react';
import CreateContext from '@/components/context/createContext';
import AddressForm from '@/components/forms/AddressForm';
import LoaderEffect from '@/components/ui/LoaderEffect';

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { addToCartList, fetchUserProductCartDetails } = useContext(CreateContext);
  
  const [userAddress, setUserAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Calculate totals
  const subtotal = addToCartList.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
  
  // Calculate GST based on individual product GST rates
  const gstAmount = addToCartList.reduce((sum, item) => {
    const productGst = item.product.gst || 18; // Default to 18% if not set
    const productSubtotal = item.product.sellingPrice * item.quantity;
    return sum + (productSubtotal * productGst / 100);
  }, 0);
  
  // Calculate shipping based on individual product shipping rates
  const shippingCharges = addToCartList.reduce((sum, item) => {
    const productShipping = item.product.homeDelivery || 0;
    return sum + (productShipping * item.quantity);
  }, 0);
  
  // Free shipping if subtotal > 999, otherwise use calculated shipping charges
  const deliveryCharges = subtotal > 999 ? 0 : shippingCharges;
  
  const total = subtotal + deliveryCharges + gstAmount;

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserAddress();
      if (addToCartList.length === 0) {
        fetchUserProductCartDetails();
      }
    }
  }, [session]);

  const fetchUserAddress = async () => {
    try {
      const response = await axios.get(`/api/user/address`);
      if (response.data.address) {
        setUserAddress(response.data.address);
      } else {
        setShowAddressForm(true);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setShowAddressForm(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressUpdate = (address) => {
    setUserAddress(address);
    setShowAddressForm(false);
  };

  const handlePlaceOrder = async () => {
    if (!userAddress) {
      toast.error('Please add your address first');
      setShowAddressForm(true);
      return;
    }

    if (addToCartList.length === 0) {
      toast.error('Your cart is empty');
      router.push('/cart');
      return;
    }

    if (paymentMethod === 'cod') {
      toast.error('Cash on Delivery is currently not available');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const orderData = {
        items: addToCartList.map(item => ({
          productId: item.product.id,
          title: item.product.title,
          quantity: item.quantity,
          sellingPrice: item.product.sellingPrice,
          discount: item.product.discount || 0,
          gst: item.product.gst || 18,
          homeDelivery: item.product.homeDelivery || 0
        })),
        address: `${userAddress.houseNumber || ''} ${userAddress.area}, ${userAddress.landmark || ''}, ${userAddress.villageOrCity}, ${userAddress.taluka}, ${userAddress.district}, ${userAddress.state} - ${userAddress.pinCode}`,
        deliveryCharges,
        gstAmount,
        total,
        paymentMethod
      };

      const response = await axios.post('/api/orders', orderData);
      
      if (response.data.success) {
        if (paymentMethod === 'online' && response.data.razorpayOrder) {
          // Load Razorpay script
          const isScriptLoaded = await loadRazorpayScript();
          if (!isScriptLoaded) {
            toast.error('Payment gateway failed to load');
            setIsPlacingOrder(false);
            return;
          }

          // Initialize Razorpay payment
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: response.data.razorpayOrder.amount,
            currency: response.data.razorpayOrder.currency,
            name: 'Wear and Earn',
            description: 'Order Payment',
            order_id: response.data.razorpayOrder.id,
            handler: async (razorpayResponse) => {
              try {
                console.log('💳 Payment successful on Razorpay, verifying...', razorpayResponse);
                
                // Verify payment with timeout
                const verifyResponse = await axios.post('/api/orders/verify-payment', {
                  razorpay_order_id: razorpayResponse.razorpay_order_id,
                  razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                  razorpay_signature: razorpayResponse.razorpay_signature,
                  orderId: response.data.orderId
                }, {
                  timeout: 30000 // 30 second timeout
                });

                console.log('✅ Payment verification response:', verifyResponse.data);

                if (verifyResponse.data.success) {
                  // Show success message
                  toast.success('Payment successful! Order placed.', { duration: 3000 });
                  
                  // Log referral code for immediate access
                  if (verifyResponse.data.referralCode) {
                    console.log('🎟️ User referral code:', verifyResponse.data.referralCode);
                  }
                  
                  // Clear cart after successful payment
                  await axios.delete('/api/cart/clear');
                  fetchUserProductCartDetails();
                  
                  // Redirect to account page with a small delay to ensure MLM processing is complete
                  setTimeout(() => {
                    router.push('/account');
                  }, 1500);
                } else {
                  console.error('❌ Payment verification failed:', verifyResponse.data);
                  toast.error(`Payment verification failed: ${verifyResponse.data.message || 'Unknown error'}`);
                  // Don't redirect, let user try again
                }
              } catch (error) {
                console.error('💥 Payment verification error:', error);
                
                if (error.code === 'ECONNABORTED') {
                  toast.error('Payment verification timed out. Please check your order status or contact support.');
                } else if (error.response?.status === 500) {
                  toast.error('Payment successful but processing failed. Please check your order status.');
                } else {
                  toast.error(`Payment verification failed: ${error.response?.data?.message || error.message}`);
                }
              } finally {
                setIsPlacingOrder(false);
              }
            },
            prefill: {
              name: session?.user?.fullName || session?.user?.name,
              email: session?.user?.email,
              contact: session?.user?.mobileNo || '',
            },
            notes: {
              orderId: response.data.orderId,
            },
            theme: {
              color: '#16a34a',
            },
            modal: {
              ondismiss: () => {
                toast.error('Payment cancelled');
                setIsPlacingOrder(false);
              },
            },
            // Add payment failure handler
            'payment.failed': (response) => {
              console.error('💥 Razorpay payment failed:', response.error);
              toast.error(`Payment failed: ${response.error.description || 'Unknown error'}`);
              setIsPlacingOrder(false);
            },
          };

          const paymentObject = new window.Razorpay(options);
          paymentObject.open();
        }
        // COD option is currently disabled
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
      setIsPlacingOrder(false);
    }
  };

  if (isLoading) {
    return <LoaderEffect />;
  }

  if (addToCartList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to continue with checkout</p>
          <button
            onClick={() => router.push('/products')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              <p className="text-gray-600">Complete your order</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Address & Payment */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Address Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
                </div>
                {userAddress && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                )}
              </div>

              {userAddress && !showAddressForm ? (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-600 mr-3 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900">{session?.user?.fullName}</h3>
                      <p className="text-gray-700 mt-1">
                        {userAddress.houseNumber && `${userAddress.houseNumber}, `}
                        {userAddress.area}, {userAddress.landmark && `${userAddress.landmark}, `}
                        {userAddress.villageOrCity}, {userAddress.taluka}, {userAddress.district}, {userAddress.state} - {userAddress.pinCode}
                      </p>
                      <p className="text-gray-600 mt-1">Phone: {session?.user?.mobileNo}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <AddressForm
                  onAddressUpdate={handleAddressUpdate}
                  existingAddress={userAddress}
                  onCancel={userAddress ? () => setShowAddressForm(false) : null}
                />
              )}
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
              </div>
              
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <input
                      id="online"
                      name="payment"
                      type="radio"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="online" className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Online Payment</span>
                        <div className="flex items-center text-sm text-gray-600">
                          <Shield className="h-4 w-4 mr-1" />
                          Secure Payment
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Credit Card, Debit Card, Net Banking, UPI & more</p>
                    </label>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 opacity-75">
                  <div className="flex items-center">
                    <input
                      id="cod"
                      name="payment"
                      type="radio"
                      value="cod"
                      disabled
                      className="h-4 w-4 text-gray-400 border-gray-300 cursor-not-allowed"
                    />
                    <label htmlFor="cod" className="ml-3 flex-1 cursor-not-allowed">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-500">Cash on Delivery</span>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                          Coming Soon
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">This payment option will be available soon</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-4">
                {addToCartList.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={item.product.mainImage}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.product.title}
                      </h4>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ₹{(item.product.sellingPrice * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({addToCartList.length} items)</span>
                  <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
                
                {/* Individual GST breakdown */}
                {addToCartList.map((item, index) => {
                  const itemGst = item.product.gst || 18;
                  const itemSubtotal = item.product.sellingPrice * item.quantity;
                  const itemGstAmount = itemSubtotal * itemGst / 100;
                  return (
                    <div key={`gst-${item.id}`} className="flex justify-between text-sm">
                      <span className="text-gray-500">GST ({itemGst}%) on {item.product.title}</span>
                      <span className="text-gray-600">₹{itemGstAmount.toFixed(2)}</span>
                    </div>
                  );
                })}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Total GST</span>
                  <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Charges</span>
                  <span className={`font-medium ${deliveryCharges === 0 ? 'text-green-600' : ''}`}>
                    {deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges.toFixed(2)}`}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-lg font-bold text-gray-900">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 mr-2 text-green-500" />
                  Safe and Secure Payments
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Truck className="h-4 w-4 mr-2 text-blue-500" />
                  Fast Delivery
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || !userAddress}
                className={`w-full mt-6 py-3 px-6 rounded-lg font-medium transition-colors ${
                  isPlacingOrder || !userAddress
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isPlacingOrder ? 'Placing Order...' : `Place Order - ₹${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
