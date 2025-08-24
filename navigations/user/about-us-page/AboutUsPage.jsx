import React from "react";
import {
  FaBullseye,
  FaCheckCircle,
  FaClipboardList,
  FaPlayCircle,
} from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

function AboutUsPage() {
  return (
    <>
      {/* page title */}
      <div className="bg-gradient-to-r from-[#e0e7ff] to-[#f3e8ff] text-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-2 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">About Us</h2>
              <p className="text-lg text-blue-900 max-w-2xl">
                Learn more about our mission, values, and team.
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-2 text-blue-900">
                <Link
                  href="/"
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Home
                </Link>
                <span>/</span>
                <span className="text-blue-900 font-medium">About Us</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inlined AboutUsSection */}
      <section
        id="about-2"
        className="about-2 section py-16 bg-gray-50 w-full px-4 sm:px-6 lg:px-8"
      >
        <div className="w-full">
          <span className="section-badge text-black p-3 rounded-2xl bg-slate-200 w-fit flex items-center">
            <FaBullseye className="mr-2" />
            About Us
          </span>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div>
              <h2 className="about-title text-4xl font-semibold text-[#f0a019]">
                Crafting Style, Comfort & Confidence
              </h2>
              <p className="about-description text-gray-700 mt-4">
                We are a modern garment brand dedicated to creating fashion that
                blends contemporary design with unmatched comfort. Our goal is
                to help you express your individuality through high-quality
                clothing that feels as good as it looks.
              </p>
            </div>

            <div>
              <p className="about-text text-gray-700 mt-4">
                From everyday essentials to statement pieces, our collections
                are thoughtfully crafted using premium fabrics, modern cuts, and
                sustainable practices. Whether casual, formal, or festive
                wear—we have something for every occasion.
              </p>
              <p className="about-text text-gray-700 mt-4">
                Join thousands who trust us to elevate their wardrobe. Discover
                fashion that fits your style, your story, and your standards.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            <div className="feature-box p-6 bg-white shadow-lg rounded-lg hover:scale-105 transform transition-all">
              <div className="icon-box text-4xl text-black p-3 rounded-2xl bg-slate-200 w-fit mb-4 ">
                <FaBullseye />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                <a href="#" className="text-[#f0a019] hover:text-purple-700 ">
                  Our Vision
                </a>
              </h3>
              <p className="text-gray-600">
                To become a leading apparel brand known for blending style,
                comfort, and sustainability into every thread.
              </p>
            </div>

            <div className="feature-box p-6 bg-white shadow-lg rounded-lg hover:scale-105 text-left transform transition-all">
              <div className="icon-box text-4xl text-black p-3 rounded-2xl bg-slate-200 w-fit  mb-4">
                <FaCheckCircle />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                <a href="#" className="text-[#f0a019] hover:text-purple-700  ">
                  Quality Commitment
                </a>
              </h3>
              <p className="text-gray-600">
                Each garment goes through strict quality checks to ensure
                durability, comfort, and style that lasts.
              </p>
            </div>

            <div className="feature-box text-left p-6 bg-white shadow-lg rounded-lg hover:scale-105 transform transition-all">
              <div className="icon-box text-4xl text-black p-3 rounded-2xl bg-slate-200 w-fit mb-4">
                <FaClipboardList />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                <a href="#" className="text-[#f0a019] hover:text-purple-700">
                  Our Mission
                </a>
              </h3>
              <p className="text-gray-600">
                To empower individuals through fashion that aligns with their
                lifestyle, values, and self-expression.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <div className="video-box relative ">
              <Image
                width={300}
                height={300}
                src="/images/who-we-are-right-img.webp"
                className="img-fluid w-full max-h-[600px] object-cover h-auto rounded-lg"
                alt="Garments Showcase"
              />
              <a
                href="#"
                className="glightbox pulsating-play-btn absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-5xl"
              >
                <FaPlayCircle />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-100 w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full text-center aos-init aos-animate">
          <h3 className="h4 text-2xl text-gray-800 font-semibold my-16 max-sm:my-6">
            We have been in the garment industry for the last 25 years,
            specializing in maintenance, sales, corporate orders, and more..
          </h3>
        </div>

        <div className="w-full aos-init aos-animate">
          <h3 className="mb-4 text-2xl font-semibold text-[#f0a019]">CMD</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white rounded-lg shadow-xl">
              <h3 className="mb-2 text-2xl font-semibold text-[#f0a019]">
                Mr. Bhushan Jadhav
              </h3>
              <p className="text-gray-700">
                Having 25 years of experience in the garment industry.
                <br />
                Project programmer and developer.
              </p>
            </div>

            <div className="p-4 bg-white shadow-xl rounded-lg">
              <h3 className="mb-2 text-2xl font-semibold text-[#f0a019]">
                Anil K. Parte
              </h3>
              <p className="text-gray-700">
                Having 20 years of experience in the networking industry, with
                expertise in project planning and development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Inlined StatsSection */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Our Impact in Numbers
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Trusted by thousands of customers worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#f0a019] mb-2">500+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#f0a019] mb-2">1000+</div>
              <div className="text-gray-600">Products Sold</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#f0a019] mb-2">25+</div>
              <div className="text-gray-600">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#f0a019] mb-2">99%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default AboutUsPage;
