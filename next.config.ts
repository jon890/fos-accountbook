import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel에서 자동으로 Korea 리전 배포
  // serverComponentsExternalPackages가 serverExternalPackages로 변경됨
  serverExternalPackages: [],
};

export default nextConfig;
