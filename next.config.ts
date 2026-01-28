import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Exclude problematic packages from SSR bundling (from upstream)
  serverExternalPackages: [
    '@mediapipe/pose',
    '@tensorflow-models/pose-detection',
    '@tensorflow/tfjs-core',
    '@tensorflow/tfjs-backend-webgl',
  ],

  // Turbopack configuration (Next.js 15+)
  // Use relative paths for Turbopack to avoid "windows imports are not implemented yet" error
  turbopack: {
    resolveAlias: {
      '@mediapipe/pose': './src/pose-detection/shims/mediapipePose.js',
    },
  },

  // Webpack configuration (Fallback/Compatibility)
  webpack: (config, { isServer }) => {
    // Fix for @mediapipe/pose ESM import issues
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@mediapipe/pose': path.resolve(__dirname, 'src/pose-detection/shims/mediapipePose.js'),
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
