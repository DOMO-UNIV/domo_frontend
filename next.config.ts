import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://3.25.219.120:9000/api/:path*',
            },
        ];
    },
};

export default nextConfig;