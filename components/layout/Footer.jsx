import Link from "next/link";
import React from "react";
import { FaFacebook } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaPinterest } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const socialMediaItems = [
  {
    socialMediaName  :"Facebook",
    socialMediaIcon : <FaFacebook/>,
    socialMediaLink : ""
  },
  {
    socialMediaName  :"Youtube",
    socialMediaIcon : <FaYoutube/>,
    socialMediaLink : ""
  },
  {
    socialMediaName  :"Twitter",
    socialMediaIcon : <FaXTwitter/>,
    socialMediaLink : ""
  },
  {
    socialMediaName  :"Instagram",
    socialMediaIcon : <FaInstagram/>,
    socialMediaLink : ""
  },
  {
    socialMediaName  :"Pinterest",
    socialMediaIcon : <FaPinterest/>,
    socialMediaLink : ""
  },
]

function Footer() {
  return (
  <footer className="w-full">

      {/* FOOTER MAIN */}
      <div className="footer-main bg-[#ffffff] text-slate-900 px-4 sm:px-6 lg:px-8 py-10">
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* About Section */}
            <div className="footer-widget">
              <a
                href="index.php"
                className="logo text-3xl font-bold text-[#f0a019]"
              >
                wearandearn
              </a>
              <p className="mt-4 text-sm">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro
                quasi ipsam ducimus eligendi! Id laudantium aspernatur a. Minus
                possimus reiciendis, vel blanditiis aut est dignissimos!
              </p>
              <p className="text-sm">Experience the Beauty of Indian Style</p>
            </div>

            {/* Contact Section */}
            <div className="footer-widget">
              <h4 className="text-xl font-semibold mb-4 text-[#f0a019] ">Contact</h4>
              <div className="footer-contact">
                <div className="contact-item flex items-start mb-3">
                  <i className="bi bi-geo-alt text-xl mr-2"></i>
                  <span className="text-sm">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Nullam in nibh vehicula, facilisis magna ut, consectetur
                    lorem.
                  </span>
                </div>
                <div className="contact-item flex items-start mb-3">
                  <i className="bi bi-telephone text-xl mr-2"></i>
                  <span className="text-sm">+91 123456789</span>
                </div>
                <div className="contact-item flex items-start">
                  <i className="bi bi-envelope text-xl mr-2"></i>
                  <span className="text-sm">admin@wearearn.com</span>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div className="footer-widget">
              <h4 className="text-xl font-semibold mb-4 text-[#f0a019] ">Support</h4>
              <ul className="footer-links space-y-2">
                <li>
                  <Link
                    href="/products"
                    className="text-sm hover:text-orange-500"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/orders"
                    className="text-sm hover:text-orange-500"
                  >
                    Order Status
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Section */}
            <div className="footer-widget">
              <h4 className="text-xl font-semibold mb-4 text-[#f0a019] ">Company</h4>
              <ul className="footer-links space-y-2">
                <li>
                  <Link href="/about-us" className="text-sm hover:text-orange-500">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact-us"
                    className="text-sm hover:text-orange-500"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="text-sm hover:text-orange-500">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div className="footer-widget">
              <h5 className="text-xl font-semibold mb-4">Follow Us</h5>
              <div className="social-icons flex gap-4">
                {
                  socialMediaItems.map( (item , i) => {
                    return (
                      <span key={i} >
                        <Link href={""} className="text-2xl" > {item.socialMediaIcon} </Link>
                      </span>
                    )
                  } )
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* FOOTER BOTTOM */}
      <div className="footer-bottom bg-[#f3f3f6] text-slate-800 py-4 px-4 sm:px-6 lg:px-8 ">
        <div className="w-full px-0 flex flex-col justify-center items-center">
          {/* Legal Links */}
          <div className="legal-links text-center md:text-left mb-4">
            <Link href="/terms-and-conditions" className="text-sm hover:text-orange-500">
              Terms and Conditions
            </Link>
          </div>

          {/* Copyright Section */}
          <div className="copyright text-center mb-4 font-medium">
            <p className="text-sm">
              © <span>Copyright</span>
              <span>{new Date().getFullYear()} </span>
              <strong className="sitename text-purple-700">wearearn</strong>.
              All Rights Reserved.
            </p>
          </div>

          {/* Credits Section */} 
          <div className="credits text-center md:text-left font-medium">
            <a className="text-sm">Developed by </a>
            <a
              href="https://kumarinfotech.net/"
              className="text-sm hover:text-orange-500"
            >
              kumarinfotech
            </a>
          </div>
        </div>
      </div>
      

      {/* FLOATING SOCILA MEDIA FEATURES*/}
      

    </footer>
  );
}

export default Footer;
