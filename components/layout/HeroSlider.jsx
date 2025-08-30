"use client";
import React, { useEffect, useState } from "react";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/autoplay"; // Import the autoplay CSS

import "@/components/ui/styles.css";

// Import required Swiper modules correctly
import { Pagination, Navigation } from "swiper/modules";
import { Autoplay } from "swiper/modules"; // Import autoplay from 'swiper/modules'
import Image from "next/image";
import axios from "axios";

//I USED SWIPER.JS FOR SLIDER WHICH IS THIRD PARTY LIBRARY
export default function LandingPageSlider() {
  // STATE FOR ALL BANNER DETAILS FROM GET API
  const [allBannersData, setAllBannersData] = useState([]);
  // dynamic height to perfectly fit screen beneath sticky header on desktop
  const [bannerHeight, setBannerHeight] = useState(null);

  // FETCHING ALL BANNER DETAILS FROM DB
  const fetchAllBanners = async () => {
    try {
      const response = await axios.get("/api/admin/banners");
      const allBanners = response.data.data?.filter((banner) => banner.isActive !== false);
      setAllBannersData(allBanners);
    } catch (error) {
      console.log("Internal Error While Fetching the Banners");
    }
  };

  // FOR API CALL
  useEffect(() => {
    fetchAllBanners();
  }, []);

  // Compute banner height: Make it full screen on all devices
  useEffect(() => {
    const computeHeight = () => {
      const vh = window.innerHeight;
      // Set to full viewport height for true full screen experience
      setBannerHeight(vh);
    };
    computeHeight();
    window.addEventListener("resize", computeHeight);
    return () => window.removeEventListener("resize", computeHeight);
  }, []);

  return (
  <section className="w-full h-screen relative">
      <Swiper
        slidesPerView={1}
        spaceBetween={0}
        loop={true}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        autoplay={{
          delay: 3000, // 3 seconds between slides
          disableOnInteraction: false, // Keep autoplay even after interaction
        }}
        modules={[Pagination, Navigation, Autoplay]} // Add Autoplay to modules array
        className="mySwiper banner-swiper h-full w-full"
      >
        {/* RENDERING THE BANNERS DETAILS HERE */}
        {allBannersData?.map((banner , index) => {

          const {id , isActive, imageUrl ,title} = banner

          return (
            <SwiperSlide key={id} className={isActive ? "" : "hidden"} >
              <div className="relative w-full h-screen">
                <Image
                  src={imageUrl}
                  alt={title || "banner"}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="select-none object-cover"
                />
                {/* subtle bottom gradient to help controls readability */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
