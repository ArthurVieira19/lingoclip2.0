import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project — a stray lockfile in the parent
  // Windows user folder was making Next.js infer the wrong root directory.
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
