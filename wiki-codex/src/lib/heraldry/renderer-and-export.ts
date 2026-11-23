import type {
  HeraldryDesignData,
  HeraldryLayer,
  HeraldryStyleId,
  OrnamentId
} from "@/types/heraldry";
import { buildShieldPath } from "./shapes-and-palettes";
import { HERALDIC_SYMBOLS } from "./symbols-and-ornaments";
import { STYLE_LABELS } from "./template-catalog";

const SYMBOL_MAP = new Map(HERALDIC_SYMBOLS.map((s) => [s.id, s]));

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderFieldDivisionSvg(design: HeraldryDesignData): string {
  const { fieldDivision, primaryColor, secondaryColor, tertiaryColor } = design.shield;
  switch (fieldDivision) {
    case "per_pale":
      return `<rect x="0" y="0" width="300" height="600" fill="${primaryColor}"/><rect x="300" y="0" width="300" height="600" fill="${secondaryColor}"/>`;
    case "per_fess":
      return `<rect x="0" y="0" width="600" height="295" fill="${primaryColor}"/><rect x="0" y="295" width="600" height="305" fill="${secondaryColor}"/>`;
    case "quarterly":
      return `<rect x="0" y="0" width="300" height="295" fill="${primaryColor}"/><rect x="300" y="0" width="300" height="295" fill="${secondaryColor}"/><rect x="0" y="295" width="300" height="305" fill="${secondaryColor}"/><rect x="300" y="295" width="300" height="305" fill="${primaryColor}"/>`;
    case "per_bend":
      return `<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/><polygon points="0,0 600,600 600,0" fill="${secondaryColor}"/>`;
    case "per_saltire":
      return `<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/><polygon points="0,0 300,295 0,600" fill="${secondaryColor}"/><polygon points="600,0 300,295 600,600" fill="${secondaryColor}"/>`;
    case "chevron":
      return `<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/><polygon points="100,440 300,220 500,440 500,520 300,300 100,520" fill="${secondaryColor}"/>`;
    case "paly_stripes":
      return `<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/>${[160, 240, 320, 400]
        .map((x) => `<rect x="${x}" y="0" width="40" height="600" fill="${secondaryColor}"/>`)
        .join("")}`;
    case "chequy": {
      const cells: string[] = [`<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/>`];
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          if ((r + c) % 2 === 0) {
            cells.push(`<rect x="${120 + c * 36}" y="${90 + r * 42}" width="36" height="42" fill="${secondaryColor}"/>`);
          }
        }
      }
      return cells.join("");
    }
    case "radial_glow":
      return `<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/><circle cx="300" cy="295" r="190" fill="${secondaryColor}" fill-opacity="0.55"/><circle cx="300" cy="295" r="95" fill="${tertiaryColor}" fill-opacity="0.22"/>`;
    case "bend_sinister":
      return `<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/><polygon points="0,0 600,0 0,600" fill="${secondaryColor}"/>`;
    case "cross":
      return `<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/><rect x="262" y="0" width="76" height="600" fill="${secondaryColor}"/><rect x="0" y="258" width="600" height="74" fill="${secondaryColor}"/>`;
    case "fess_band":
      return `<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/><rect x="0" y="240" width="600" height="110" fill="${secondaryColor}"/><rect x="0" y="246" width="600" height="5" fill="${tertiaryColor}" fill-opacity="0.7"/><rect x="0" y="339" width="600" height="5" fill="${tertiaryColor}" fill-opacity="0.7"/>`;
    case "pile":
      return `<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/><polygon points="150,90 450,90 300,490" fill="${secondaryColor}"/>`;
    case "bordure":
      return `<rect x="0" y="0" width="600" height="600" fill="${secondaryColor}"/><rect x="178" y="140" width="244" height="310" rx="48" fill="${primaryColor}" stroke="${tertiaryColor}" stroke-width="5"/>`;
    case "gyronny":
      return `<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/><polygon points="300,295 300,0 600,0" fill="${secondaryColor}"/><polygon points="300,295 600,295 600,600" fill="${secondaryColor}"/><polygon points="300,295 300,600 0,600" fill="${secondaryColor}"/><polygon points="300,295 0,295 0,0" fill="${secondaryColor}"/>`;
    case "lozengy": {
      const diamonds: string[] = [`<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/>`];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const cx = 130 + c * 48 + (r % 2) * 24;
          const cy = 110 + r * 52;
          diamonds.push(`<polygon points="${cx},${cy - 24} ${cx + 22},${cy} ${cx},${cy + 24} ${cx - 22},${cy}" fill="${secondaryColor}" fill-opacity="0.82"/>`);
        }
      }
      return diamonds.join("");
    }
    case "seme_stars": {
      const stars: string[] = [`<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/>`];
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 5; c++) {
          const sx = 175 + c * 62 + (r % 2) * 30;
          const sy = 140 + r * 66;
          stars.push(`<polygon points="${sx},${sy - 11} ${sx + 3},${sy - 3} ${sx + 11},${sy} ${sx + 3},${sy + 3} ${sx},${sy + 11} ${sx - 3},${sy + 3} ${sx - 11},${sy} ${sx - 3},${sy - 3}" fill="${tertiaryColor}" fill-opacity="0.45"/>`);
        }
      }
      return stars.join("");
    }
    case "solid":
    default:
      return `<rect x="0" y="0" width="600" height="600" fill="${primaryColor}"/>`;
  }
}

