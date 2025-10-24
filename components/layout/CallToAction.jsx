import React from "react";

function CallToAction() {
  return (
    <div className="container mx-auto my-8 px-20 max-sm:px-4 max-w-screen-2xl ">
      <div className="p-6 bg-gray-100 dark:bg-gray-800 border-2 border-[#3f2471] dark:border-purple-600 rounded-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Text Section */}
          <div className="md:w-2/3 text-center md:text-left">
            <p className="text-2xl font-extrabold text-orange-500 dark:text-orange-400 mb-2">
              Do You Need Help?
            </p>
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              We're here to help you with all your fashion needs.
              <br className="hidden sm:block" />
              Contact us anytime for assistance!
            </span>
          </div>

          {/* Call Button */}
          <div className="md:w-1/3 text-center">
            <a
              href="tel:+9193261 52855"
              className="inline-block bg-yellow-500 dark:bg-yellow-600 hover:bg-yellow-600 dark:hover:bg-yellow-500 text-white font-semibold text-lg py-3 px-6 rounded-full transition"
            >
              Call Us Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallToAction;
