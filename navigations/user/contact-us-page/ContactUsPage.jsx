import ContactUs from '@/components/forms/ContactUs'
import Link from "next/link";
import React from 'react'

function ContactUsPage() {
  return (
    <>
      <div className="bg-gradient-to-r from-[#e0e7ff] to-[#f3e8ff] text-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-2 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Contact Us</h2>
              <p className="text-lg text-blue-900 max-w-2xl">Get in touch with our team for support or inquiries.</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-2 text-blue-900">
                <Link href="/" className="hover:text-white transition-colors cursor-pointer">Home</Link>
                <span>/</span>
                <span className="text-blue-900 font-medium">Contact Us</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ContactUs/>
    </>
  )
}

export default ContactUsPage