import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://video.aitodoall.com"),
  title: "映作 YINGZO - AI 视频生成工作台",
  description: "面向短视频创作者和商家的 AI 视频生成工作台。",
  openGraph: {
    title: "映作 YINGZO - AI 视频生成工作台",
    description: "把商品图变成能投放的短视频。",
    type: "website",
    images: [{ url: "/og.png", width: 1760, height: 917, alt: "映作 AI 视频工作台" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "映作 YINGZO - AI 视频生成工作台",
    description: "把商品图变成能投放的短视频。",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
