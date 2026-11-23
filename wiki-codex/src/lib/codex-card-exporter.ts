"use client";

export interface CodexCardExportInput {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  summary?: string;
  accentColor?: string;
  stats?: Array<{ label: string; value: string }>;
}

/**
 * Generates a high-resolution shareable Fantasy Codex Summary Card (PNG) directly in the browser.
 */
export function exportShareableCodexCardPng(input: CodexCardExportInput): void {
  if (typeof window === "undefined") return;
  const width = 1080;
  const height = 620;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const accent = input.accentColor || "#D4AF37";

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#090f20");
  bg.addColorStop(0.55, "#111b36");
  bg.addColorStop(1, "#070c19");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Ornamental border
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, width - 48, height - 48);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1;
  ctx.strokeRect(34, 34, width - 68, height - 68);

  // Top badge & ID
  ctx.fillStyle = accent;
  ctx.font = "bold 20px monospace";
  ctx.fillText(`✦ AETHEL CODEX  ·  ${input.id}`, 64, 84);

  if (input.badge) {
    ctx.fillStyle = "rgba(212,175,55,0.18)";
    ctx.fillRect(width - 280, 56, 216, 36);
    ctx.fillStyle = "#fde68a";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(input.badge.slice(0, 22), width - 264, 80);
  }

  // Title
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 46px Georgia, serif";
  ctx.fillText(input.title.slice(0, 38), 64, 158);

  // Subtitle
  if (input.subtitle) {
    ctx.fillStyle = accent;
    ctx.font = "22px sans-serif";
    ctx.fillText(input.subtitle.slice(0, 64), 64, 200);
  }

  // Summary wrapped lines
  if (input.summary) {
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "20px sans-serif";
    const words = input.summary.split(/\s+/);
    let line = "";
    let y = 256;
    let linesDrawn = 0;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > width - 128) {
        ctx.fillText(line, 64, y);
        line = w;
        y += 30;
        linesDrawn++;
        if (linesDrawn >= 4) break;
      } else {
        line = test;
      }
    }
    if (line && linesDrawn < 4) ctx.fillText(line, 64, y);
  }

  // Stat Boxes
  const stats = (input.stats || []).slice(0, 4);
  if (stats.length > 0) {
    const gap = 20;
    const boxW = (width - 128 - gap * (stats.length - 1)) / stats.length;
    stats.forEach((st, i) => {
      const x = 64 + i * (boxW + gap);
      const y = 415;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(x, y, boxW, 112);
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.strokeRect(x, y, boxW, 112);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "15px sans-serif";
      ctx.fillText(st.label.slice(0, 20), x + 16, y + 36);

      ctx.fillStyle = accent;
      ctx.font = "bold 26px monospace";
      ctx.fillText(st.value.slice(0, 16), x + 16, y + 82);
    });
  }

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "14px monospace";
  ctx.fillText(`Aethelgard Worldbuilding Archive · Exported ${new Date().toLocaleDateString("vi-VN")}`, 64, height - 48);

  const link = document.createElement("a");
  link.download = `${input.id.toLowerCase()}-codex-card.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
