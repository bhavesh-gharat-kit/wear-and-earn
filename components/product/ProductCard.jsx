"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useContext, useState } from "react";
import { FaShoppingBag, FaShoppingCart, FaEye } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import CreateContext from "../context/createContext";

function ProductCard({ product, variant = "default", setShowModal }) {
  const { 
    title, 
    sellingPrice, 
    price, 
    mainImage, 
    id, 
    discount,
    categoryId 
  } = product;
  
  // Ensure mainImage is not empty string or null
  const validMainImage = mainImage && mainImage.trim() !== "" ? mainImage : "/images/brand-logo.png";
  
  const { data: session } = useSession();
  const router = useRouter();
    const { addToCartList, setAddtoCartList, productList, fetchUserProductCartDetails } =
    useContext(CreateContext);
  const [localShowModal, setLocalShowModal] = useState(false);

  const loggedInUserId = session?.user?.id;

  const handleBuy = () => {
    if (typeof setShowModal === "function") {
      setShowModal(true);
    } else {
      setLocalShowModal(true);
    }
  };

  const handleBuyNow = () => {
    router.push(`/product-details/${id}`);
  };

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
        userId: loggedInUserId
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

  // Variant for grid layout (like V2)
  if (variant === "grid") {
    return (
      <div className="w-64 mb-4 m-4 transition-all duration-200 hover:-translate-y-1.5">
        <div className="flex flex-col text-center border rounded-lg overflow-hidden shadow-lg group">
          {/* Product Thumbnail */}
          <div className="relative group">
            {/* Product Label */}
            {discount && (
              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs py-1 px-2 rounded z-10">
                -{discount}%
              </span>
            )}
            <Image
              width={300}
              height={300}
              src={validMainImage}
              alt={title || "Product image"}
              className="w-full h-56 object-cover"
              loading="lazy"
            />

            {/* Product Overlay (Appears on hover) */}
            <div className="absolute inset-0 bg-black/10 bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute top-2 right-2">
                <Link
                  href={`/product-details/${id}`}
                  className="text-white text-2xl hover:text-blue-300"
                >
                  <FaEye />
                </Link>
              </div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                <Link
                  href={`/product-details/${id}`}
                  className="bg-white text-black py-2 px-4 rounded hover:bg-gray-100 transition-colors"
                >
                  Quick View
                </Link>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4">
            <Link href={`/product-details/${id}`}>
              <h3 className="text-lg font-medium text-gray-800 mb-2 line-clamp-2 hover:text-blue-600">
                {title}
              </h3>
            </Link>
            
            <div className="flex justify-center items-center gap-2 mb-3">
              <span className="text-blue-600 text-xl font-semibold">
                ₹{Number(sellingPrice).toLocaleString("en-IN")}
              </span>
              {price && price !== sellingPrice && (
                <span className="text-gray-500 text-sm line-through">
                  ₹{Number(price).toLocaleString("en-IN")}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center justify-center transition-colors duration-150"
              >
                <FaShoppingCart className="mr-2" />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm flex items-center justify-center transition-colors duration-150"
              >
                <FaShoppingBag className="mr-2" />
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default card layout
  return (
    <div className="group/card card h-full bg-base-100 w-72 max-sm:w-full border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      {/* Uniform image area using aspect ratio */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-50">
        <Image
          src={validMainImage}
          alt={title || "Product image"}
          fill
          sizes="(max-width: 640px) 100vw, 288px"
          priority={false}
          className="object-cover transition-transform duration-300 group-hover/card:scale-105"
        />
        {/* badge overlay inside the image wrapper so it positions correctly */}
        <div className="absolute top-2 left-0">
          <span className="bg-blue-600/90 rounded-r px-2.5 py-1 text-white text-xs tracking-wide">
            Best Seller
          </span>
        </div>
        {discount && (
          <div className="absolute top-2 right-2">
            <span className="bg-red-500 text-white text-xs py-1 px-2 rounded">
              -{discount}%
            </span>
          </div>
        )}
      </div>

      <div className="card-body p-3 max-sm:p-2">
        <h2 className="card-title">
          <Link href={`/product-details/${id}`}>
            <p className="font-medium text-slate-800 line-clamp-2 max-sm:text-sm hover:text-blue-600">
              {title}
            </p>
          </Link>
        </h2>

        <div className="flex justify-start items-center mb-3 gap-2">
          <span className="text-blue-600 text-xl font-semibold max-sm:text-base">
            ₹{Number(sellingPrice).toLocaleString("en-IN")}
          </span>
          {price && price !== sellingPrice && (
            <span className="text-gray-500 text-sm line-through">
              ₹{Number(price).toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <div className="card-actions justify-end max-sm:justify-center gap-2">
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center justify-center transition-colors duration-150"
          >
            <FaShoppingCart className="mr-2" />
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm flex items-center justify-center transition-colors duration-150"
          >
            <FaShoppingBag className="mr-2" />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
