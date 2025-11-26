import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import 'swiper/css';
// import 'swiper/css/pagination';
import Providers from "./Providers";
import { Toaster } from "react-hot-toast";
import FloatingWhatsAppButton from "@/components/ui/FloatingWhatsAppButton";
import FloatingCallButton from "@/components/ui/FloatingCallButton";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata = {
  title: "Wear and Earn - Premium Clothing",
  description: "Shop premium clothing and earn rewards ",
  manifest: "/manifest.json",
  // themeColor: "#ffc107",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    minimumScale: 1,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wear and Earn",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="robots" content="index, follow" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffc107" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wear and Earn" />
        <link rel="apple-touch-icon" href="/images/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" href="/images/icons/icon-192x192.png" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-right" />
        <FloatingWhatsAppButton />
        <FloatingCallButton />
        
        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Register Service Worker for PWA functionality
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', async () => {
                  try {
                    const registration = await navigator.serviceWorker.register('/service-worker.js', {
                      scope: '/'
                    });
                    
                    console.log('✅ PWA: Service Worker registered successfully:', registration.scope);
                    
                    // Update service worker if new version available
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          console.log('🔄 PWA: New version available, please refresh');
                          // You can show a notification to user about update here
                        }
                      });
                    });
                  } catch (error) {
                    console.error('❌ PWA: Service Worker registration failed:', error);
                  }
                });
              } else {
                console.warn('⚠️ PWA: Service Worker not supported');
              }
              
              // Handle PWA install prompt
              let deferredPrompt;
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                console.log('📱 PWA: Install prompt available');
              });
              
              // Make install prompt available globally
              window.showPWAInstall = async () => {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  console.log('📱 PWA: Install prompt outcome:', outcome);
                  deferredPrompt = null;
                  return outcome === 'accepted';
                }
                return false;
              };
            `,
          }}
        />
      </body>
    </html>
  );
}
