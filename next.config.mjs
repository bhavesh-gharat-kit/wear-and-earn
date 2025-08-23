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
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3000',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3002',
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
