"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LoginRegisterForm from "@/components/forms/LoginRegisterForm";

const Page = () => {
  return (
    <div>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <LoginRegisterForm />
      </main>
      <Footer />
    </div>
  );
};

export default Page;
