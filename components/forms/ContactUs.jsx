"use client";

import React, { useState } from "react";
import { SlLocationPin } from "react-icons/sl";
import { IoCallOutline } from "react-icons/io5";
import { CiMail } from "react-icons/ci";
import axios from "axios";
import toast from "react-hot-toast";

function ContactUs() {
  const contactFormInitilizer = {
    name: "",
    email: "",
    subject: "",
    message: "",
  };
  const [contactForm, setContactForm] = useState(contactFormInitilizer);

  const handleContactFormInput = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/contact", contactForm);
      if (response.status === 201) {
        toast.success("Form Submitted Successfully", { duration: 1000 });
        setTimeout(() => {
          setContactForm(contactFormInitilizer);
        }, 1200);
      }
    } catch (error) {
      console.log("Internal Error While Sending Form", error);
      toast.error("Internal Error While Sending Form");
    }
  };
  

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* contact section */}
      <section
        id="contact-2"
        className="contact-2 section py-16 px-4 sm:px-6 lg:px-8 w-full bg-white dark:bg-gray-900"
      >
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Address Section */}
            <div className="flex col-span-2 flex-col items-center justify-center text-center hover:scale-105  duration-300 shadow-sm hover:shadow-md transition-all rounded p-2 bg-white dark:bg-gray-800 border dark:border-gray-700">
              <i className="text-2xl rounded-full p-5 border-dashed border text-black dark:text-white dark:border-gray-600">
                <SlLocationPin />
              </i>
              <h3 className="text-xl font-semibold mt-3 text-[#f0a019] dark:text-amber-400">
                Address
              </h3>
              <p className="mt-2 text-gray-700 dark:text-gray-300">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
                in nibh vehicula, facilisis magna ut, consectetur lorem.
              </p>
            </div>
            {/* End Address Section */}

            {/* Call Us Section */}
            <div className="flex flex-col items-center justify-center text-center hover:scale-105 hover:shadow-md transition-all duration-300 shadow-sm rounded bg-white dark:bg-gray-800 border dark:border-gray-700">
              <i className="text-2xl rounded-full p-5 border-dashed border text-black dark:text-white dark:border-gray-600">
                <IoCallOutline />
              </i>
              <h3 className="text-xl font-semibold mt-3 text-[#f0a019] dark:text-amber-400">
                Call Us
              </h3>
              <p className="mt-2 text-gray-700 dark:text-gray-300">+91 123456789</p>
            </div>
            {/* End Call Us Section */}

            {/* Email Us Section */}
            <div className="flex flex-col items-center justify-center text-center hover:scale-105 duration-300 rounded shadow-sm hover:shadow-md transition-all bg-white dark:bg-gray-800 border dark:border-gray-700">
              <i className="text-2xl rounded-full p-5 border-dashed border text-black dark:text-white dark:border-gray-600">
                <CiMail />
              </i>
              <h3 className="text-xl font-semibold mt-3 text-[#f0a019] dark:text-amber-400">
                Email Us
              </h3>
              <p className="mt-2 text-gray-700 dark:text-gray-300">admin@wearearn.com</p>
            </div>
            {/* End Email Us Section */}
          </div>

          {/* Google Maps and Contact Form Section */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Google Maps */}
            <div>
              <iframe
                className="w-full h-96 rounded-lg hover:scale-105 transition-transform duration-300 border dark:border-gray-700"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1883.3974305750978!2d72.8534700983948!3d19.24777010000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b0e13820c495%3A0xc387b3379071e7f6!2sVini%20Gardens%20CHSL%2C%20Bldg%201%2C%20A%20Wing!5e0!3m2!1sen!2sin!4v1749626080278!5m2!1sen!2sin"
                frameBorder="0"
                style={{ border: "0" }}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
            {/* End Google Maps */}

            {/* Contact Form */}
            <div>
              <form
                onSubmit={handleContactFormSubmit}
                id="contactForm"
                className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg mx-auto hover:scale-105 transition-transform duration-300 max-sm:px-2 border dark:border-gray-700"
              >
                <div className="grid gap-4">
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="name"
                      className="form-control p-3 border border-gray-300 dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your Name"
                      required
                      value={contactForm.name}
                      onChange={handleContactFormInput}
                    />
                  </div>

                  <div className="col-md-6">
                    <input
                      type="email"
                      name="email"
                      className="form-control p-3 border border-gray-300 dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your Email"
                      required
                      onChange={handleContactFormInput}
                      value={contactForm.email}
                    />
                  </div>

                  <div className="col-md-12">
                    <input
                      type="text"
                      name="subject"
                      className="form-control p-3 border border-gray-300 dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Subject"
                      value={contactForm.subject}
                      onChange={handleContactFormInput}
                    />
                  </div>

                  <div className="col-md-12">
                    <textarea
                      name="message"
                      rows="6"
                      className="form-control p-3 border border-gray-300 dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Message"
                      value={contactForm.message}
                      onChange={handleContactFormInput}
                    ></textarea>
                  </div>

                  <div className="col-md-12 text-center">
                    <div
                      className="loading text-primary mb-2"
                      style={{ display: "none" }}
                    >
                      Loading...
                    </div>
                    <div className="error-message text-danger mb-2"></div>
                    <div className="sent-message text-success mb-2"></div>
                    <button
                      type="submit"
                      onSubmit={handleContactFormSubmit}
                      id="sendBtn"
                      className="btn btn-primary px-6 py-3 text-white bg-purple-700 dark:bg-purple-600 rounded-md hover:bg-purple-600 dark:hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </form>
            </div>
            {/* End Contact Form */}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactUs;
