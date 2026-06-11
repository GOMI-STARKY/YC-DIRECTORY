import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
