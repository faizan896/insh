import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Loopback browser checks use the same dev server as localhost.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  devIndicators: false,
};

export default nextConfig;
