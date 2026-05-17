import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites:
    process.env.NODE_ENV === "development"
      ? async () => [
          {
            source: "/api/:path*",
            destination: "http://127.0.0.1:8000/api/:path*",
          },
        ]
      : undefined,
};

export default nextConfig;
