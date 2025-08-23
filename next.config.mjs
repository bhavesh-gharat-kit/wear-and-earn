/** @type {import('next').NextConfig} */
const nextConfig = {
    // Disable legacy Pages Router routing by not recognizing default page extensions.
    // Files under /pages remain importable as modules for App Router.
    pageExtensions: ["pagex"],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'wearearn.kumarinfotech.net',
            },
            {
                protocol: 'https',
                hostname: 'wearnearn.com',
            },
            // Allow images from your Vercel domain and any subdomain
            {
                protocol: 'https',
                hostname: '**.vercel.app',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/uploads/:path*',
                destination: '/api/uploads/:path*',
            },
        ];
    },
};

export default nextConfig;
