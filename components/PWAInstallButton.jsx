"use client";

import { useState, useEffect } from 'react';
import { FaDownload, FaCheck, FaMobile } from 'react-icons/fa6';
import { HiSparkles } from 'react-icons/hi2';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    // Check if app is already installed (multiple methods for better detection)
    const checkInstallation = () => {
      // Method 1: Check display mode
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      
      // Method 2: Check if launched from home screen (iOS)
      if (window.navigator.standalone === true) {
        return true;
      }
      
      // Method 3: Check document referrer for PWA launch
      if (document.referrer.includes('android-app://')) {
        return true;
      }
      
      return false;
    };

    if (checkInstallation()) {
      setIsInstalled(true);
      return;
    }

    // Enhanced beforeinstallprompt event handler
    const handleBeforeInstallPrompt = (e) => {
      console.log('📱 PWA: Install prompt intercepted');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Enhanced app installed event handler  
    const handleAppInstalled = () => {
      console.log('✅ PWA: App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setIsInstalling(false);
      setDeferredPrompt(null);
      
      // Show success message (optional)
      if (typeof window !== 'undefined' && window.showSuccessToast) {
        window.showSuccessToast('App installed successfully! 🎉');
      }
    };

    // Check for updates to service worker
    const handleSWUpdate = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 PWA: Service Worker updated');
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    handleSWUpdate();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Enhanced fallback instructions for different browsers/devices
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      let instructions = 'To install this app:\n\n';
      
      if (isIOS) {
        instructions += '1. Tap the Share button (□↗)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm';
      } else if (isAndroid) {
        instructions += '1. Tap the menu button (⋮)\n2. Select "Install app" or "Add to Home Screen"\n3. Tap "Install"';
      } else {
        instructions += '1. Click the browser menu (⋮ or ≡)\n2. Look for "Install" or "Add to Desktop"\n3. Follow the prompts';
      }
      
      alert(instructions);
      return;
    }

    try {
      setIsInstalling(true);
      console.log('📱 PWA: Showing install prompt');
      
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`📱 PWA: Install prompt ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('✅ PWA: User accepted installation');
        // Installation success will be handled by 'appinstalled' event
      } else {
        console.log('❌ PWA: User declined installation');
        setIsInstalling(false);
      }

      // Clear the prompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('❌ PWA: Install prompt failed:', error);
      setIsInstalling(false);
    }
  };

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return (
      <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-300 rounded-lg opacity-50 cursor-not-allowed">
        <FaDownload className="w-4 h-4" />
        <span className="text-sm font-semibold">Loading...</span>
      </button>
    );
  }

  // Don't show button if app is already installed
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
        <FaCheck className="w-4 h-4" />
        <span className="whitespace-nowrap">App Installed</span>
      </div>
    );
  }

  // Mobile version - icon only
  const MobileButton = () => (
    <button
      onClick={handleInstallClick}
      disabled={isInstalling}
      className="sm:hidden flex items-center justify-center w-9 h-9 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-gray-400 disabled:to-gray-500 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-900"
      title={isInstallable ? 'Install App' : 'Download App'}
      aria-label={isInstallable ? 'Install App' : 'Download App'}
    >
      {isInstalling ? (
        <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      ) : (
        <FaDownload className="w-4 h-4" />
      )}
    </button>
  );

  // Desktop version - full button with text in single line
  const DesktopButton = () => (
    <div className="relative">
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-gray-400 disabled:to-gray-500 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-900 font-medium whitespace-nowrap group"
        title={isInstallable ? 'Install Wear and Earn App' : 'Download Wear and Earn App'}
      >
        {/* Icon with animation */}
        <div className="flex items-center justify-center w-5 h-5 relative">
          {isInstalling ? (
            <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <FaDownload className="w-4 h-4 transition-transform group-hover:scale-110" />
              {isInstallable && (
                <HiSparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-600 animate-pulse" />
              )}
            </>
          )}
        </div>
        
        {/* Text - always single line */}
        <span className="text-sm font-semibold">
          {isInstalling ? 'Installing...' : isInstallable ? 'Install App' : 'Download App'}
        </span>
        
        {/* Mobile icon for context */}
        <FaMobile className="w-3 h-3 opacity-70" />
      </button>

      {/* Enhanced tooltip */}
      {showTooltip && !isInstalling && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-lg whitespace-nowrap z-50">
          <div className="text-center">
            <div className="font-semibold">
              {isInstallable ? '🚀 Ready to Install!' : '📱 Make it an App'}
            </div>
            <div className="text-xs opacity-90 mt-1">
              {isInstallable ? 'Click to install on your device' : 'Get native app experience'}
            </div>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <MobileButton />
      <DesktopButton />
    </>
  );
};

export default PWAInstallButton;
