import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: { 
    ignoreBuildErrors: true 
  },
  images: { unoptimized: true },
  // Không cần khai báo turbopack hay experimental ở đây
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  async headers() {
    return [
//       {
//   // Regex này tóm tất cả các file có đuôi phổ biến ở bất kỳ thư mục nào
//   source: "/:path*\\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff2|woff|ttf|mp4|ts|m4s|wasm|json)",
//   headers: [
//     {
//       key: "Cache-Control",
//       // immutable: vì các file này thường có mã hash hoặc là assets cố định
//       value: "public, max-age=31536000, s-maxage=31536000, immutable",
//     },
//     {
//       key: "Cross-Origin-Resource-Policy",
//       value: "cross-origin",
//     },
//   ],
// },
      {
  source: "/api/auth/:path*",
  headers: [
    { key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=60" },
    { key: "Vary", value: "Authorization" },
  ],
},
{
  source: "/api/rbac/:path*",
  headers: [
    { key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=60" },
    { key: "Vary", value: "Authorization" },
  ],
},
      
      {
        // 3. Next.js chunks & Static files
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          // Thêm cache cho static chunks để load web nhanh hơn
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // 4. FFmpeg Assets
        source: "/ffmpeg-v11/(.*)",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // 5. Patched worker script
        source: "/ffmpeg-worker.js",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          { key: "Cache-Control", value: "public, max-age=86400" }, // Cache 1 ngày
        ],
      },
    ];
  },
};


export default nextConfig;
