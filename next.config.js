// 凍結の変電所（転送にしたものだけ redirects で使う）。TS・Python と同じ 1 つの JSON を読む
const FROZEN_SUBSTATIONS = require('./src/data/substations-frozen.json').frozen;

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
      // 達成記念の詳細 4 枚（2026-10-26 サイトの歩み便 第 2 版・行き先は 10/17 裁定）。/milestones は更新履歴に作り直した
      { source: '/milestones/2026-05-22-feature-complete', destination: '/milestones', permanent: true },
      { source: '/milestones/2026-05-24-industry-report-2026', destination: '/reports/2026', permanent: true },
      { source: '/milestones/2026-05-28-aj-fire-database', destination: '/incidents', permanent: true },
      { source: '/milestones/2026-06-11-vip-citation', destination: '/milestones', permanent: true },
      // 変電所の microCMS の id で開く URL（id ≠ slug の 2 件・CLAUDE.md #113）。以前は id でも引けて 200 だった（canonical は slug）。
      // 11/4 の JSON 便から slug でしか引けず 404 になったので、slug へ恒久の転送（小さな直し便・2026-11-05）
      { source: '/grid/a7m1-_9p0n5', destination: '/grid/ydn-kikan-0013-2', permanent: true },
      { source: '/grid/o66z7a3i9', destination: '/grid/kyu-884', permanent: true },
      // BW 関西 本実行便（2026-11-05）の POST 1 件（南GC 咲洲２）も id ≠ slug
      { source: '/grid/7c1n48509wi9', destination: '/grid/ksi-local-gc-5', permanent: true },
      // 凍結のうち変電所でない誤取込（egz-kikan-x＝中国電力NW の公表 CSV の「【留意事項】」の注記の行）は、エリアのページへ恒久の転送
      // （小さな直し便・2026-11-08）。転送先は src/data/substations-frozen.json の redirectTo（定義はそこ 1 か所・#119）。データは消さない
      ...Object.entries(FROZEN_SUBSTATIONS)
        .filter(([, v]) => typeof v.redirectTo === 'string')
        .map(([slug, v]) => ({ source: `/grid/${slug}`, destination: v.redirectTo, permanent: true })),
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
      // ビルドの日付の印（毎朝の再ビルドの予備が読む・2026-11-10）は検索に出さない
      {
        source: '/build-info.json',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ];
  },
};

module.exports = nextConfig;
