import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['@prisma/client', 'bcryptjs', 'bcrypt'],
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals.push({
                'utf-8-validate': 'commonjs utf-8-validate',
                'bufferutil': 'commonjs bufferutil',
            })
        }
        return config
    },
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
        return [];
    },
};

const pwaConfig = withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
        {
            urlPattern: /^https?.*/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'offlineCache',
                expiration: {
                    maxEntries: 200,
                },
            },
        },
    ],
});

export default pwaConfig(nextConfig);
