import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DeviceUIProvider } from "@/lib/device-ui";

export const metadata: Metadata = {
  title: "Aethel Codex — Bách Khoa Tri Thức & Bản Đồ Đại Hành Tinh 360 Quốc Gia",
  description:
    "Hệ thống Web thuần Wiki Codex & Bách khoa tri thức đa không gian, bản đồ Đại Hành Tinh 360 quốc gia trên 8 lục địa, 6+ cổ ngữ, gia phả SVG, lịch đa mặt trăng và xuất bản sách PDF.",
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
  themeColor: "#080d1a"
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
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,400&display=swap"
        />
      </head>
      <body className="font-sans antialiased overflow-x-hidden selection:bg-[var(--accent)]/30 selection:text-[var(--text-primary)]">
        <DeviceUIProvider>{children}</DeviceUIProvider>
      </body>
    </html>
  );
}
