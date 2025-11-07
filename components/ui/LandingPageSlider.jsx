"use client";
import React, { useEffect, useState } from "react";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/autoplay"; // Import the autoplay CSS

import "./styles.css";

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

  // Compute banner height: on desktop, fill viewport minus sticky header height
  useEffect(() => {
    const computeHeight = () => {
      const header = document.getElementById("header");
      const headerH = header ? header.offsetHeight : 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw >= 1024) {
        // desktop: fill remaining viewport height
        const h = Math.max(vh - headerH, 420); // ensure sensible minimum
        setBannerHeight(h);
      } else if (vw >= 640) {
        // tablet: tall but not full viewport
        setBannerHeight(Math.max(Math.floor(vh * 0.6), 360));
      } else {
        // mobile
        setBannerHeight(Math.max(Math.floor(vh * 0.45), 260));
      }
    };
    computeHeight();
    window.addEventListener("resize", computeHeight);
    return () => window.removeEventListener("resize", computeHeight);
  }, []);

  return (
  <section className="w-full mt-0">
      <Swiper
        slidesPerView={1}
        spaceBetween={30}
        loop={allBannersData && allBannersData.length > 1} // Only enable loop if we have more than 1 banner
        pagination={{
          clickable: true,
        }}
        navigation={true}
        autoplay={{
          delay: 3000, // 3 seconds between slides
          disableOnInteraction: false, // Keep autoplay even after interaction
        }}
        modules={[Pagination, Navigation, Autoplay]} // Add Autoplay to modules array
        className="mySwiper banner-swiper"
      >
        {/* RENDERING THE BANNERS DETAILS HERE */}
        {allBannersData?.map((banner , index) => {

          const {id , isActive, imageUrl ,title} = banner

          return (
            <SwiperSlide key={id} className={isActive ? "" : "hidden"} >
              <div
                className="relative w-full"
                style={{ height: bannerHeight ? `${bannerHeight}px` : undefined }}
              >
                <Image
                  src={imageUrl}
                  alt={title || "banner"}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="select-none"
                  style={{ objectFit: "cover" }}
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