function renderOrnamentSvg(id: OrnamentId, color: string): string {
  switch (id) {
    case "imperial_crown":
      return `<g transform="translate(300, 82)" fill="${color}" stroke="#101522" stroke-width="2.2"><path d="M-74 28 L-84 -20 L-40 4 L0 -42 L40 4 L84 -20 L74 28 Z"/><rect x="-74" y="30" width="148" height="16" rx="5"/><circle cx="0" cy="-46" r="7"/><circle cx="-84" cy="-24" r="5"/><circle cx="84" cy="-24" r="5"/></g>`;
    case "royal_crown":
      return `<g transform="translate(300, 86)" fill="${color}" stroke="#101522" stroke-width="2"><path d="M-64 24 L-70 -14 L-32 6 L0 -28 L32 6 L70 -14 L64 24 Z"/><rect x="-64" y="26" width="128" height="13" rx="4"/></g>`;
    case "knight_helmet":
      return `<g transform="translate(300, 80)" fill="${color}" stroke="#101522" stroke-width="2"><path d="M-38 26 C-42 -14 -24 -36 0 -38 C24 -36 42 -14 38 26 Z"/><rect x="-26" y="-4" width="52" height="7" rx="3" fill="#101522"/><path d="M0 -38 C16 -60 44 -52 54 -28 C34 -36 18 -34 4 -24 Z" opacity="0.88"/><rect x="-44" y="24" width="88" height="11" rx="5"/></g>`;
    case "laurel_wreath":
      return `<g fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" opacity="0.9"><path d="M210 475 C115 415 96 250 158 148"/><path d="M390 475 C485 415 504 250 442 148"/><path d="M135 230 L108 210 M122 295 L94 285 M138 365 L112 372 M465 230 L492 210 M478 295 L506 285 M462 365 L488 372" stroke-width="7"/></g>`;
    case "oak_wreath":
      return `<g fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" opacity="0.9"><path d="M206 480 C102 418 82 246 150 140"/><path d="M394 480 C498 418 518 246 450 140"/><circle cx="118" cy="215" r="8" fill="${color}"/><circle cx="106" cy="295" r="9" fill="${color}"/><circle cx="126" cy="375" r="8" fill="${color}"/><circle cx="482" cy="215" r="8" fill="${color}"/><circle cx="494" cy="295" r="9" fill="${color}"/><circle cx="474" cy="375" r="8" fill="${color}"/></g>`;
    case "supporters_wings":
      return `<g fill="${color}" opacity="0.82"><path d="M150 220 C80 140 42 175 62 248 C48 282 74 338 148 350 Z"/><path d="M450 220 C520 140 558 175 538 248 C552 282 526 338 452 350 Z"/></g>`;
    case "banner_supporters":
      return `<g stroke="${color}" stroke-width="6" stroke-linecap="round"><line x1="115" y1="88" x2="465" y2="510"/><line x1="485" y1="88" x2="135" y2="510"/><polygon points="115,88 78,132 146,162" fill="${color}" fill-opacity="0.72"/><polygon points="485,88 522,132 454,162" fill="${color}" fill-opacity="0.72"/></g>`;
    case "royal_mantle":
      return `<path d="M120 120 Q300 40 480 120 L515 445 Q300 530 85 445 Z" fill="#6D3D49" fill-opacity="0.45" stroke="${color}" stroke-width="4"/>`;
    case "decorative_frame":
      return `<g fill="none" stroke="${color}"><circle cx="300" cy="295" r="228" stroke-width="4" stroke-opacity="0.85"/><circle cx="300" cy="295" r="240" stroke-width="1.8" stroke-dasharray="6 8" stroke-opacity="0.65"/></g>`;
    case "baroque_cartouche":
      return `<g fill="none" stroke="${color}" stroke-width="4.5" opacity="0.88"><path d="M134 150 C96 220 96 370 134 440 C190 500 410 500 466 440 C504 370 504 220 466 150 C410 90 190 90 134 150 Z"/><circle cx="118" cy="295" r="10" fill="${color}"/><circle cx="482" cy="295" r="10" fill="${color}"/></g>`;
    case "arcane_halo":
      return `<g fill="none" stroke="${color}" stroke-opacity="0.72"><circle cx="300" cy="295" r="218" stroke-width="2.5"/><circle cx="300" cy="295" r="236" stroke-width="1.5" stroke-dasharray="3 9"/><polygon points="300,52 310,74 300,82 290,74" fill="${color}"/></g>`;
    case "sunburst_halo": {
      const rays: string[] = [];
      for (let i = 0; i < 16; i++) {
        const ang = (i * 22.5 * Math.PI) / 180;
        const x1 = 300 + Math.cos(ang) * 165;
        const y1 = 295 + Math.sin(ang) * 165;
        const x2 = 300 + Math.cos(ang) * (i % 2 === 0 ? 246 : 212);
        const y2 = 295 + Math.sin(ang) * (i % 2 === 0 ? 246 : 212);
        rays.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${i % 2 === 0 ? 5 : 2.5}" stroke-linecap="round" opacity="0.72"/>`);
      }
      return `<g>${rays.join("")}</g>`;
    }
    case "crest_stars":
      return `<g fill="${color}"><polygon points="300,54 306,72 324,78 306,84 300,102 294,84 276,78 294,72"/><polygon points="242,76 246,86 256,90 246,94 242,104 238,94 228,90 238,86"/><polygon points="358,76 362,86 372,90 362,94 358,104 354,94 344,90 354,86"/></g>`;
    default:
      return "";
  }
}

