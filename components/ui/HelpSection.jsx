export default function HelpSection() {
  return (
    <section className="w-full bg-transparent">
      <div className="mx-auto my-8 px-20 max-sm:px-4 max-w-screen-2xl">
        <div className="p-6 bg-gray-800 border-2 border-yellow-500 rounded-lg transition-colors">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="md:w-2/3 text-center md:text-left">
              <p className="text-2xl font-extrabold text-yellow-400 mb-2">Do You Need Help?</p>
              <span className="text-lg font-semibold text-gray-100">
                We're here to help you with all your fashion needs.<br className="hidden sm:block" />
                <span className="block text-gray-300">Contact us anytime for assistance!</span>
              </span>
            </div>
            <div className="md:w-1/3 text-center">
              <a
                href="tel:+91123456789"
                className="inline-block bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-lg py-3 px-6 rounded-full transition-colors"
              >
                Call Us Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
