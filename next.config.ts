import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The library PDFs ship in the repo; make sure the serverless function that
  // serves them includes the files (Netlify only bundles what Next traces).
  outputFileTracingIncludes: {
    "/api/library/document/[id]": ["./storage/library/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