function renderLayerSvg(layer: HeraldryLayer, clipId: string): string {
  if (!layer.visible) return "";
  const sx = (layer.flipX ? -1 : 1) * (layer.scale || 1);
  const sy = (layer.flipY ? -1 : 1) * (layer.scale || 1);
  const transform = `translate(${layer.x}, ${layer.y}) rotate(${layer.rotation || 0}) scale(${sx}, ${sy})`;

  if (layer.kind === "symbol" && layer.symbolId) {
    const sym = SYMBOL_MAP.get(layer.symbolId);
    if (!sym) return "";
    return `<g transform="${transform}" opacity="${layer.opacity}" style="color:${layer.color}" color="${layer.color}">${sym.svgInner}</g>`;
  }

  if (layer.kind === "ornament" && layer.ornamentId && layer.ornamentId !== "none") {
    return `<g opacity="${layer.opacity}">${renderOrnamentSvg(layer.ornamentId, layer.color)}</g>`;
  }

  if (layer.kind === "uploaded_image" && layer.imageUrl) {
    const clipAttr = layer.clipToShield ? ` clip-path="url(#${clipId})"` : "";
    return `<g${clipAttr} opacity="${layer.opacity}"><image href="${escapeXml(layer.imageUrl)}" x="${layer.x - 160 * (layer.scale || 1)}" y="${layer.y - 160 * (layer.scale || 1)}" width="${320 * (layer.scale || 1)}" height="${320 * (layer.scale || 1)}" preserveAspectRatio="xMidYMid meet"/></g>`;
  }

  if (layer.kind === "text" && layer.text) {
    const font = layer.fontFamily || "Cinzel";
    const size = layer.fontSize || 24;
    return `<text x="${layer.x}" y="${layer.y}" text-anchor="middle" fill="${layer.color}" opacity="${layer.opacity}" font-family="${font}, serif" font-size="${size}" font-weight="700" letter-spacing="${layer.letterSpacing || 2}" transform="rotate(${layer.rotation || 0} ${layer.x} ${layer.y})">${escapeXml(layer.text)}</text>`;
  }

  return "";
}

