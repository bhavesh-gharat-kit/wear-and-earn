"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CallToAction from "./CallToAction";
import ReferralBanner from "@/components/referral/ReferralBanner";

function LayoutPage({ children }) {
  return (
    <>
      <ReferralBanner />
      <Navbar />
      <section className="w-full">
        {" "}
        {children}{" "}
      </section>
      <CallToAction />
      <Footer />
    </>
  );
}

export default LayoutPage;
