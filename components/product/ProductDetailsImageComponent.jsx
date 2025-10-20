"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
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
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Hover zoom states for desktop
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(false);
  
  const imageRefs = useRef([]);
  const touchStartDistance = useRef(0);
  const touchStartZoom = useRef(1);
  const touchStartPan = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 0.25;
  const HOVER_ZOOM_LEVEL = 2.5; // Zoom level for hover magnification

  // Detect if user is on desktop
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024 && !('ontouchstart' in window));
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

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

  // Reset zoom and pan when switching slides
  const resetZoomAndPan = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  // Calculate distance between two touch points
  const getTouchDistance = (touches) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Get center point between two touches
  const getTouchCenter = (touches, rect) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: ((touch1.clientX + touch2.clientX) / 2) - rect.left,
      y: ((touch1.clientY + touch2.clientY) / 2) - rect.top
    };
  };

  // Zoom to specific point with bounds checking
  const zoomToPoint = useCallback((newZoom, pointX, pointY, containerRect) => {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    
    if (clampedZoom === MIN_ZOOM) {
      setZoom(MIN_ZOOM);
      setPanX(0);
      setPanY(0);
      return;
    }

    // Calculate new pan position to keep the zoom point centered
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    const newPanX = (centerX - pointX) * (clampedZoom - 1);
    const newPanY = (centerY - pointY) * (clampedZoom - 1);
    
    // Constrain pan to prevent showing empty space
    const maxPanX = (containerRect.width * (clampedZoom - 1)) / 2;
    const maxPanY = (containerRect.height * (clampedZoom - 1)) / 2;
    
    setZoom(clampedZoom);
    setPanX(Math.max(-maxPanX, Math.min(maxPanX, newPanX)));
    setPanY(Math.max(-maxPanY, Math.min(maxPanY, newPanY)));
  }, [MIN_ZOOM, MAX_ZOOM]);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    const touches = e.touches;
    const currentTime = Date.now();
    
    if (touches.length === 1) {
      // Single touch - check for double tap
      const timeDiff = currentTime - lastTapTime;
      if (timeDiff < 300 && timeDiff > 0) {
        // Double tap detected
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const touch = touches[0];
        const pointX = touch.clientX - rect.left;
        const pointY = touch.clientY - rect.top;
        
        if (zoom > MIN_ZOOM) {
          // If zoomed in, zoom out
          resetZoomAndPan();
        } else {
          // If zoomed out, zoom in to tap point
          zoomToPoint(2.5, pointX, pointY, rect);
        }
      } else {
        // Single tap - prepare for dragging if zoomed
        if (zoom > MIN_ZOOM) {
          setIsDragging(true);
          dragStart.current = {
            x: touches[0].clientX - panX,
            y: touches[0].clientY - panY
          };
        }
      }
      setLastTapTime(currentTime);
    } else if (touches.length === 2) {
      // Pinch start
      e.preventDefault();
      const distance = getTouchDistance(touches);
      touchStartDistance.current = distance;
      touchStartZoom.current = zoom;
      
      const rect = e.currentTarget.getBoundingClientRect();
      touchStartPan.current = getTouchCenter(touches, rect);
      setIsDragging(false);
    }
  }, [lastTapTime, zoom, panX, panY, zoomToPoint, resetZoomAndPan, MIN_ZOOM]);

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    const touches = e.touches;
    
    if (touches.length === 1 && isDragging && zoom > MIN_ZOOM) {
      // Single touch drag - pan the image
      e.preventDefault();
      const newPanX = touches[0].clientX - dragStart.current.x;
      const newPanY = touches[0].clientY - dragStart.current.y;
      
      // Constrain pan
      const rect = e.currentTarget.getBoundingClientRect();
      const maxPanX = (rect.width * (zoom - 1)) / 2;
      const maxPanY = (rect.height * (zoom - 1)) / 2;
      
      setPanX(Math.max(-maxPanX, Math.min(maxPanX, newPanX)));
      setPanY(Math.max(-maxPanY, Math.min(maxPanY, newPanY)));
    } else if (touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const distance = getTouchDistance(touches);
      const scale = distance / touchStartDistance.current;
      const newZoom = touchStartZoom.current * scale;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const center = getTouchCenter(touches, rect);
      
      zoomToPoint(newZoom, touchStartPan.current.x, touchStartPan.current.y, rect);
    }
  }, [isDragging, zoom, zoomToPoint, MIN_ZOOM]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle mouse wheel zoom (desktop)
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const pointX = e.clientX - rect.left;
      const pointY = e.clientY - rect.top;
      
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      zoomToPoint(zoom + delta, pointX, pointY, rect);
    }
  }, [zoom, zoomToPoint, ZOOM_STEP]);

  // Handle double click (desktop)
  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const pointX = e.clientX - rect.left;
    const pointY = e.clientY - rect.top;
    
    if (zoom > MIN_ZOOM) {
      resetZoomAndPan();
    } else {
      zoomToPoint(2.5, pointX, pointY, rect);
    }
  }, [zoom, zoomToPoint, resetZoomAndPan, MIN_ZOOM]);

  // Handle mouse enter for hover zoom (desktop only)
  const handleMouseEnter = useCallback(() => {
    if (isDesktop && zoom === MIN_ZOOM) {
      setIsHovering(true);
    }
  }, [isDesktop, zoom, MIN_ZOOM]);

  // Handle mouse leave for hover zoom
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  // Handle mouse move for hover zoom position
  const handleMouseMove = useCallback((e) => {
    if (isDesktop && isHovering && zoom === MIN_ZOOM) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setHoverPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    }
  }, [isDesktop, isHovering, zoom, MIN_ZOOM]);

  // Button controls for desktop/fallback
  const increaseZoom = () => {
    const rect = imageRefs.current[currentSlide]?.getBoundingClientRect();
    if (rect) {
      zoomToPoint(zoom + ZOOM_STEP, rect.width / 2, rect.height / 2, rect);
    }
  };
  
  const decreaseZoom = () => {
    const rect = imageRefs.current[currentSlide]?.getBoundingClientRect();
    if (rect) {
      zoomToPoint(zoom - ZOOM_STEP, rect.width / 2, rect.height / 2, rect);
    }
  };

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
        onSlideChange={(swiper) => {
          setCurrentSlide(swiper.realIndex || swiper.activeIndex || 0);
          resetZoomAndPan();
        }}
        modules={[FreeMode, Navigation, Thumbs]}
        className="main-swiper w-full h-[700px] sm:h-[650px] md:h-[600px] lg:h-[500px] rounded-lg overflow-hidden bg-gray-100"
      >
        {productDetails.images?.map((product, index) => (
          <SwiperSlide key={index} className="flex items-center justify-center overflow-hidden">
            <div
              ref={(el) => imageRefs.current[index] = el}
              className={`w-full h-full relative overflow-hidden ${
                zoom > MIN_ZOOM ? 'cursor-grab active:cursor-grabbing' : isDesktop ? 'cursor-zoom-in' : 'cursor-zoom-in'
              }`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              onDoubleClick={handleDoubleClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
              style={{
                touchAction: zoom > MIN_ZOOM ? 'none' : 'auto'
              }}
            >
              <Image
                width={600}
                height={600}
                src={product.imageUrl}
                style={{ 
                  transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  transformOrigin: 'center center'
                }}
                className="w-full h-full object-contain select-none"
                alt={`${productDetails?.title} - Image ${index + 1}`}
                priority={index === 0}
                draggable={false}
              />
              
              {/* Desktop Hover Zoom Overlay */}
              {isDesktop && isHovering && zoom === MIN_ZOOM && (
                <div className="absolute top-4 right-4 w-48 h-48 lg:w-64 lg:h-64 xl:w-80 xl:h-80 border-2 border-white shadow-2xl rounded-lg overflow-hidden bg-white z-10 pointer-events-none">
                  <Image
                    width={600}
                    height={600}
                    src={product.imageUrl}
                    className="w-full h-full object-contain select-none"
                    style={{
                      transform: `scale(${HOVER_ZOOM_LEVEL})`,
                      transformOrigin: `${hoverPosition.x}% ${hoverPosition.y}%`,
                      transition: 'transform 0.1s ease-out'
                    }}
                    alt={`${productDetails?.title} - Zoomed view`}
                    draggable={false}
                  />
                  {/* Magnifying glass icon */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white p-1 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      </div>
      
      {/* Zoom Controls */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <button
          onClick={decreaseZoom}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-lg font-bold leading-none text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          −
        </button>
        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-800 dark:text-gray-200 min-w-[80px] text-center">
          {zoom.toFixed(1)}x
        </div>
        <button
          onClick={increaseZoom}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-lg font-bold leading-none text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </button>
        <button
          onClick={resetZoomAndPan}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Reset zoom"
          className="px-3 py-2 bg-blue-600 dark:bg-blue-700 border border-blue-600 dark:border-blue-700 rounded-md shadow-sm hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="thumb-swiper"
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
              <div className="w-16 h-16 rounded-md overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors duration-200">
                <Image
                  width={64}
                  height={64}
                  src={product.imageUrl}
                  className="w-full h-full object-contain"
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
