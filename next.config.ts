import type { NextConfig } from "next";

const FIREBASE_PROJECT = "gift-card-balance-app";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${FIREBASE_PROJECT}.firebaseapp.com/__/auth/:path*`,
        permanent: false, // 307 — browser navigates there, not proxied
      },
    ];
  },
};

export default nextConfig;
