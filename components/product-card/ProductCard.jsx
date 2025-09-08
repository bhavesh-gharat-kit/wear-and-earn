"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useContext, useState } from "react";
import { ShoppingCart, ShoppingBag, Eye, Heart, Badge } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import CreateContext from "@/components/context/createContext";

function ProductCard({ product, variant = "grid" }) {
  const { 
    title, 
    sellingPrice, 
    price, 
    productPrice,
    mlmPrice,
    images, 
    id, 
    discount,
    gst,
    homeDelivery,
    description,
    category,
    inStock
  } = product;
  
  // Get first image from ProductImage table or use fallback
  const productImage = images && images.length > 0 ? images[0].imageUrl : "/images/brand-logo.png";
  
  // For display: show sellingPrice - discount (no GST yet)
  const basePrice = sellingPrice || price || 0;
  const discountAmount = (basePrice * (Number(discount) || 0)) / 100;
  const finalAmount = basePrice - discountAmount; // Simple: selling price - discount
  
  const { data: session } = useSession();
  const router = useRouter();
    const { addToCartList, setAddtoCartList, productList, fetchUserProductCartDetails } =
    useContext(CreateContext);
  const [isLoading, setIsLoading] = useState(false);

  const loggedInUserId = session?.user?.id;

  const handleAddToCart = async () => {
    console.log("Add to cart clicked:", { 
      loggedInUserId, 
      productId: id, 
      hasSession: !!session 
    });

    if (!loggedInUserId) {
      toast.error("Please Login First");
      setTimeout(() => {
        router.push("/login-register");
      }, 1200);
      return;
    }

    setIsLoading(true);
    try {
      console.log("Sending cart request:", { productId: id, userId: loggedInUserId });
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyNow = () => {
    router.push(`/product-details/${id}`);
  };

  // List variant for table-like view
  if (variant === "list") {
    return (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 ring-2 ring-purple-500/70 shadow-[0_0_16px_4px_rgba(139,92,246,0.25)]">
  <div className="flex gap-6">
          {/* Product Image */}
          <div className="relative flex-shrink-0">
            <div className="w-32 h-32 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <Image
                src={productImage}
                alt={title}
                fill
                className="object-cover"
              />
              {discount && (
                <div className="absolute top-2 left-2">
                  <span className="bg-red-500 text-white text-xs py-1 px-2 rounded-full font-medium">
                    -{discount}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <Link href={`/product-details/${id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
                    {title}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Category: {category?.name || 'Unknown'}
                </p>
                {description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
              
              {/* Price */}
              <div className="text-right ml-4">
                <div className="flex flex-col items-end gap-1 mb-2">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{Number(finalAmount).toLocaleString("en-IN")}
                  </span>
                  {price && price !== finalAmount && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                      ₹{Number(price).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Badge className="h-4 w-4" />
                    {inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isLoading || !inStock}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                <ShoppingCart className="h-4 w-4" />
                {isLoading ? 'Adding...' : 'Add to Cart'}
              </button>
              
              <Link
                href={`/product-details/${id}`}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid variant (default)
  return (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group ring-2 ring-purple-500/70 shadow-[0_0_16px_4px_rgba(139,92,246,0.25)]">
      {/* Product Image */}
  <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
              <Image
                width={300}
                height={300}
                src={productImage}
                alt={title || "Product image"}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount && (
            <span className="bg-red-500 text-white text-xs py-1 px-2 rounded-full font-medium shadow-sm">
              -{discount}%
            </span>
          )}
          {!inStock && (
            <span className="bg-gray-500 text-white text-xs py-1 px-2 rounded-full font-medium shadow-sm">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick Actions Overlay */}
  <div className="absolute inset-0 bg-black/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute top-3 right-3">
            <button className="p-2 bg-white/90 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-sm transition-colors">
              <Heart className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          
          <div className="absolute bottom-3 left-3 right-3">
            <Link
              href={`/product-details/${id}`}
              className="flex items-center justify-center gap-2 bg-white/95 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 py-2 px-4 rounded-lg transition-colors font-medium"
            >
              <Eye className="h-4 w-4" />
              Quick View
            </Link>
          </div>
        </div>
      </div>

      {/* Product Info */}
  <div className="p-4">
        <div className="mb-3">
          <Link href={`/product-details/${id}`}>
            <h3 className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 mb-1">
              {title}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {category?.name || 'Category'}
          </p>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              ₹{Number(finalAmount).toLocaleString("en-IN")}
            </span>
            {price && price !== finalAmount && (
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                ₹{Number(price).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleAddToCart}
            disabled={isLoading || !inStock}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2.5 px-4 rounded-lg transition-colors font-medium"
          >
            <ShoppingCart className="h-4 w-4" />
            {isLoading ? 'Adding...' : 'Add to Cart'}
          </button>
          
          <button
            onClick={handleBuyNow}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 py-2.5 px-4 rounded-lg transition-colors font-medium"
          >
            <ShoppingBag className="h-4 w-4" />
            Buy Now
          </button>
        </div>
      </div>
      
    </div>
  );
}

export default ProductCard;