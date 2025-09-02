import Link from 'next/link';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* page title */}
      <div className="bg-gradient-to-r from-[#e0e7ff] to-[#f3e8ff] text-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Terms & Conditions</h2>
              <p className="text-lg text-blue-900 max-w-2xl">
                Please read these terms and conditions carefully before using our services.
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
                <span className="text-blue-900 font-medium">Terms & Conditions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-10">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Terms & Conditions</h2>
              <p className="mb-8 text-gray-600 text-lg">Please read these terms and conditions carefully before using our services.</p>

              <div className="space-y-8">
                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h3>
                  <p className="mb-4 text-gray-700 leading-relaxed">
                    By accessing our website and services, you agree to be bound by these Terms & Conditions and all applicable laws and regulations. If you do not agree, you are prohibited from using our services.
                  </p>
                  <p className="mb-4 text-gray-700 leading-relaxed">
                    These terms apply to all users, visitors, and others who access or use our services.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Intellectual Property Rights</h3>
                  <p className="mb-4 text-gray-700 leading-relaxed">
                    Our service and its original content are owned by us and protected under various intellectual property laws.
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                    <li>All content is our exclusive property</li>
                    <li>You may not copy or modify the content</li>
                    <li>Trademarks may not be used without permission</li>
                    <li>Personal, non-commercial use only</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h3>
                  <p className="mb-4 text-gray-700 leading-relaxed">
                    Creating an account requires accurate and current information. Any breach may lead to account termination.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Important Notice</h4>
                    <p className="text-gray-700">You are responsible for safeguarding your password and any activity under your account.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">4. Prohibited Activities</h3>
                  <p className="mb-4 text-gray-700 leading-relaxed">You may not use the service for any unauthorized purpose.</p>
                  <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                    <li>Systematic data retrieval</li>
                    <li>Publishing malicious content</li>
                    <li>Unauthorized framing</li>
                    <li>Attempted unauthorized access</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">5. Disclaimers</h3>
                  <p className="mb-4 text-gray-700 leading-relaxed">The service is provided &ldquo;AS IS&rdquo; without warranties of any kind.</p>
                  <p className="mb-4 text-gray-700 leading-relaxed">We do not guarantee:</p>
                  <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                    <li>That the service will meet your requirements</li>
                    <li>Uninterrupted or error-free use</li>
                    <li>Accurate results or fixes</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h3>
                  <p className="mb-4 text-gray-700 leading-relaxed">
                    We are not liable for any indirect, incidental, or consequential damages related to your use of the service.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">7. Indemnification</h3>
                  <p className="mb-4 text-gray-700 leading-relaxed">
                    You agree to defend and hold us harmless from any liabilities or expenses related to your use of the service.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">8. Termination</h3>
                  <p className="mb-4 text-gray-700 leading-relaxed">
                    We may suspend or terminate your account at any time for violation of these Terms.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">9. Governing Law</h3>
                  <p className="mb-4 text-gray-700 leading-relaxed">
                    These Terms are governed by the laws of [Your Country] without regard to conflicts of law.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h3>
                  <p className="mb-4 text-gray-700 leading-relaxed">
                    We may update these Terms at any time. Continued use implies acceptance of the new Terms.
                  </p>
                  <p className="font-semibold text-gray-900">
                    By continuing to use our service after updates, you agree to the revised Terms.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
