import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // heic-convert's underlying libheif-js package loads its .wasm binary in a
  // way Next's Turbopack file tracer can't follow automatically, so the
  // Vercel serverless bundle for this route silently ships without it.
  // Force-include the whole package so HEIC->JPEG conversion works in
  // production, not just locally.
  outputFileTracingIncludes: {
    "/api/image/[fileId]": ["./node_modules/libheif-js/**/*"],
  },
};

export default nextConfig;
