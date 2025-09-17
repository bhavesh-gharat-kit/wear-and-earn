// Communication Configuration
// Centralized configuration for WhatsApp, Email, and SMS settings

export const COMMUNICATION_CONFIG = {
  whatsapp: {
    businessNumber: "919876543210", // Replace with your actual business WhatsApp number (with country code, no + or spaces)
    defaultMessage: "Hello! I'm interested in your products and services. Can you please help me?",
    referralMessage: "Check out this amazing website for premium products: {url} \n\nUse my referral link to get started!",
  },
  
  email: {
    defaultEmail: "support@wearandearn.com", // Replace with your business email
    referralSubject: "Amazing Products - Check This Out!",
    referralBody: "Hi there!\n\nI found this amazing website with premium products that I think you'd love.\n\nCheck it out here: {url}\n\nBest regards!",
  },
  
  sms: {
    referralMessage: "Check out this amazing website for premium products: {url} - I think you'll love it!",
  },
  
  // Pages where WhatsApp button should NOT appear
  excludedPaths: ['/admin', '/login', '/register', '/login-register'],
  
  // Custom styling options
  styling: {
    whatsappButtonSize: 'w-14 h-14', // Tailwind classes for button size
    whatsappButtonColor: 'bg-green-500 hover:bg-green-600',
    animationClass: 'animate-bounce hover:animate-none',
  }
};

// Helper functions
export const formatWhatsAppUrl = (number, message) => {
  const cleanNumber = number.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
};

export const formatEmailUrl = (email, subject, body) => {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
};

export const formatSMSUrl = (message) => {
  const encodedMessage = encodeURIComponent(message);
  return `sms:?body=${encodedMessage}`;
};

// Replace placeholders in messages
export const replacePlaceholders = (message, replacements = {}) => {
  let formattedMessage = message;
  Object.keys(replacements).forEach(key => {
    const placeholder = `{${key}}`;
    formattedMessage = formattedMessage.replace(new RegExp(placeholder, 'g'), replacements[key]);
  });
  return formattedMessage;
};