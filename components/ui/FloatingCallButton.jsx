"use client";
import React, { useState, useEffect } from 'react';

const FloatingCallButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Your business phone number (replace with actual number)
  const phoneNumber = "+917709258441";

  useEffect(() => {
    // Show button after component mounts (prevents hydration issues)
    setIsVisible(true);
  }, []);

  const handleCallClick = () => {
    // Open phone dialer
    window.location.href = `tel:${phoneNumber}`;
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
  <div className="fixed bottom-24 right-6 z-50">
      {/* Call Button */}
      <button
        onClick={handleCallClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          w-14 h-14
          bg-blue-500 hover:bg-blue-600
          ${!isHovered ? 'animate-pulse hover:animate-none' : ''}
          rounded-full shadow-lg transform transition-all duration-300 ease-in-out
          flex items-center justify-center text-white
          hover:shadow-xl hover:scale-110 active:scale-95
          focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50
        `}
        aria-label="Call us now"
        title="Call us now"
      >
        {/* Phone Call Icon */}
        <svg
          className="w-7 h-7"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
      </button>

      {/* Tooltip on hover */}
      {isHovered && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap transform transition-all duration-200 shadow-lg">
          Call us now: {phoneNumber}
          <div className="absolute top-full left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default FloatingCallButton;