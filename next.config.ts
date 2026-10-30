import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Loopback browser checks use the same dev server as localhost.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  devIndicators: false,
  ...(githubPages ? {
    output: "export" as const,
    basePath: "/insh",
    trailingSlash: true,
    images: { unoptimized: true },
  } : {}),
};

export default nextConfig;
