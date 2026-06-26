import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async redirects() {
    return [
      {
        source: '/ZloteMiody-macOS.dmg',
        destination: 'https://github.com/ploiu123/zpi-wsiz/releases/download/v1.0.0/ZloteMiody-macOS.dmg',
        permanent: false,
      },
      {
        source: '/ZloteMiody-Windows.exe',
        destination: 'https://github.com/ploiu123/zpi-wsiz/releases/download/v1.0.0/zpi-wsiz-main.Setup.1.0.0.exe',
        permanent: false,
      }
    ]
  }
};

export default nextConfig;
