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
    <section className="w-full py-8">
      <div className="container mx-auto px-4">
        {/* Top Trending Products Header */}
        <div className="text-center mb-12 trending-header">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Top Trending Products
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the most popular products customers are loving right now
          </p>
          <div className="w-24 h-1 trending-divider mx-auto mt-4 rounded-full"></div>
        </div>
        
        <Swiper
          spaceBetween={10}
          slidesPerView={1}
          pagination={{ 
            clickable: true
          }}
          navigation={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false
          }}
          loop={true}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 10
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 10
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 10
            },
            1280: {
              slidesPerView: 5,
              spaceBetween: 10
            }
          }}
          modules={[Pagination, Navigation, Autoplay]}
          className="basic-product-slider"
        >
          {productList?.map((product, i) => (
            <SwiperSlide key={i}>
              <ProductCard setShowModal={setShowModal} product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
