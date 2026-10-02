import path from "node:path";
import type { NextConfig } from "next";

// Set by the GitHub Pages workflow. Locally (`npm run dev`) neither is set, so
// the app runs from the root as usual.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project — a stray lockfile in the parent
  // Windows user folder was making Next.js infer the wrong root directory.
  outputFileTracingRoot: path.resolve(__dirname),
  // Static export so the site can be hosted on GitHub Pages.
  output: "export",
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
