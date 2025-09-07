import ProductSlider from '@/components/product/ProductSlider'
import HeroSlider from '@/components/layout/HeroSlider'
import React from 'react'

function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeroSlider/>
      
      <div className="px-4 sm:px-6 md:px-8 lg:px-10 bg-white dark:bg-gray-900">
        <ProductSlider />
        
        <div className="flex justify-center py-4">
          <a
            href="/products"
            className="btn bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-xl text-white rounded transition-colors"
          >
            View More
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

// Inlined Who We Are Section
function WhoWeAreSection() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Who We Are</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            We are passionate about bringing you the finest quality products at unbeatable prices. 
            Our commitment to excellence and customer satisfaction drives everything we do.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Our Mission</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              To provide high-quality products that enhance your lifestyle while 
              offering exceptional value and customer service that exceeds expectations.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                Quality guaranteed on every purchase
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                Fast and reliable shipping
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                24/7 customer support
              </li>
            </ul>
          </div>
          <div className="text-center">
            <div className="w-64 h-64 mx-auto bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <span className="text-white text-6xl font-bold">WE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Inlined Stats Section
function StatsSection() {
  return (
    <section className="py-16 bg-amber-600 dark:bg-amber-700">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 text-center text-white">
          <div>
            <div className="text-4xl font-bold mb-2">1000+</div>
            <div className="text-lg">Happy Customers</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">500+</div>
            <div className="text-lg">Products</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">50+</div>
            <div className="text-lg">Categories</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">99%</div>
            <div className="text-lg">Satisfaction Rate</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Inlined Testimonials Section
function TestimonialsSection() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">What Our Customers Say</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Don't just take our word for it - hear from our satisfied customers
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-300">
                "Amazing quality products and fast delivery. Highly recommended!"
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                J
              </div>
              <div>
                <div className="font-semibold text-gray-800 dark:text-white">John Doe</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Verified Customer</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-300">
                "Excellent customer service and great value for money!"
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                S
              </div>
              <div>
                <div className="font-semibold text-gray-800 dark:text-white">Sarah Smith</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Verified Customer</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-300">
                "Best shopping experience I've had online. Will definitely order again!"
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                M
              </div>
              <div>
                <div className="font-semibold text-gray-800 dark:text-white">Mike Johnson</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Verified Customer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomePage