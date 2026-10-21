import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server is opened from other hostnames (for example http://dreezy2:3000). Without this, Next blocks
  // its scripts and hot reload for those origins, the page never hydrates and the screen stays blank.
  allowedDevOrigins: ["dreezy2"],
  async headers() {
    // The service worker file itself must never be cached by the browser, or updates would not reach tills.
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Content-Type", value: "application/javascript; charset=utf-8" }] }]
  },
};

export default nextConfig;
