import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "命理 · 八字紫微合参",
  description:
    "AI 辅助的中国命理工具:八字四柱 + 紫微斗数,动静结合解读人生格局与大运走向。文化与自我反思工具,非宿命预测。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
