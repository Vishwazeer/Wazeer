import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure static file serving works for all file types
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
