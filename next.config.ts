import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  // Enable Turbopack (default in Next.js 16)
  turbopack: {},
};

export default nextConfig;
