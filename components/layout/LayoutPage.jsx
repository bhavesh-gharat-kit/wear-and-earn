"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CallToAction from "./CallToAction";

function LayoutPage({ children }) {
  return (
    <>
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
