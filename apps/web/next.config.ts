import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['@barbearia/contracts'],
    devIndicators: false,
};

export default nextConfig;
