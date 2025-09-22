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
        className="main-swiper w-full h-[560px] sm:h-[500px] rounded-lg overflow-hidden bg-gray-100"
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
      {/* Mobile-only Zoom Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-2 sm:hidden">
        <button
          onClick={decreaseZoom}
          aria-label="Zoom out"
          className="px-3 py-2 bg-white/95 dark:bg-gray-900/80 rounded-md shadow-sm hover:bg-white transition-colors text-lg leading-none"
        >
          −
        </button>
        <div className="px-2 py-1 bg-white/90 dark:bg-gray-900/80 rounded-md text-sm font-medium shadow-sm">x{zoom}</div>
        <button
          onClick={increaseZoom}
          aria-label="Zoom in"
          className="px-3 py-2 bg-white/95 dark:bg-gray-900/80 rounded-md shadow-sm hover:bg-white transition-colors text-lg leading-none"
        >
          +
        </button>
        <button
          onClick={resetZoom}
          aria-label="Reset zoom"
          className="px-2 py-2 bg-white/95 dark:bg-gray-900/80 rounded-md shadow-sm hover:bg-white transition-colors text-xs"
        >
          Reset
        </button>
      </div>
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
