"use client";

import { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa6';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for the app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support the install prompt
      alert('To install this app:\n\n1. Click the browser menu (⋮)\n2. Select "Install app" or "Add to Home Screen"');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Don't show the button if app is already installed
  if (isInstalled) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="hidden md:flex items-center justify-center h-9 gap-1.5 bg-[#ffc107] dark:bg-yellow-500 rounded px-4 py-0.5 hover:bg-[#ffcd3c] dark:hover:bg-yellow-400 transition-colors text-gray-900 dark:text-gray-900"
      title="Install Wear and Earn App"
    >
      <span className="max-sm:hidden">
        {isInstallable ? 'Install App' : 'Download App'}
      </span>
      <FaDownload />
    </button>
  );
};

export default PWAInstallButton;
