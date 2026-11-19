import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    unoptimized: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: "/onboarding",
        destination: "/merchant/onboarding",
        permanent: false,
      },
      {
        source: "/store/:slug",
        destination: "/s/:slug",
        permanent: false,
      },
    ]
  },
}

export default nextConfig
