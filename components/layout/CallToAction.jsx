import React from "react";

function CallToAction() {
  return (
    <div className="container mx-auto my-8 px-20 max-sm:px-4 max-w-screen-2xl ">
      <div className="p-6 bg-gray-100 border-2 border-[#3f2471] rounded-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Text Section */}
          <div className="md:w-2/3 text-center md:text-left">
            <p className="text-2xl font-extrabold text-orange-500 mb-2">
              Do You Need Help?
            </p>
            <span className="text-lg font-semibold text-gray-800">
              Supremesilkshub is here to assist you. Feel free to call us.
              <br className="hidden sm:block" />
              Happy to help you...
            </span>
          </div>

          {/* Call Button */}
          <div className="md:w-1/3 text-center">
            <a
              href="tel:+91123456789"
              className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-semibold text-lg py-3 px-6 rounded-full transition"
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