/**
 * Renders any HeraldryDesignData into a clean, valid, standalone SVG string (600x600).
 * Supports Mode A (Use uploaded image directly), Mode B (Edit uploaded image + vector overlays),
 * 15 shield shapes, 10 field divisions, ornaments, multi-layer symbols, and curved Vietnamese motto text.
 */
export function renderHeraldryToSvgString(
  design: HeraldryDesignData,
  opts?: { uid?: string; transparentOverride?: boolean }
): string {
  const uid = (opts?.uid || "hrld").replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `shield-clip-${uid}`;
  const curveId = `motto-curve-${uid}`;
  const sheenId = `metallic-sheen-${uid}`;

  // Mode A: Pure uploaded image emblem
  if (design.uploadedMode === "use_as_image" && design.uploadedImageUrl) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
      <image href="${escapeXml(design.uploadedImageUrl)}" x="30" y="30" width="540" height="540" preserveAspectRatio="xMidYMid meet"/>
    </svg>`;
  }

  const shieldPath = buildShieldPath(design.shield);
  const bgRect =
    !opts?.transparentOverride && design.backgroundMode !== "transparent"
      ? `<rect width="600" height="600" fill="${design.backgroundColor || "#101522"}"/>`
      : "";

  const BEHIND_ORNAMENTS = new Set<OrnamentId>([
    "royal_mantle",
    "supporters_wings",
    "banner_supporters",
    "decorative_frame",
    "baroque_cartouche",
    "arcane_halo",
    "sunburst_halo",
    "laurel_wreath",
    "oak_wreath"
  ]);

  const behindOrnaments = design.layers
    .filter((l) => l.kind === "ornament" && l.ornamentId && BEHIND_ORNAMENTS.has(l.ornamentId))
    .map((l) => renderLayerSvg(l, clipId))
    .join("");

  const frontLayers = design.layers
    .filter((l) => !(l.kind === "ornament" && l.ornamentId && BEHIND_ORNAMENTS.has(l.ornamentId)))
    .map((l) => renderLayerSvg(l, clipId))
    .join("");

  const mottoSvg =
    design.motto?.enabled && design.motto.text.trim()
      ? `<g>
          <path d="M126 516 Q300 568 474 516 L462 552 Q300 602 138 552 Z" fill="${design.motto.ribbonColor}" stroke="${design.shield.borderColor}" stroke-width="2.5"/>
          <path id="${curveId}" d="M148 542 Q300 584 452 542" fill="none"/>
          <text fill="${design.motto.textColor}" font-family="${design.motto.fontFamily}, serif" font-size="${design.motto.fontSize || 16}" font-weight="700" letter-spacing="2">
            <textPath href="#${curveId}" startOffset="50%" text-anchor="middle">${escapeXml(design.motto.text)}</textPath>
          </text>
        </g>`
      : "";

  const gradOverlay =
    design.shield.gradientMode && design.shield.gradientMode !== "none"
      ? design.shield.gradientMode === "vertical"
        ? `<linearGradient id="${sheenId}-v" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/><stop offset="100%" stop-color="#000000" stop-opacity="0.32"/></linearGradient>`
        : design.shield.gradientMode === "radial"
        ? `<radialGradient id="${sheenId}-v" cx="50%" cy="45%" r="60%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="100%" stop-color="#000000" stop-opacity="0.35"/></radialGradient>`
        : `<linearGradient id="${sheenId}-v" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.2"/><stop offset="100%" stop-color="#000000" stop-opacity="0.3"/></linearGradient>`
      : "";

  const textureOverlay =
    design.shield.textureMode === "parchment"
      ? `<rect width="600" height="600" fill="#E9DFC9" fill-opacity="0.08"/>`
      : design.shield.textureMode === "metal_grain"
      ? `<path d="M0 150 H600 M0 250 H600 M0 350 H600 M0 450 H600" stroke="#ffffff" stroke-opacity="0.06" stroke-width="18"/>`
      : design.shield.textureMode === "linen"
      ? `<path d="M150 0 V600 M250 0 V600 M350 0 V600 M450 0 V600 M0 200 H600 M0 400 H600" stroke="#ffffff" stroke-opacity="0.05" stroke-width="6"/>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <clipPath id="${clipId}"><path d="${shieldPath}"/></clipPath>
    <linearGradient id="${sheenId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="48%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.28"/>
    </linearGradient>
    ${gradOverlay}
  </defs>
  ${bgRect}
  ${behindOrnaments}
  <g clip-path="url(#${clipId})">
    ${renderFieldDivisionSvg(design)}
    ${design.shield.metallicEffect ? `<rect width="600" height="600" fill="url(#${sheenId})"/>` : ""}
    ${gradOverlay ? `<rect width="600" height="600" fill="url(#${sheenId}-v)"/>` : ""}
    ${textureOverlay}
  </g>
  <path d="${shieldPath}" fill="none" stroke="${design.shield.borderColor}" stroke-width="${design.shield.borderWidth || 8}" stroke-linejoin="round"/>
  ${
    design.shield.innerBorder
      ? `<path d="${shieldPath}" fill="none" stroke="#E9DFC9" stroke-opacity="0.55" stroke-width="2" transform="translate(300 295) scale(0.92) translate(-300 -295)"/>`
      : ""
  }
  ${frontLayers}
  ${mottoSvg}
</svg>`;
}

