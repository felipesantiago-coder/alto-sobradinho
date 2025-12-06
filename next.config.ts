import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  // Otimizações para Vercel
  compress: true,
  poweredByHeader: false,
  // Configurações de imagem para Vercel
  images: {
    domains: ['z-cdn.chatglm.cn'],
    formats: ['image/webp', 'image/avif'],
  },
  // Manter configurações existentes
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
