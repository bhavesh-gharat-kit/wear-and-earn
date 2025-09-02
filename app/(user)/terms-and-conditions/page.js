import Link from 'next/link';

export default function TermsAndConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        
        <nav className="flex space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900">ToS</span>
        </nav>

        <p className="text-sm text-gray-600 mb-8">Last Updated: February 27, 2025</p>

        <div className="prose max-w-none">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Terms of Service</h2>
          <p className="mb-6">Please read these terms of service carefully before using our services.</p>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h3>
            <p className="mb-4">
              By accessing our website and services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, you are prohibited from using our services.
            </p>
            <p className="mb-4">
              These terms apply to all users, visitors, and others who access or use our services.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Intellectual Property Rights</h3>
            <p className="mb-4">
              Our service and its original content are owned by us and protected under various intellectual property laws.
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>All content is our exclusive property</li>
              <li>You may not copy or modify the content</li>
              <li>Trademarks may not be used without permission</li>
              <li>Personal, non-commercial use only</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h3>
            <p className="mb-4">
              Creating an account requires accurate and current information. Any breach may lead to account termination.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Important Notice</h4>
              <p>You are responsible for safeguarding your password and any activity under your account.</p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">4. Prohibited Activities</h3>
            <p className="mb-4">You may not use the service for any unauthorized purpose.</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Systematic data retrieval</li>
              <li>Publishing malicious content</li>
              <li>Unauthorized framing</li>
              <li>Attempted unauthorized access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">5. Disclaimers</h3>
            <p className="mb-4">The service is provided &ldquo;AS IS&rdquo; without warranties of any kind.</p>
            <p className="mb-4">We do not guarantee:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>That the service will meet your requirements</li>
              <li>Uninterrupted or error-free use</li>
              <li>Accurate results or fixes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h3>
            <p className="mb-4">
              We are not liable for any indirect, incidental, or consequential damages related to your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">7. Indemnification</h3>
            <p className="mb-4">
              You agree to defend and hold us harmless from any liabilities or expenses related to your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">8. Termination</h3>
            <p className="mb-4">
              We may suspend or terminate your account at any time for violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">9. Governing Law</h3>
            <p className="mb-4">
              These Terms are governed by the laws of [Your Country] without regard to conflicts of law.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h3>
            <p className="mb-4">
              We may update these Terms at any time. Continued use implies acceptance of the new Terms.
            </p>
            <p className="font-semibold">
              By continuing to use our service after updates, you agree to the revised Terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
