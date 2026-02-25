import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@notionhq/client"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.notion.so",
      },
    ],
  },
};

export default nextConfig;
