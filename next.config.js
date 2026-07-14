/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // 画像最適化（microCMSの画像配信を許可）
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.microcms-assets.io' },
    ],
  },

  // 旧URL 301（GA4 実流入・404 実測あり。industry群分析2026-07-15 P3）
  async redirects() {
    return [
      { source: '/industry-tracker', destination: '/tracker', permanent: true },
      { source: '/project-tracker', destination: '/tracker/pf', permanent: true },
    ];
  },

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
