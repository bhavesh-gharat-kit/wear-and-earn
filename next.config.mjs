/** @type {import('next').NextConfig} */
const nextConfig = {
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
                hostname: '*.vercel.app',
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
    async redirects() {
        return [
            // Ensure old /home links continue to work by redirecting to root
            {
                source: '/home',
                destination: '/',
                permanent: false,
            },
        ];
    },
};

export default nextConfig;
