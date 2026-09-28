import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@watchseebuy/domain", "@watchseebuy/db", "@watchseebuy/ebay"],
  serverExternalPackages: ["drizzle-orm", "postgres"],
  webpack: (config) => {
    config.watchOptions = {
      ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**"],
    };
    return config;
  },
};

export default nextConfig;
