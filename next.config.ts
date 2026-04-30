import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Enable Turbopack (default in Next.js 16)
  turbopack: {},
};

export default nextConfig;
