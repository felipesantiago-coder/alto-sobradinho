import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  // Otimizações para Vercel
  compress: true,
  poweredByHeader: false,
  // Configurações de imagem para Vercel (atualizado)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'z-cdn.chatglm.cn',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // Manter configurações existentes
  reactStrictMode: true,
};

export default nextConfig;
