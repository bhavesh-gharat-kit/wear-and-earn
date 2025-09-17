"use client";
import React from 'react';
import ShareButtons from '@/components/ui/ShareButtons';

/**
 * Example component showing how to use ShareButtons in different contexts
 */
const ShareButtonsExample = () => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://yoursite.com';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Share Buttons Examples
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Different layouts and configurations for sharing functionality
        </p>
      </div>

      {/* Default Horizontal Layout */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Default Horizontal Layout
        </h2>
        <ShareButtons 
          referralUrl={currentUrl}
          buttonSize="default"
          layout="horizontal"
          showCopyLink={true}
        />
      </div>

      {/* Vertical Layout with Custom Message */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Vertical Layout with Custom Message
        </h2>
        <ShareButtons 
          referralUrl={currentUrl}
          customMessage="Check out this amazing product! I think you'll love it."
          buttonSize="large"
          layout="vertical"
          showCopyLink={true}
        />
      </div>

      {/* Grid Layout Small Buttons */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Grid Layout - Small Buttons
        </h2>
        <ShareButtons 
          referralUrl={currentUrl}
          buttonSize="small"
          layout="grid"
          showCopyLink={false}
        />
      </div>

      {/* Compact Version without Copy Link */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Compact Version (No Copy Link)
        </h2>
        <ShareButtons 
          referralUrl={currentUrl}
          buttonSize="small"
          layout="horizontal"
          showCopyLink={false}
        />
      </div>

      {/* Configuration Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
        <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-300">
          Configuration
        </h2>
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
          <p><strong>To configure:</strong> Edit <code>/lib/communication-config.js</code></p>
          <p><strong>WhatsApp Number:</strong> Update <code>businessNumber</code></p>
          <p><strong>Email:</strong> Update <code>defaultEmail</code></p>
          <p><strong>Messages:</strong> Customize <code>referralMessage</code>, <code>referralBody</code>, etc.</p>
        </div>
      </div>
    </div>
  );
};

export default ShareButtonsExample;