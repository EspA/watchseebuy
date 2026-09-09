import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@waitseebuy/domain",
    "@waitseebuy/ebay",
    "@waitseebuy/db",
    "@waitseebuy/notify",
  ],
  serverExternalPackages: ["drizzle-orm"],
  webpack: (config) => {
    config.watchOptions = {
      ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**"],
    };
    return config;
  },
};

export default nextConfig;
