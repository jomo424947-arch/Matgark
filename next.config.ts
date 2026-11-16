import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
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
        source: "/dashboard/products",
        destination: "/products",
        permanent: false,
      },
      {
        source: "/dashboard/products/new",
        destination: "/products/new",
        permanent: false,
      },
      {
        source: "/dashboard/orders",
        destination: "/orders",
        permanent: false,
      },
      {
        source: "/dashboard/customers",
        destination: "/customers",
        permanent: false,
      },
      {
        source: "/dashboard/settings",
        destination: "/settings",
        permanent: false,
      },
      {
        source: "/dashboard/onboarding",
        destination: "/onboarding",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
