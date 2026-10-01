import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/opengraph-image": [
      "./node_modules/pretendard/dist/public/static/Pretendard-Bold.otf",
    ],
    "/icon": ["./node_modules/pretendard/dist/public/static/Pretendard-Bold.otf"],
    "/apple-icon": [
      "./node_modules/pretendard/dist/public/static/Pretendard-Bold.otf",
    ],
  },
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
