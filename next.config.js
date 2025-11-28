import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.__NEXT_PRIVATE_ORIGIN ?? 'http://localhost:3000')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产部署配置
  output: 'standalone',

  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
    ],
  },
  turbopack: {
    resolveExtensions: [
      '.mdx',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
      '.cts',
      '.cjs',
      '.mts',
    ],
  },
  reactStrictMode: true,
  redirects,

  // 生产环境优化
  compress: true,
  poweredByHeader: false,
  eslint: {
    // 在生产构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },

  // 服务器外部包配置已移除以便将依赖打入 standalone 产物

  // 实验性功能
  experimental: {
    // 其他实验性配置可以在这里添加
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
