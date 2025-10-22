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

function ProductCard({ product, variant = "grid", compact = false }) {
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

  const handleCardClick = () => {
    router.push(`/product-details/${id}`);
  };

  const handleCardKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  // Mobile-Enhanced List variant for table-like view
  if (variant === "list") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-6 hover:shadow-md transition-all duration-200 ring-2 ring-purple-500/70 shadow-[0_0_16px_4px_rgba(139,92,246,0.25)]">
        <div className="flex gap-3 sm:gap-6">
          {/* Mobile-Responsive Product Image */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 sm:w-24 sm:h-24 md:w-32 md:h-32 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <Image
                src={productImage}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 128px"
              />
              {discount !== null && discount !== undefined && discount !== '' && discount !== '0' && discount !== 0 && Number(discount) > 0 && (
                <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
                  <span className="bg-red-500 text-white text-xs py-0.5 px-1 sm:py-1 sm:px-2 rounded-full font-medium">
                    -{discount}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile-Enhanced Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="flex-1 min-w-0">
                <Link href={`/product-details/${id}`}>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                    {title}
                  </h3>
                </Link>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1 truncate">
                  {category?.name || 'Category'}
                </p>
                {description && (
                  <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
              
              {/* Mobile-Responsive Price */}
              <div className="flex sm:flex-col items-start sm:items-end gap-2 sm:gap-1">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{Number(finalAmount).toLocaleString("en-IN")}
                </span>
                {price && price !== finalAmount && (
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-through">
                    ₹{Number(price).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>
            
            {/* Mobile Stock Status */}
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <Badge className="h-3 w-3 sm:h-4 sm:w-4" />
                {inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Mobile-Optimized Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isLoading || !inStock}
                className="flex items-center justify-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-sm sm:text-base active:scale-95"
              >
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">{isLoading ? 'Adding...' : 'Add to Cart'}</span>
              </button>
              
              <Link
                href={`/product-details/${id}`}
                className="flex items-center justify-center gap-1.5 sm:gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-sm sm:text-base"
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">View Details</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid variant (default) - Mobile Enhanced with Compact Mode
  return (
    <div
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
      className={`cursor-pointer bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group ring-2 ring-purple-500/70 shadow-[0_0_16px_4px_rgba(139,92,246,0.25)] ${compact ? 'max-w-[180px] mx-auto' : ''}`}
    >
      {/* Compact Mobile Product Image */}
  <div className={`relative ${compact ? 'aspect-square' : 'aspect-[4/5] sm:aspect-[4/5]'} overflow-hidden bg-gray-100 dark:bg-gray-800`}>
        <Image
          width={compact ? 200 : 300}
          height={compact ? 200 : 300}
          src={productImage}
          alt={title || "Product image"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          sizes={compact ? "(max-width: 640px) 45vw, (max-width: 768px) 30vw, 20vw" : "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"}
        />        {/* Compact Mode Responsive Badges */}
        <div className={`absolute ${compact ? 'top-1 left-1' : 'top-2 sm:top-3 left-2 sm:left-3'} flex flex-col gap-1 sm:gap-2`}>
          {discount !== null && discount !== undefined && discount !== '' && discount !== '0' && discount !== 0 && Number(discount) > 0 && (
            // hide image badge on mobile, show from sm+
            <span className={`hidden sm:inline-flex bg-red-500 text-white ${compact ? 'text-xs py-0.5 px-1' : 'text-xs py-0.5 px-1.5 sm:py-1 sm:px-2'} rounded-full font-medium shadow-sm`}>
              -{discount}%
            </span>
          )}
          {!inStock && (
            <span className={`bg-gray-500 text-white ${compact ? 'text-xs py-0.5 px-1' : 'text-xs py-0.5 px-1.5 sm:py-1 sm:px-2'} rounded-full font-medium shadow-sm`}>
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick Actions Overlay */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute top-3 right-3">
            <button onClick={(e) => { e.stopPropagation(); /* favorite action */ }} className="p-2 bg-white/90 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-sm transition-colors">
              <Heart className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          
          <div className="absolute bottom-3 left-3 right-3">
            <Link
              href={`/product-details/${id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 bg-white/95 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 py-2 px-4 rounded-lg transition-colors font-medium"
            >
              <Eye className="h-4 w-4" />
              Quick View
            </Link>
          </div>
        </div>
      </div>

      {/* Compact Mode Enhanced Product Info */}
      <div className={compact ? "p-2" : "p-3 sm:p-4"}>
        <div className={compact ? "mb-1.5" : "mb-2 sm:mb-3"}>
          <Link href={`/product-details/${id}`}>
            <h3 className={`${compact ? 'text-xs leading-tight' : 'text-sm sm:text-base leading-tight'} font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 mb-1`}>
              {title}
            </h3>
          </Link>
          <p className={`${compact ? 'text-xs' : 'text-xs sm:text-sm'} text-gray-500 dark:text-gray-400 truncate hidden sm:block`}> 
            {category?.name || 'Category'}
          </p>
        </div>

        {/* Compact Mode Price */}
        <div className={compact ? "mb-2" : "mb-3 sm:mb-4"}>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className={`${compact ? 'text-sm' : 'text-lg sm:text-xl'} font-bold text-blue-600 dark:text-blue-400`}>
                ₹{Number(finalAmount).toLocaleString("en-IN")}
              </span>
              {/* show original price only on sm+ */}
              {price && price !== finalAmount && (
                <span className={`${compact ? 'text-xs' : 'text-xs sm:text-sm'} text-gray-500 dark:text-gray-400 line-through hidden sm:inline`}>
                  ₹{Number(price).toLocaleString("en-IN")}
                </span>
              )}
              {/* inline discount pill for mobile only */}
              {discount !== null && discount !== undefined && discount !== '' && discount !== '0' && discount !== 0 && Number(discount) > 0 && (
                <span className={`inline-flex sm:hidden bg-red-500 text-white ${compact ? 'text-[10px] py-0.5 px-1' : 'text-xs py-0.5 px-1'} rounded-full font-medium`}>
                  -{discount}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Compact Mode Action Buttons */}
        <div className={compact ? "space-y-1" : "space-y-1.5 sm:space-y-2"}>
          <button
            onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
            disabled={isLoading || !inStock}
            className={`w-full flex items-center justify-center ${compact ? 'gap-1 py-1.5 px-2 text-xs' : 'gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base'} bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium active:scale-95`}
          >
            <ShoppingCart className={compact ? "h-3 w-3" : "h-3.5 w-3.5 sm:h-4 sm:w-4"} />
            <span className="truncate">{isLoading ? (compact ? 'Adding...' : 'Adding...') : (compact ? 'Add' : 'Add to Cart')}</span>
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); handleBuyNow(); }}
            className={`hidden sm:flex w-full items-center justify-center ${compact ? 'gap-1 py-1.5 px-2 text-xs' : 'gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base'} bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 rounded-lg transition-colors font-medium active:scale-95`}
          >
            <ShoppingBag className={compact ? "h-3 w-3" : "h-3.5 w-3.5 sm:h-4 sm:w-4"} />
            <span className="truncate">{compact ? 'Buy' : 'Buy Now'}</span>
          </button>
        </div>
      </div>
      
    </div>
  );
}

export default ProductCard;