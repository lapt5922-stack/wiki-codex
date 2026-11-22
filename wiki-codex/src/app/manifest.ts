import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aethel Codex — Bách Khoa Tri Thức & Bản Đồ Đại Hành Tinh 360 Quốc Gia",
    short_name: "Aethel Codex",
    description:
      "Hệ thống Web thuần Wiki Codex đa không gian, bản đồ Đại Hành Tinh 360 quốc gia trên 8 lục địa, 6+ cổ ngữ thế giới và cổng xuất bản công khai.",
    start_url: "/",
    display: "standalone",
    background_color: "#080d1a",
    theme_color: "#080d1a",
    lang: "vi"
  };
}
