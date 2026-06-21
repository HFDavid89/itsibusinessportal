import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@itsi-business/ui', '@itsi-business/types'],
};

export default nextConfig;
