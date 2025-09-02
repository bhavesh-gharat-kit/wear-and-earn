import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import 'swiper/css';
// import 'swiper/css/pagination';
import Providers from "./Providers";
import { Toaster } from "react-hot-toast";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata = {
  title: "Wear and Earn - Premium Clothing & MLM Rewards",
  description: "Shop premium clothing and earn rewards through our MLM program",
  manifest: "/manifest.json",
  themeColor: "#ffc107",
  viewport: "width=device-width, initial-scale=1.0",
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
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
      </body>
    </html>
  );
}
