import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent static generation timeout
  staticPageGenerationTimeout: 180,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
