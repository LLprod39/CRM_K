import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['whatsapp-web.js'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Игнорируем проблемы с fstream для WhatsApp
      config.externals.push({
        'rimraf': 'commonjs rimraf'
      });
    }
    return config;
  },
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ['26.71.166.145']
};

export default nextConfig;
