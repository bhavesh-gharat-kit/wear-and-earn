"use client";
import React, { useState } from 'react';
import { 
  COMMUNICATION_CONFIG, 
  formatWhatsAppUrl, 
  formatEmailUrl, 
  formatSMSUrl, 
  replacePlaceholders 
} from '@/lib/communication-config';
import { Share, MessageCircle, Mail, MessageSquare, Copy, Check } from 'lucide-react';

const ShareButtons = ({ 
  referralUrl = window?.location?.href || '', 
  customMessage = null,
  showCopyLink = true,
  buttonSize = 'default', // 'small', 'default', 'large'
  layout = 'horizontal' // 'horizontal', 'vertical', 'grid'
}) => {
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Get button size classes
  const getSizeClasses = () => {
    switch (buttonSize) {
      case 'small':
        return 'px-3 py-2 text-sm';
      case 'large':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  // Get icon size classes
  const getIconSize = () => {
    switch (buttonSize) {
      case 'small':
        return 'w-4 h-4';
      case 'large':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  // Get layout classes
  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical':
        return 'flex flex-col space-y-3';
      case 'grid':
        return 'grid grid-cols-2 gap-3';
      default:
        return 'flex flex-wrap gap-3';
    }
  };

  const handleWhatsAppShare = () => {
    const message = customMessage || replacePlaceholders(
      COMMUNICATION_CONFIG.whatsapp.referralMessage,
      { url: referralUrl }
    );
    
    const whatsappUrl = formatWhatsAppUrl(
      COMMUNICATION_CONFIG.whatsapp.businessNumber,
      message
    );
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleEmailShare = () => {
    const body = customMessage || replacePlaceholders(
      COMMUNICATION_CONFIG.email.referralBody,
      { url: referralUrl }
    );
    
    const emailUrl = formatEmailUrl(
      COMMUNICATION_CONFIG.email.defaultEmail,
      COMMUNICATION_CONFIG.email.referralSubject,
      body
    );
    
    window.open(emailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSMSShare = () => {
    const message = customMessage || replacePlaceholders(
      COMMUNICATION_CONFIG.sms.referralMessage,
      { url: referralUrl }
    );
    
    const smsUrl = formatSMSUrl(message);
    window.open(smsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = referralUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      setIsSharing(true);
      try {
        await navigator.share({
          title: 'Check out this amazing website!',
          text: COMMUNICATION_CONFIG.whatsapp.referralMessage.replace('{url}', ''),
          url: referralUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
      setIsSharing(false);
    }
  };

  return (
    <div className="w-full">
      {/* Main Share Buttons */}
      <div className={getLayoutClasses()}>
        {/* WhatsApp Share */}
        <button
          onClick={handleWhatsAppShare}
          className={`
            ${getSizeClasses()}
            bg-green-500 hover:bg-green-600 text-white rounded-lg
            flex items-center justify-center gap-2 transition-all duration-200
            transform hover:scale-105 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-opacity-50
            shadow-md hover:shadow-lg
          `}
          title="Share via WhatsApp"
        >
          <MessageCircle className={getIconSize()} />
          <span className="font-medium">WhatsApp</span>
        </button>

        {/* Email Share */}
        <button
          onClick={handleEmailShare}
          className={`
            ${getSizeClasses()}
            bg-blue-500 hover:bg-blue-600 text-white rounded-lg
            flex items-center justify-center gap-2 transition-all duration-200
            transform hover:scale-105 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50
            shadow-md hover:shadow-lg
          `}
          title="Share via Email"
        >
          <Mail className={getIconSize()} />
          <span className="font-medium">Email</span>
        </button>

        {/* SMS Share */}
        <button
          onClick={handleSMSShare}
          className={`
            ${getSizeClasses()}
            bg-purple-500 hover:bg-purple-600 text-white rounded-lg
            flex items-center justify-center gap-2 transition-all duration-200
            transform hover:scale-105 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-opacity-50
            shadow-md hover:shadow-lg
          `}
          title="Share via SMS"
        >
          <MessageSquare className={getIconSize()} />
          <span className="font-medium">SMS</span>
        </button>

        {/* Native Share (if supported) */}
        {navigator?.share && (
          <button
            onClick={handleNativeShare}
            disabled={isSharing}
            className={`
              ${getSizeClasses()}
              bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg
              flex items-center justify-center gap-2 transition-all duration-200
              transform hover:scale-105 active:scale-95 disabled:transform-none
              focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50
              shadow-md hover:shadow-lg disabled:cursor-not-allowed
            `}
            title="Share via device"
          >
            <Share className={`${getIconSize()} ${isSharing ? 'animate-spin' : ''}`} />
            <span className="font-medium">Share</span>
          </button>
        )}
      </div>

      {/* Copy Link Button */}
      {showCopyLink && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={referralUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleCopyLink}
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200
                ${copiedToClipboard 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
              `}
              title={copiedToClipboard ? 'Copied!' : 'Copy link'}
            >
              {copiedToClipboard ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm font-medium">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButtons;