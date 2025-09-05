"use client";
import React, { useContext, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import axios from "axios";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./ProductSlider.css"; // Reuse the same custom styles

import ProductCard from "./ProductCard";
import CreateContext from "../context/createContext";

// MLM Product slider component using Swiper.js
export default function MLMProductSlider({ showModal, setShowModal }) {
  // State for MLM products
  const [mlmProducts, setMlmProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch MLM products list
  const fetchMLMProductsList = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/products?type=MLM");
      const mlmProductsData = response.data.data;
      setMlmProducts(mlmProductsData);
    } catch (error) {
      console.log("Internal Server Error While Fetching MLM Products", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch MLM products on component mount
  useEffect(() => {
    fetchMLMProductsList();
  }, []);

  if (loading) {
    return (
      <section className="w-full py-8">
        <div className="container mx-auto px-4">
          {/* MLM Products Header */}
          <div className="text-center mb-12 trending-header mlm-header">
            <h2 className="text-4xl font-bold mb-4" style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Top MLM Products
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              These MLM-exclusive products are trending among members.
            </p>
            <div className="w-24 h-1 mx-auto mt-4 rounded-full" style={{
              background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 50%, #8b5cf6 100%)',
              boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
            }}></div>
          </div>
          
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!mlmProducts || mlmProducts.length === 0) {
    return (
      <section className="w-full py-8">
        <div className="container mx-auto px-4">
          {/* MLM Products Header */}
          <div className="text-center mb-12 trending-header mlm-header">
            <h2 className="text-4xl font-bold mb-4" style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Top MLM Products
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These MLM-exclusive products are trending among members.
            </p>
            <div className="w-24 h-1 mx-auto mt-4 rounded-full" style={{
              background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 50%, #8b5cf6 100%)',
              boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
            }}></div>
          </div>
          
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No MLM products available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-8">
      <div className="container mx-auto px-4">
        {/* MLM Products Header */}
        <div className="text-center mb-12 trending-header mlm-header">
          <h2 className="text-4xl font-bold mb-4" style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Top MLM Products
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            These MLM-exclusive products are trending among members.
          </p>
          <div className="w-24 h-1 mx-auto mt-4 rounded-full" style={{
            background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 50%, #8b5cf6 100%)',
            boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
          }}></div>
        </div>
        
        <Swiper
          spaceBetween={10}
          slidesPerView={1}
          pagination={{ 
            clickable: true
          }}
          navigation={true}
          autoplay={{
            delay: 3500, // Slightly different delay from trending slider
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
          className="basic-product-slider mlm-product-slider"
        >
          {mlmProducts.map((product, index) => (
            <SwiperSlide key={product.id || index}>
              <ProductCard 
                product={product} 
                showModal={showModal} 
                setShowModal={setShowModal}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
