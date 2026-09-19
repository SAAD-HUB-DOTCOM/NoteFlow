import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    // Public entry point → marketing. Server-level redirect (works for GET + browser).
    // The seeded demo dashboard that used to live at / is retired (preserved in the
    // v1-seeded-submission tag). The real app lives under /app.
    return [{ source: "/", destination: "/product", permanent: false }];
  },
};

export default nextConfig;
