import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude problematic packages from SSR bundling
  serverExternalPackages: [
    '@mediapipe/pose',
    '@tensorflow-models/pose-detection',
    '@tensorflow/tfjs-core',
    '@tensorflow/tfjs-backend-webgl',
  ],
  webpack: (config, { isServer }) => {
    // Fix for @mediapipe/pose ESM import issues
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@mediapipe/pose': false,
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },
};

export default nextConfig;
