"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CallToAction from "./CallToAction";

function LayoutPage({ children }) {
  return (
    <>
      <Navbar />
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10">
        {" "}
        {children}{" "}
      </section>
      <CallToAction />
      <Footer />
    </>
  );
}

export default LayoutPage;
