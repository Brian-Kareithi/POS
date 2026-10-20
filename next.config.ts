import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server is opened from other hostnames (for example http://dreezy2:3000). Without this, Next blocks
  // its scripts and hot reload for those origins, the page never hydrates and the screen stays blank.
  allowedDevOrigins: ["dreezy2"],
};

export default nextConfig;
