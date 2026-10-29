import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The library PDFs ship in the repo; make sure the serverless function that
  // serves them includes the files (Vercel only bundles what it can trace).
  outputFileTracingIncludes: {
    "/api/library/document/[id]": ["./storage/library/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
