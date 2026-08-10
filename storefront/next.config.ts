import type {
  NextConfig,
} from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5080",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;