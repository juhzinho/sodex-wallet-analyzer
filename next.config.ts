import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel Edge / Node runtime timeout for long-running API routes (seconds)
  // The analyze route can take up to ~60 s for wallets with deep history.
  experimental: {
    // nothing needed currently
  },

  async headers() {
    return [
      {
        // SSE route — must NOT be cached by CDN
        source: "/api/analyze/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Accel-Buffering", value: "no" },
        ],
      },
    ];
  },
};

export default nextConfig;
