/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 排盘/AI 包用到 fs、import.meta.url、iztro/lunar,只在服务端运行,
  // 标记为 external 避免被打进客户端 bundle 或破坏数据文件路径解析。
  experimental: {
    serverComponentsExternalPackages: [
      "@numerology/engine",
      "@numerology/ai",
      "@numerology/knowledge",
      "iztro",
      "lunar-javascript",
      "@anthropic-ai/sdk",
    ],
  },
};

export default nextConfig;
