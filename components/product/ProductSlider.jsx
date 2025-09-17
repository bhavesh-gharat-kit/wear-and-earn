"use client";
import React, { useContext, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import axios from "axios";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./ProductSlider.css"; // Custom styles

import ProductCard from "./ProductCard";
import CreateContext from "../context/createContext";

// Product slider component using Swiper.js
export default function ProductSlider({ title = "Top Trending", showModal, setShowModal }) {
  // Get product list from context
  const { productList, setProductList } = useContext(CreateContext);

  // Fetch products list
  const fetchProductsList = async () => {
    try {
      const response = await axios.get("/api/products");
      const productArrayData = response.data.data;
      setProductList(productArrayData);
    } catch (error) {
      console.log("Internal Server Error While Fetching The data", error);
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    fetchProductsList();
  }, []);

  return (
    <section className="w-full py-8 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Mobile-Optimized Top Trending Products Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12 border-t-4 border-purple-500 dark:border-purple-400 pt-6 rounded-t-lg bg-gradient-to-b from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-900">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 text-purple-700 dark:text-purple-400 px-4">
            Top Trending Products
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
            Discover the most popular products customers are loving right now
          </p>
          <div className="w-16 sm:w-20 md:w-24 h-1 mx-auto mt-3 sm:mt-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 dark:from-amber-300 dark:via-amber-400 dark:to-amber-300 shadow-lg"></div>
        </div>
        <Swiper
          slidesPerView={2} // Mobile: 2 compact cards
          spaceBetween={8} // Very tight spacing for mobile
          pagination={{ 
            clickable: true,
            dynamicBullets: true 
          }}
          navigation={false} // Hide navigation on mobile for space
          autoplay={{
            delay: 3500,
            disableOnInteraction: false
          }}
          loop={true}
          breakpoints={{
          360: {
            slidesPerView: 2, // Very small mobile: 2 full cards
            spaceBetween: 12,
          },
          480: {
            slidesPerView: 2, // Small mobile: 2 full cards
            spaceBetween: 16,
          },
          640: {
            slidesPerView: 2, // Tablet: 2 full cards
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 3, // Tablet landscape: 3 cards
            spaceBetween: 24,
            navigation: true, // Enable navigation on larger screens
          },
          1024: {
            slidesPerView: 4, // Desktop: 4 cards
            spaceBetween: 28,
          },
          1280: {
            slidesPerView: 5, // Large screens: 5 cards
            spaceBetween: 32,
          },
        }}
          modules={[Pagination, Navigation, Autoplay]}
          className="basic-product-slider dark:swiper-dark compact-mobile"
        >
          {productList?.map((product, i) => (
            <SwiperSlide key={i}>
              <ProductCard setShowModal={setShowModal} product={product} compact={true} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
