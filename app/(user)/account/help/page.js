import React from 'react';
import Link from 'next/link';
import { 
  FaQuestionCircle, 
  FaShoppingCart, 
  FaUser, 
  FaCreditCard, 
  FaTruck, 
  FaUndo, 
  FaShield, 
  FaPhone, 
  FaEnvelope, 
  FaComments,
  FaSearch,
  FaChevronRight
} from 'react-icons/fa';

const helpCategories = [
  {
    id: 'ordering',
    title: 'Ordering & Products',
    icon: <FaShoppingCart className="text-blue-500" />,
    questions: [
      {
        question: 'How do I place an order?',
        answer: 'Browse our products, add items to cart, proceed to checkout, fill in your details, and complete payment. You\'ll receive an order confirmation email.'
      },
      {
        question: 'Can I modify my order after placing it?',
        answer: 'Orders can be modified within 1 hour of placement. Contact our support team immediately for changes.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets through our secure payment gateway.'
      }
    ]
  },
  {
    id: 'account',
    title: 'Account & Profile',
    icon: <FaUser className="text-green-500" />,
    questions: [
      {
        question: 'How do I create an account?',
        answer: 'Click on "Register" in the top menu, fill in your details including referral code (if any), and verify your email address.'
      },
      {
        question: 'I forgot my password. What should I do?',
        answer: 'Click "Forgot Password" on the login page, enter your email address, and follow the reset instructions sent to your email.'
      },
      {
        question: 'How do I update my profile information?',
        answer: 'Go to Account Settings from your dashboard and update your personal information, address, or contact details.'
      }
    ]
  },
  {
    id: 'mlm',
    title: 'MLM & Rewards',
    icon: <FaCreditCard className="text-purple-500" />,
    questions: [
      {
        question: 'How does the MLM system work?',
        answer: 'Our MLM program allows you to earn commissions by referring others and building a network. You earn from direct referrals and team performance.'
      },
      {
        question: 'When do I receive my commissions?',
        answer: 'Commissions are calculated weekly and paid out according to our payout schedule. Check your wallet for current earnings.'
      },
      {
        question: 'How do I refer someone?',
        answer: 'Share your unique referral code or link. When someone registers using your code and makes a purchase, you earn commissions.'
      }
    ]
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery',
    icon: <FaTruck className="text-orange-500" />,
    questions: [
      {
        question: 'What are your shipping charges?',
        answer: 'Shipping is free for orders above ₹999. For orders below this amount, standard shipping charges apply based on location.'
      },
      {
        question: 'How long does delivery take?',
        answer: 'Standard delivery takes 3-7 business days. Express delivery (1-3 days) is available for select locations at additional cost.'
      },
      {
        question: 'How can I track my order?',
        answer: 'Once shipped, you\'ll receive a tracking number via email/SMS. Use this to track your order on our website or courier partner\'s site.'
      }
    ]
  },
  {
    id: 'returns',
    title: 'Returns & Refunds',
    icon: <FaUndo className="text-red-500" />,
    questions: [
      {
        question: 'What is your return policy?',
        answer: 'We offer 7-day returns for most items. Products must be unused, in original packaging with tags attached.'
      },
      {
        question: 'How do I initiate a return?',
        answer: 'Go to your Order History, select the item you want to return, choose a reason, and schedule a pickup or drop-off.'
      },
      {
        question: 'When will I receive my refund?',
        answer: 'Refunds are processed within 7-10 business days after we receive and verify the returned item.'
      }
    ]
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    icon: <FaShield className="text-indigo-500" />,
    questions: [
      {
        question: 'Is my personal information safe?',
        answer: 'Yes, we use industry-standard encryption and security measures to protect your personal and financial information.'
      },
      {
        question: 'How do you handle my data?',
        answer: 'We follow strict privacy policies and only use your data for order processing, account management, and improving our services.'
      },
      {
        question: 'Can I delete my account?',
        answer: 'Yes, you can request account deletion by contacting our support team. Please note this action is irreversible.'
      }
    ]
  }
];

const contactMethods = [
  {
    icon: <FaPhone className="text-blue-500" />,
    title: 'Phone Support',
    description: 'Call us for immediate assistance',
    contact: '+91 123456789',
    availability: 'Mon-Sat, 9 AM - 7 PM'
  },
  {
    icon: <FaEnvelope className="text-green-500" />,
    title: 'Email Support',
    description: 'Send us your queries via email',
    contact: 'support@wearearn.com',
    availability: '24/7 Response within 24 hours'
  },
  {
    icon: <FaComments className="text-purple-500" />,
    title: 'Live Chat',
    description: 'Chat with our support team',
    contact: 'Available on website',
    availability: 'Mon-Sat, 9 AM - 7 PM'
  }
];

function HelpPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState(null);

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.questions.some(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <>
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#e0e7ff] to-[#f3e8ff] text-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Help Center</h1>
              <p className="text-lg text-blue-900 max-w-2xl">
                Find answers to frequently asked questions and get the help you need
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-2 text-blue-900">
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
                <span>/</span>
                <Link href="/account" className="hover:text-white transition-colors">
                  Account
                </Link>
                <span>/</span>
                <span className="text-blue-900 font-medium">Help</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Content */}
      <section className="py-12 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md mx-auto">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link href="/account/orders" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <FaTruck className="text-3xl text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Track Your Order</h3>
              <p className="text-gray-600 text-sm">Check the status of your recent orders</p>
            </Link>
            
            <Link href="/contact-us" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <FaPhone className="text-3xl text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Contact Support</h3>
              <p className="text-gray-600 text-sm">Get in touch with our support team</p>
            </Link>
            
            <Link href="/account/settings" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <FaUser className="text-3xl text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Account Settings</h3>
              <p className="text-gray-600 text-sm">Manage your profile and preferences</p>
            </Link>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            
            {filteredCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{category.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                  </div>
                  <FaChevronRight 
                    className={`text-gray-400 transform transition-transform ${
                      activeCategory === category.id ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
                
                {activeCategory === category.id && (
                  <div className="px-6 pb-6">
                    <div className="space-y-4">
                      {category.questions.map((faq, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                          <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Methods */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Still Need Help?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="text-3xl mb-4 flex justify-center">{method.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{method.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                  <p className="font-semibold text-gray-900">{method.contact}</p>
                  <p className="text-xs text-gray-500 mt-1">{method.availability}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Resources */}
          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">Additional Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/terms-and-conditions" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                <FaChevronRight className="mr-2" />
                Terms & Conditions
              </Link>
              <Link href="/about-us" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                <FaChevronRight className="mr-2" />
                About Us
              </Link>
              <Link href="/products" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                <FaChevronRight className="mr-2" />
                Browse Products
              </Link>
              <Link href="/account" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                <FaChevronRight className="mr-2" />
                Account Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default HelpPage;