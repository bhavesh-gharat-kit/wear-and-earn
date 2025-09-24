'use client'
import ProductSlider from '@/components/product/ProductSlider'
import HeroSlider from '@/components/layout/HeroSlider'
import React, { useEffect } from 'react'

function HomePage() {
  // Track visitor when home page loads
  useEffect(() => {
    const trackVisitor = async () => {
      try {
        await fetch('/api/visitor/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}) // Can add country/city data if needed
        })
      } catch (error) {
        console.log('Visitor tracking failed:', error) // Silent fail - don't disrupt user experience
      }
    }

    trackVisitor()
  }, [])
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Compact Mobile Hero for Rectangle Images */}
  <div className="w-full h-[35vh] xs:h-[40vh] sm:h-[45vh] md:h-[70vh] overflow-hidden">
        <HeroSlider/>
      </div>
      
      {/* Mobile First Container */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 bg-white dark:bg-gray-900">
        {/* Product Section with Mobile Title */}
        <section className="py-6 sm:py-8 md:py-12">
          {/* Removed Featured Products heading and subtitle */}
          <ProductSlider />
        </section>
        
        {/* Mobile Optimized View More Button */}
        <div className="flex justify-center py-4 sm:py-6 md:py-8">
          <a
            href="/products"
            className="w-full max-w-xs sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-base sm:text-lg font-medium text-white rounded-lg transition-colors text-center"
          >
            View All Products
          </a>
        </div>


        {/* Who We Are Section - Inlined */}
        <WhoWeAreSection />
        
        {/* Stats Section - Inlined */}
        <StatsSection />
        
        {/* Testimonials Section - Inlined */}
        <TestimonialsSection />
      </div>
    </div>
  )
}

// Mobile Optimized Who We Are Section
function WhoWeAreSection() {
  return (
    <section className="py-8 sm:py-12 md:py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-4">Who We Are</h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-2">
            We are passionate about bringing you the finest quality products at unbeatable prices. 
            Our commitment to excellence and customer satisfaction drives everything we do.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
          <div className="order-2 md:order-1">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">Our Mission</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
              To provide high-quality products that enhance your lifestyle while 
              offering exceptional value and customer service that exceeds expectations.
            </p>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-center text-sm sm:text-base text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-3 flex-shrink-0"></span>
                Quality guaranteed on every purchase
              </li>
              <li className="flex items-center text-sm sm:text-base text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-3 flex-shrink-0"></span>
                Fast and reliable shipping
              </li>
              <li className="flex items-center text-sm sm:text-base text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-3 flex-shrink-0"></span>
                24/7 customer support
              </li>
            </ul>
          </div>
          <div className="text-center order-1 md:order-2 mb-6 md:mb-0">
            <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 mx-auto bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <span className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">WE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Mobile Optimized Stats Section
function StatsSection() {
  return (
    <section className="py-8 sm:py-12 md:py-16 bg-amber-600 dark:bg-amber-700">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center text-white">
          <div className="p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">1000+</div>
            <div className="text-sm sm:text-base md:text-lg">Happy Customers</div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">500+</div>
            <div className="text-sm sm:text-base md:text-lg">Products</div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">50+</div>
            <div className="text-sm sm:text-base md:text-lg">Categories</div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">99%</div>
            <div className="text-sm sm:text-base md:text-lg">Satisfaction Rate</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Mobile Optimized Testimonials Section
function TestimonialsSection() {
  return (
    <section className="py-8 sm:py-12 md:py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-4">What Our Customers Say</h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 px-2">
            Don't just take our word for it - hear from our satisfied customers
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
            <div className="mb-3 sm:mb-4">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                "Amazing quality products and fast delivery. Highly recommended!"
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                J
              </div>
              <div>
                <div className="font-semibold text-sm sm:text-base text-gray-800 dark:text-white">John Doe</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Verified Customer</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
            <div className="mb-3 sm:mb-4">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                "Excellent customer service and great value for money!"
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                S
              </div>
              <div>
                <div className="font-semibold text-sm sm:text-base text-gray-800 dark:text-white">Sarah Smith</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Verified Customer</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700 sm:col-span-2 md:col-span-1">
            <div className="mb-3 sm:mb-4">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                "Best shopping experience I've had online. Will definitely order again!"
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                M
              </div>
              <div>
                <div className="font-semibold text-sm sm:text-base text-gray-800 dark:text-white">Mike Johnson</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Verified Customer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomePage