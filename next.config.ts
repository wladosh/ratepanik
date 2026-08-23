import type { NextConfig } from "next";

// force Vercel production rebuild after vercelignore fix
const nextConfig: NextConfig = {
  devIndicators: false,
};

export default nextConfig;
