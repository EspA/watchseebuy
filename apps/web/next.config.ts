import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@waitseebuy/domain",
    "@waitseebuy/ebay",
    "@waitseebuy/db",
    "@waitseebuy/notify",
  ],
  serverExternalPackages: ["drizzle-orm", "postgres"],
  webpack: (config) => {
    config.watchOptions = {
      ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**"],
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