/** Client-side Multi-Format & Multi-Resolution Exporter (SVG, PNG, WebP, JPG at 256..2048px) */
export async function exportHeraldryFile(
  design: HeraldryDesignData,
  opts: {
    fileName: string;
    format: "svg" | "png" | "webp" | "jpg";
    resolution: number; // 256 | 512 | 1024 | 2048
    transparentBg?: boolean;
  }
): Promise<void> {
  if (typeof window === "undefined") return;
  const svgStr = renderHeraldryToSvgString(design, {
    uid: "export",
    transparentOverride: opts.format === "jpg" ? false : opts.transparentBg
  });

  if (opts.format === "svg") {
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    triggerDownload(blob, `${opts.fileName}.svg`);
    return;
  }

  const size = Math.max(128, Math.min(4096, opts.resolution || 1024));
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (opts.format === "jpg" || !opts.transparentBg) {
      ctx.fillStyle = design.backgroundColor || "#101522";
      ctx.fillRect(0, 0, size, size);
    }
    ctx.drawImage(img, 0, 0, size, size);

    const mime =
      opts.format === "png"
        ? "image/png"
        : opts.format === "webp"
        ? "image/webp"
        : "image/jpeg";
    const outBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), mime, 0.94)
    );
    if (outBlob) {
      triggerDownload(outBlob, `${opts.fileName}-${size}px.${opts.format}`);
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

function triggerDownload(blob: Blob, name: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
  URL.revokeObjectURL(href);
}

/**
 * Deterministic Heraldry AI Concept & 6-Style Variation Generator
 * Parses Vietnamese/English prompt keywords into authentic heraldic designs & scholarly symbolism text.
 */
export function generateHeraldryAiConcept(prompt: string): {
  conceptName: string;
  symbolismDescription: string;
  variations: Array<{ style: HeraldryStyleId; styleLabel: string; designData: HeraldryDesignData }>;
} {
  const lower = prompt.toLowerCase();
  const pickSym =
    lower.includes("rồng") || lower.includes("dragon")
      ? "sym-dragon"
      : lower.includes("đại bàng") || lower.includes("eagle")
      ? "sym-double-eagle"
      : lower.includes("phượng") || lower.includes("phoenix")
      ? "sym-phoenix"
      : lower.includes("sói") || lower.includes("wolf")
      ? "sym-wolf"
      : lower.includes("hươu") || lower.includes("stag")
      ? "sym-stag"
      : lower.includes("kiếm") || lower.includes("sword")
      ? "sym-crossed-swords"
      : lower.includes("mặt trời") || lower.includes("thái dương") || lower.includes("sun")
      ? "sym-sun"
      : lower.includes("trăng") || lower.includes("moon")
      ? "sym-moon"
      : lower.includes("ma pháp") || lower.includes("arcane")
      ? "sym-magic-circle"
      : lower.includes("sách") || lower.includes("học viện")
      ? "sym-book"
      : "sym-lion";

  const primaryColor =
    lower.includes("đỏ") || lower.includes("crimson") || lower.includes("burgundy")
      ? "#6D3D49"
      : lower.includes("xanh lá") || lower.includes("lục") || lower.includes("emerald")
      ? "#0F5132"
      : lower.includes("tím") || lower.includes("amethyst")
      ? "#4A235A"
      : lower.includes("đen") || lower.includes("obsidian")
      ? "#141821"
      : "#101522";

  const symColor =
    lower.includes("bạc") || lower.includes("silver") || lower.includes("trắng")
      ? "#E5E7EB"
      : "#C6A568";

  const symObj = SYMBOL_MAP.get(pickSym) || HERALDIC_SYMBOLS[0];
  const variationStyles: Array<{ style: HeraldryStyleId; shape: HeraldryDesignData["shield"]["shape"]; division: HeraldryDesignData["shield"]["fieldDivision"]; ornament: OrnamentId }> = [
    { style: "imperial", shape: "royal", division: "quarterly", ornament: "imperial_crown" },
    { style: "medieval_european", shape: "heater", division: "per_pale", ornament: "royal_crown" },
    { style: "gothic", shape: "gothic", division: "solid", ornament: "supporters_wings" },
    { style: "arcane_heraldry", shape: "fantasy", division: "radial_glow", ornament: "arcane_halo" },
    { style: "renaissance", shape: "baroque", division: "chevron", ornament: "laurel_wreath" },
    { style: "classical", shape: "round", division: "solid", ornament: "decorative_frame" }
  ];

  const variations = variationStyles.map((v, idx) => ({
    style: v.style,
    styleLabel: STYLE_LABELS[v.style],
    designData: {
      canvasSize: 600,
      backgroundMode: "transparent" as const,
      backgroundColor: "#101522",
      shield: {
        shape: v.shape,
        widthScale: 1,
        heightScale: 1,
        topCurve: 0,
        bottomPoint: 0,
        borderWidth: 9,
        innerBorder: true,
        borderColor: "#C6A568",
        fieldDivision: v.division,
        primaryColor,
        secondaryColor: "#1D2636",
        tertiaryColor: "#C6A568",
        metallicEffect: true
      },
      layers: [
        {
          id: `ai-sym-${idx}`,
          name: symObj.name,
          kind: "symbol" as const,
          visible: true,
          locked: false,
          x: 300,
          y: 295,
          scale: 1.95,
          rotation: 0,
          opacity: 1,
          color: symColor,
          symbolId: symObj.id
        },
        {
          id: `ai-orn-${idx}`,
          name: `Trang trí (${v.ornament})`,
          kind: "ornament" as const,
          visible: true,
          locked: false,
          x: 300,
          y: 300,
          scale: 1,
          rotation: 0,
          opacity: 1,
          color: "#C6A568",
          ornamentId: v.ornament
        }
      ],
      motto: {
        enabled: true,
        text: "VINH QUANG · TRƯỜNG TỒN",
        ribbonColor: "#1D2636",
        textColor: "#E9DFC9",
        fontFamily: "Cinzel" as const,
        fontSize: 16,
        curved: true
      },
      uploadedMode: "none" as const
    }
  }));

  return {
    conceptName: `Ý tưởng Quốc huy: ${symObj.name}`,
    symbolismDescription: [
      `• Biểu tượng trung tâm (${symObj.name}): tượng trưng cho quyền uy, bản sắc và truyền thống của vương quốc.`,
      `• Nền khiên (${primaryColor}) kết hợp viền Vàng Cổ (#C6A568): thể hiện chiều sâu lịch sử, sự trang nghiêm và tính chính thống hoàng gia.`,
      `• Đề xuất 6 biến thể phong cách (Imperial, Medieval, Gothic, Arcane, Renaissance, Classical) — người biên tập có thể chọn áp dụng vào Canvas để tinh chỉnh từng lớp trước khi lưu chính thức.`
    ].join("\n"),
    variations
  };
}

/**
 * Computes a deterministic structural & visual similarity score (0..100%) between two HeraldryDesignData objects.
 * Used by both Multi-Emblem Comparison (Stage 3) and AI Duplicate/Similarity Detection (Stage 4).
 */
export function computeHeraldrySimilarity(a: HeraldryDesignData, b: HeraldryDesignData): {
  score: number;
  sharedShape: boolean;
  sharedDivision: boolean;
  sharedPrimaryColor: boolean;
  sharedSymbols: string[];
  summary: string;
} {
  let pts = 0;
  const sharedShape = a.shield.shape === b.shield.shape;
  const sharedDivision = a.shield.fieldDivision === b.shield.fieldDivision;
  const sharedPrimaryColor =
    a.shield.primaryColor.toLowerCase() === b.shield.primaryColor.toLowerCase();

  if (sharedShape) pts += 20;
  if (sharedDivision) pts += 20;
  if (sharedPrimaryColor) pts += 20;
  if (a.shield.secondaryColor.toLowerCase() === b.shield.secondaryColor.toLowerCase()) pts += 10;

  const symsA = new Set(a.layers.filter((l) => l.symbolId).map((l) => l.symbolId!));
  const symsB = new Set(b.layers.filter((l) => l.symbolId).map((l) => l.symbolId!));
  const sharedSymbols = [...symsA].filter((id) => symsB.has(id));
  if (symsA.size > 0 || symsB.size > 0) {
    const union = new Set([...symsA, ...symsB]).size;
    pts += Math.round((sharedSymbols.length / Math.max(1, union)) * 30);
  }

  const score = Math.min(100, pts);
  const summary =
    score >= 75
      ? "Rất tương đồng (nên kiểm tra nguy cơ trùng lặp nhận diện)"
      : score >= 45
      ? "Có nét tương đồng về dòng phong cách / màu sắc"
      : "Bản sắc thị giác khác biệt rõ rệt";

  return { score, sharedShape, sharedDivision, sharedPrimaryColor, sharedSymbols, summary };
}

/**
 * Analyzes heraldic composition quality (contrast, symmetry, layer count, tincture rule)
 * strictly as read-only advisory feedback (never auto-edits user or official designs).
 */
export function analyzeHeraldryComposition(design: HeraldryDesignData): {
  overallScore: number;
  findings: Array<{ level: "ok" | "tip" | "warn"; message: string }>;
} {
  const findings: Array<{ level: "ok" | "tip" | "warn"; message: string }> = [];
  let score = 100;

  const visibleLayers = design.layers.filter((l) => l.visible);
  const symbolLayers = visibleLayers.filter((l) => l.kind === "symbol");

  if (symbolLayers.length === 0 && design.uploadedMode !== "use_as_image") {
    score -= 25;
    findings.push({ level: "warn", message: "Chưa có biểu tượng trung tâm trên mặt khiên." });
  } else if (symbolLayers.length > 5) {
    score -= 15;
    findings.push({
      level: "tip",
      message: `Đang có ${symbolLayers.length} lớp biểu tượng — nên rút gọn xuống 1–3 biểu tượng chính để giữ độ sắc nét ở kích thước nhỏ.`
    });
  } else {
    findings.push({ level: "ok", message: `Mật độ biểu tượng hợp lý (${symbolLayers.length} lớp).` });
  }

  const offCenter = symbolLayers.filter((l) => Math.abs(l.x - 300) > 12 && Math.abs(l.x - 300) < 48);
  if (offCenter.length > 0) {
    score -= 10;
    findings.push({
      level: "tip",
      message: "Có lớp biểu tượng hơi lệch trục giữa — có thể dùng nút Căn giữa X (Smart Align) để cân đối."
    });
  } else {
    findings.push({ level: "ok", message: "Bố cục đối xứng trục cân bằng tốt." });
  }

  if (design.shield.primaryColor.toLowerCase() === design.shield.secondaryColor.toLowerCase() && design.shield.fieldDivision !== "solid") {
    score -= 15;
    findings.push({
      level: "warn",
      message: "Màu nền chính và phụ đang trùng nhau nên kiểu chia nền chưa nổi bật."
    });
  }

  if (design.motto?.enabled && design.motto.text.length > 38) {
    score -= 10;
    findings.push({
      level: "tip",
      message: "Khẩu hiệu hơi dài (>38 ký tự), nên rút gọn để chữ cong trên dải ruy-băng dễ đọc hơn."
    });
  }

  return { overallScore: Math.max(30, score), findings };
}
