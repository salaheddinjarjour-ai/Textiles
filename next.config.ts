import type { NextConfig } from "next";
import path from "node:path";

// A stray lockfile in a parent folder makes Next mis-detect the workspace
// root. Pin the root to this project directory for both bundlers.
const projectRoot = path.resolve();

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;

// Makes Cloudflare bindings (D1, etc.) available during `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
