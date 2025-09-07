"use client";

import ProductDetailsImageComponent from "@/components/product/ProductDetailsImageComponent";
import { FaCheckCircle, FaShoppingCart, FaHeart, FaShare } from "react-icons/fa";
import { IoBag, IoShieldCheckmark } from "react-icons/io5";
import { MdLocalShipping, MdSecurity } from "react-icons/md";

import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoaderEffect from "@/components/ui/LoaderEffect";
import toast from "react-hot-toast";
import CreateContext from "@/components/context/createContext";

function ProductDetailsPage({ id }) {
  const [productDetails, setProductDetails] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  
  const { data: session } = useSession();
  const router = useRouter();
  const { addToCartList, setAddtoCartList, fetchUserProductCartDetails } = useContext(CreateContext);
  
  const loggedInUserId = session?.user?.id;

  // FETCHING ALL PRODUCTS DETAILS
  const fetchProductDetails = async (id) => {
    try {
      const response = await axios.get(`/api/product-details/${id}`);
      setProductDetails(response.data.product);
    } catch (error) {
      console.log("Internal Error While fetching the product details", error);
      toast.error("Internal Error While fetching the product details");
    }
  };

  useEffect(() => {
    fetchProductDetails(id);
  }, [id]);

  if (productDetails === null) {
    return <LoaderEffect />;
  }

  const {
    category,
    description,
    longDescription,
    mainImage,
    price,
    discount,
    sellingPrice,
    productPrice,
    mlmPrice,
    title,
    inStock,
    keyFeature,
  } = productDetails;

  // Calculate display prices with fallback
  const displayProductPrice = productPrice || (sellingPrice ? sellingPrice * 0.7 : 0);
  const displayMlmPrice = mlmPrice || (sellingPrice ? sellingPrice * 0.3 : 0);
  const displayTotalPrice = sellingPrice || (displayProductPrice + displayMlmPrice);

  const handleAddToCart = async () => {
    if (!loggedInUserId) {
      toast.error("Please Login First", { duration: 1000 });
      setTimeout(() => {
        router.push("/login-register");
      }, 1200);
      return;
    }

    try {
      const response = await axios.post("/api/cart", {
        productId: id,
        userId: loggedInUserId,
        quantity: selectedQuantity
      });

      if (response.data.success || response.status === 200) {
        toast.success(response.data.message || "Item added to cart");
        fetchUserProductCartDetails();
      }
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error(error.response.data.message || "Item already in cart");
      } else if (error.response?.status === 403) {
        toast.error(error.response.data.message || "Access denied");
      } else {
        toast.error("Failed to add item to cart");
      }
      console.error("Error adding to cart:", error);
    }
  };

  const handleBuyNow = () => {
    if (!loggedInUserId) {
      toast.error("Please Login First", { duration: 1000 });
      setTimeout(() => {
        router.push("/login-register");
      }, 1200);
      return;
    }
    
    // Add to cart first, then redirect to cart page
    handleAddToCart().then(() => {
      router.push("/cart");
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <ProductDetailsImageComponent productDetails={productDetails} />
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Category & Title */}
            <div>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mb-3">
                {category?.name}
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                {title}
              </h1>
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-3xl font-bold text-blue-600">
                  ₹{displayTotalPrice?.toLocaleString("en-IN")}
                </span>
                {price && price !== displayTotalPrice && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{price?.toLocaleString("en-IN")}
                    </span>
                    <span className="inline-block px-2 py-1 bg-red-500 text-white text-sm font-bold rounded">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between items-center">
                  <span>Product Price (Pr):</span>
                  <span className="font-medium">₹{displayProductPrice?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>MLM Price (Pm):</span>
                  <span className="font-medium">₹{displayMlmPrice?.toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t pt-1 mt-1 flex justify-between items-center font-semibold">
                  <span>Total Price:</span>
                  <span className="text-blue-600">₹{displayTotalPrice?.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">{longDescription}</p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <FaCheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-700">In Stock</span>
              <span className="text-gray-600">({inStock} items available)</span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <span className="font-medium text-gray-900">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button 
                  onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                >
                  -
                </button>
                <span className="px-4 py-2 border-x border-gray-300 font-medium">
                  {selectedQuantity}
                </span>
                <button 
                  onClick={() => setSelectedQuantity(Math.min(inStock, selectedQuantity + 1))}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors duration-200"
              >
                <FaShoppingCart />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors duration-200"
              >
                <IoBag />
                <span>Buy Now</span>
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="flex space-x-4">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors">
                <FaHeart />
                <span>Add to Wishlist</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
                <FaShare />
                <span>Share Product</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <MdLocalShipping className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">Free Shipping</span>
              </div>
              <div className="flex items-center space-x-2">
                <IoShieldCheckmark className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-600">Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2">
                <MdSecurity className="h-5 w-5 text-purple-500" />
                <span className="text-sm text-gray-600">2 Year Warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'description'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'features'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Key Features
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'shipping'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Shipping & Returns
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'description' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Overview</h3>
                  <p className="text-gray-700 leading-relaxed">{description}</p>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {keyFeature ? (
                      <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                        <FaCheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700">{keyFeature}</span>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                        <FaCheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700">Premium Quality Materials</span>
                      </div>
                    )}
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <FaCheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700">Fast and Reliable Performance</span>
                    </div>
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <FaCheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700">2 Year Manufacturer Warranty</span>
                    </div>
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <FaCheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700">Easy Installation & Setup</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <MdLocalShipping className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Free Standard Shipping</span>
                      </div>
                      <p className="text-gray-600 text-sm ml-8">
                        Free shipping on orders over ₹999. Standard delivery takes 3-5 business days.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <IoShieldCheckmark className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">30-Day Returns</span>
                      </div>
                      <p className="text-gray-600 text-sm ml-8">
                        Easy returns within 30 days of purchase. Item must be in original condition.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsPage;
