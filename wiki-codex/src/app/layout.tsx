import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DeviceUIProvider } from "@/lib/device-ui";

export const metadata: Metadata = {
  title: "Aethel Codex — Đại Thư Viện Bách Khoa & Bản Đồ Thế Giới Giả Tưởng",
  description:
    "Nền tảng Bách khoa Tri thức & Worldbuilding chuẩn Imperial Fantasy · Arcane Atlas · Mythic Editorial: 14 phân hệ Codex, 360 quốc gia trên 8 lục địa, gia phả, biên niên sử và kho tư liệu lịch sử.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aethel Codex"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#101522"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      data-theme="astral-grimoire"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,500;1,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body className="font-sans antialiased overflow-x-clip selection:bg-[#C6A568]/30 selection:text-[#E9DFC9]">
        <DeviceUIProvider>{children}</DeviceUIProvider>
      </body>
    </html>
  );
}
