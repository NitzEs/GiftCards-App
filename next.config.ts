import type { NextConfig } from "next";

const FIREBASE_PROJECT = "gift-card-balance-app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${FIREBASE_PROJECT}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
