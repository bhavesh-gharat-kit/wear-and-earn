"use client";

import React, { useRef, useState } from "react";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

import "./styles.css";

// import required modules
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import Image from "next/image";

export default function ProductDetailsImageComponent({ productDetails }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [zoom, setZoom] = useState(1);
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.25;

  if(!productDetails?.images || productDetails?.images.length <= 0){
    return (
      <div className="w-full h-full min-h-[500px] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
          <p className="text-gray-500">{productDetails?.title || "Product"}</p>
        </div>
      </div>
    )
  }

  const hasMultipleImages = productDetails.images.length > 1;

  const increaseZoom = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const decreaseZoom = () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  const resetZoom = () => setZoom(1);

  return (
    <div className="space-y-4">
      <div className="relative">
      <Swiper
        style={{
          "--swiper-navigation-color": "#3B82F6",
          "--swiper-pagination-color": "#3B82F6",
        }}
        loop={hasMultipleImages}
        spaceBetween={10}
        navigation={true}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        onSlideChange={() => resetZoom()}
        modules={[FreeMode, Navigation, Thumbs]}
        className="main-swiper w-full h-[620px] sm:h-[580px] lg:h-[500px] rounded-lg overflow-hidden bg-gray-100"
      >
        {productDetails.images?.map((product, index) => (
          <SwiperSlide key={index} className="flex items-center justify-center overflow-hidden">
            <Image
              width={600}
              height={600}
              src={product.imageUrl}
              style={{ transform: `scale(${zoom})`, transition: 'transform 180ms ease' }}
              className="w-full h-full object-cover"
              alt={`${productDetails?.title} - Image ${index + 1}`}
              priority={index === 0}
            />
          </SwiperSlide>
        ))}
      </Swiper>
      </div>
      
      {/* Zoom Controls - below image on mobile/tablet */}
      <div className="flex items-center justify-center gap-2 mt-3 lg:hidden">
        <button
          onClick={decreaseZoom}
          aria-label="Zoom out"
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-lg font-bold leading-none text-gray-700 dark:text-gray-200"
        >
          −
        </button>
        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-800 dark:text-gray-200">
          Zoom: {zoom}x
        </div>
        <button
          onClick={increaseZoom}
          aria-label="Zoom in"
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-lg font-bold leading-none text-gray-700 dark:text-gray-200"
        >
          +
        </button>
        <button
          onClick={resetZoom}
          aria-label="Reset zoom"
          className="px-3 py-2 bg-blue-600 dark:bg-blue-700 border border-blue-600 dark:border-blue-700 rounded-md shadow-sm hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm font-medium text-white"
        >
          Reset
        </button>
      </div>
      
      {hasMultipleImages && (
        <Swiper
          onSwiper={setThumbsSwiper}
          loop={false}
          spaceBetween={10}
          slidesPerView={Math.min(4, productDetails.images.length)}
          freeMode={true}
          watchSlidesProgress={true}
          modules={[FreeMode, Navigation, Thumbs]}
          className="thumb-swiper h-20"
          breakpoints={{
            320: {
              slidesPerView: Math.min(3, productDetails.images.length),
              spaceBetween: 8,
            },
            640: {
              slidesPerView: Math.min(4, productDetails.images.length),
              spaceBetween: 10,
            },
            768: {
              slidesPerView: Math.min(5, productDetails.images.length),
              spaceBetween: 12,
            },
          }}
        >
          {productDetails.images?.map((product, index) => (
            <SwiperSlide key={index} className="cursor-pointer">
              <div className="w-full h-full rounded-md overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors duration-200">
                <Image
                  width={80}
                  height={80}
                  src={product.imageUrl}
                  className="w-full h-full object-cover"
                  alt={`${productDetails?.title} - Thumbnail ${index + 1}`}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}
