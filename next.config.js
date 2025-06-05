// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: Only use this in development
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  // Optimize images
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  // Improve production performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
