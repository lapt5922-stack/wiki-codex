"use client";

import React from "react";
import {
  Clock,
  CloudRain,
  Compass,
  Flame,
  History,
  Leaf,
  Snowflake,
  Sparkles,
  Sun
} from "lucide-react";
import type {
  EntityEmblemConfig,
  EntityEraSnapshot,
  EntryCardProjection
} from "@/types/codex";

/* ==================== 1. HERALDRY / COAT OF ARMS SVG GENERATOR ==================== */
export function EntityEmblemSVG({
  config,
  sigil = "✦",
  size = 56,
  className = ""
}: {
  config?: EntityEmblemConfig | null;
  sigil?: string;
  size?: number;
  className?: string;
}) {
  const primary = config?.primaryColor || "#3B82F6";
  const secondary = config?.secondaryColor || "#D4AF37";
  const shape = config?.shape || "shield";
  const motif = config?.motif || "star";

  const renderShapePath = () => {
    switch (shape) {
      case "banner":
        return "M12 6 H52 V56 L32 45 L12 56 Z";
      case "crest":
        return "M32 4 L54 14 V34 C54 48 42 57 32 60 C22 57 10 48 10 34 V14 Z";
      case "seal":
        return "M32 6 A26 26 0 1 0 32 58 A26 26 0 1 0 32 6 Z";
      case "shield":
      default:
        return "M12 8 H52 V32 C52 46 41 55 32 59 C23 55 12 46 12 32 Z";
    }
  };

  const renderMotif = () => {
    switch (motif) {
      case "crown":
        return (
          <path
            d="M20 37 L23 24 L29 30 L32 21 L35 30 L41 24 L44 37 Z"
            fill={secondary}
            stroke="#0f172a"
            strokeWidth="1.2"
          />
        );
      case "waves":
        return (
          <g stroke={secondary} strokeWidth="2.6" fill="none" strokeLinecap="round">
            <path d="M18 28 Q25 22 32 28 T46 28" />
            <path d="M18 36 Q25 30 32 36 T46 36" />
          </g>
        );
      case "tree":
        return (
          <g fill={secondary}>
            <polygon points="32,17 22,33 42,33" />
            <polygon points="32,24 20,39 44,39" />
            <rect x="30" y="39" width="4" height="7" rx="1" />
          </g>
        );
      case "mountain":
        return (
          <g>
            <polygon points="18,41 29,22 40,41" fill={secondary} opacity="0.95" />
            <polygon points="30,41 39,26 47,41" fill="#ffffff" opacity="0.7" />
          </g>
        );
      case "sun":
        return (
          <g stroke={secondary} fill={secondary}>
            <circle cx="32" cy="31" r="7" />
            <path d="M32 18 V21 M32 41 V44 M19 31 H22 M42 31 H45 M23 22 L25 24 M39 38 L41 40 M41 22 L39 24 M25 38 L23 40" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        );
      case "scales":
        return (
          <g stroke={secondary} strokeWidth="2.2" fill="none" strokeLinecap="round">
            <path d="M32 20 V42 M22 25 H42 M26 42 H38" />
            <path d="M22 25 L18 34 H26 Z M42 25 L38 34 H46 Z" fill={secondary} fillOpacity="0.25" />
          </g>
        );
      case "compass":
        return (
          <g>
            <polygon points="32,17 36,31 32,45 28,31" fill={secondary} />
            <polygon points="18,31 32,27 46,31 32,35" fill="#ffffff" opacity="0.85" />
          </g>
        );
      case "star":
      default:
        return (
          <text
            x="32"
            y="38"
            textAnchor="middle"
            fontSize="20"
            fill={secondary}
            fontWeight="700"
          >
            {sigil || "✦"}
          </text>
        );
    }
  };

  const uid = React.useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`shrink-0 drop-shadow-md ${className}`}
      aria-label="Huy hiệu thực thể"
    >
      <defs>
        <linearGradient id={`emb-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primary} stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.92" />
        </linearGradient>
      </defs>
      <path
        d={renderShapePath()}
        fill={`url(#emb-${uid})`}
        stroke={secondary}
        strokeWidth="2.5"
      />
      <path
        d={renderShapePath()}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.22"
        strokeWidth="1"
        transform="scale(0.86) translate(5.2, 5.2)"
      />
      {renderMotif()}
    </svg>
  );
}

/* ==================== 2. 4-SEASON CLIMATE MINI STRIP ==================== */
export function ClimateFourSeasonStrip({
  biomeText,
  elevationM,
  compact = false
}: {
  biomeText?: string;
  elevationM?: number;
  compact?: boolean;
}) {
  const b = (biomeText || "").toLowerCase();
  let temps: [number, number, number, number] = [16, 25, 15, 6]; // Xuân, Hạ, Thu, Đông
  let rain = "Trung bình (950 mm/năm)";

  if (b.includes("băng") || b.includes("cực")) {
    temps = [-12, -2, -14, -28];
    rain = "Tuyết rơi ổn định (320 mm/năm)";
  } else if (b.includes("sa mạc") || b.includes("cát")) {
    temps = [28, 41, 29, 14];
    rain = "Khô hạn (< 140 mm/năm)";
  } else if (b.includes("rừng mưa") || b.includes("nhiệt đới")) {
    temps = [27, 31, 28, 25];
    rain = "Mưa ẩm quanh năm (2.600 mm/năm)";
  } else if (b.includes("núi lửa") || b.includes("địa nhiệt")) {
    temps = [21, 30, 22, 13];
    rain = "Mưa tro nhẹ (780 mm/năm)";
  } else if (b.includes("san hô") || b.includes("biển") || b.includes("đảo")) {
    temps = [24, 29, 25, 21];
    rain = "Gió mùa hải dương (1.650 mm/năm)";
  } else if (b.includes("cao nguyên") || b.includes("sơn") || b.includes("núi")) {
    temps = [9, 17, 10, -4];
    rain = "Sương mù & tuyết đỉnh (1.120 mm/năm)";
  } else if (b.includes("hẻm núi") || b.includes("khô")) {
    temps = [22, 34, 23, 9];
    rain = "Khô ráo (390 mm/năm)";
  }

  const seasons = [
    { label: "Xuân", temp: temps[0], icon: Leaf, color: "#34D399" },
    { label: "Hạ", temp: temps[1], icon: Sun, color: "#F59E0B" },
    { label: "Thu", temp: temps[2], icon: Flame, color: "#FB923C" },
    { label: "Đông", temp: temps[3], icon: Snowflake, color: "#38BDF8" }
  ];

  return (
    <div className={`rounded-xl border border-codex-border/80 bg-codex-panel/50 ${compact ? "p-2.5" : "p-3.5"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="text-xs font-semibold text-codex-gold flex items-center gap-1.5">
          <CloudRain className="w-3.5 h-3.5" />
          <span>Khí hậu 4 Mùa (Nhiệt độ trung bình)</span>
        </div>
        <div className="text-[11px] text-codex-muted">
          {rain}
          {typeof elevationM === "number" && elevationM > 0 ? ` · Cao độ ${elevationM.toLocaleString("vi-VN")} m` : ""}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {seasons.map((s) => {
          const Icon = s.icon;
          const pct = Math.max(8, Math.min(100, Math.round(((s.temp + 30) / 75) * 100)));
          return (
            <div key={s.label} className="rounded-lg bg-codex-bg/60 border border-codex-border/60 p-2 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-codex-muted mb-1">
                <Icon className="w-3 h-3" style={{ color: s.color }} />
                <span>{s.label}</span>
              </div>
              <div className="text-sm font-bold text-codex-text tabular-nums">{s.temp}°C</div>
              <div className="mt-1.5 h-1.5 rounded-full bg-codex-border/50 overflow-hidden">
                <div
                  className="h-full rounded-full economy-bar-fill"
                  style={{ width: `${pct}%`, backgroundColor: s.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==================== 3. INLINE MINI-TIMELINE STRIP ==================== */
export function InlineMiniTimelineStrip({
  snapshots,
  onJumpToEras
}: {
  snapshots?: EntityEraSnapshot[];
  onJumpToEras?: () => void;
}) {
  if (!snapshots || snapshots.length === 0) return null;
  const visible = snapshots.slice(0, 4);

  return (
    <div className="rounded-xl border border-codex-border/80 bg-codex-panel/40 p-3.5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="text-xs font-semibold text-codex-gold flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" />
          <span>Cột mốc Lịch sử Nổi bật ({snapshots.length})</span>
        </div>
        {onJumpToEras && (
          <button
            type="button"
            onClick={onJumpToEras}
            className="text-[11px] text-codex-gold hover:underline"
          >
            Xem chi tiết Thời đại →
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {visible.map((era, idx) => (
          <div
            key={era.id || idx}
            className="relative rounded-lg border border-codex-border/70 bg-codex-bg/60 p-2.5 hover:border-codex-gold/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-codex-gold/15 text-codex-gold">
                {era.yearLabel}
              </span>
              <span className="text-[10px] text-codex-muted">#{idx + 1}</span>
            </div>
            <div className="text-xs font-semibold text-codex-text line-clamp-1">{era.eraLabel}</div>
            <p className="text-[11px] text-codex-muted line-clamp-2 mt-1 leading-relaxed">{era.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== 4. READING BREADCRUMB TRAIL (Feature #5) ==================== */
export interface TrailItem {
  id: string;
  title: string;
  sigil: string;
}

export function ReadingBreadcrumbTrail({
  trail,
  currentEntryId,
  onSelectEntry
}: {
  trail: TrailItem[];
  currentEntryId?: string | null;
  onSelectEntry: (id: string) => void;
}) {
  if (trail.length < 2) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-1.5 px-3 rounded-lg border border-codex-border/60 bg-codex-panel/40 text-xs">
      <Clock className="w-3.5 h-3.5 text-codex-gold shrink-0" />
      <span className="text-[11px] text-codex-muted shrink-0 mr-1">Dấu chân đọc:</span>
      {trail.map((item, idx) => {
        const isCurrent = item.id === currentEntryId;
        return (
          <React.Fragment key={`${item.id}-${idx}`}>
            {idx > 0 && <span className="text-codex-muted/50 shrink-0">›</span>}
            <button
              type="button"
              onClick={() => onSelectEntry(item.id)}
              className={`shrink-0 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                isCurrent
                  ? "bg-codex-gold/20 text-codex-gold font-semibold"
                  : "text-codex-muted hover:text-codex-text hover:bg-codex-panel"
              }`}
            >
              <span>{item.sigil}</span>
              <span className="max-w-[140px] truncate">{item.title}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ==================== 5. SMART LORE RECOMMENDER (Feature #7) ==================== */
export function SmartLoreRecommender({
  currentEntryId,
  currentCategoryId,
  currentTags,
  allCards,
  onOpenEntry
}: {
  currentEntryId: string;
  currentCategoryId: string | null;
  currentTags: string[];
  allCards: EntryCardProjection[];
  onOpenEntry: (id: string) => void;
}) {
  const recommendations = React.useMemo(() => {
    const tagSet = new Set(currentTags.map((t) => t.toLowerCase()));
    const scored = allCards
      .filter((c) => c.id !== currentEntryId && !c.deletedAt)
      .map((c) => {
        let score = 0;
        const reasons: string[] = [];
        if (currentCategoryId && c.categoryId === currentCategoryId) {
          score += 5;
          reasons.push("Cùng danh mục/lục địa");
        }
        const sharedTags = (c.tags || []).filter((t) => tagSet.has(t.toLowerCase()));
        if (sharedTags.length > 0) {
          score += sharedTags.length * 3;
          reasons.push(`Chung ${sharedTags.length} thẻ`);
        }
        if (c.economySummary && c.economySummary.literacyRate >= 80) {
          score += 1;
        }
        if (c.featured) score += 1;
        return { card: c, score, reason: reasons[0] || "Đề xuất bách khoa" };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return scored;
  }, [currentEntryId, currentCategoryId, currentTags, allCards]);

  if (recommendations.length === 0) return null;

  return (
    <div className="rounded-xl border border-codex-border/80 bg-codex-panel/40 p-4 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Compass className="w-4 h-4 text-codex-gold" />
        <h3 className="text-sm font-serif font-semibold text-codex-gold">
          Gợi ý Hồ sơ Liên quan Thông minh
        </h3>
        <span className="text-[11px] text-codex-muted">({recommendations.length} đề xuất)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {recommendations.map(({ card, reason }) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onOpenEntry(card.id)}
            className="text-left rounded-lg border border-codex-border/70 bg-codex-bg/60 hover:border-codex-gold/60 p-3 transition-colors group"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-semibold text-codex-text group-hover:text-codex-gold transition-colors truncate flex items-center gap-1.5">
                <span className="text-codex-gold">{card.sigil}</span>
                <span className="truncate">{card.title}</span>
              </span>
              <Sparkles className="w-3 h-3 text-codex-gold/60 shrink-0" />
            </div>
            <p className="text-[11px] text-codex-muted line-clamp-2">{card.summary || card.subtitle}</p>
            <div className="mt-2 flex items-center justify-between gap-1 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-codex-gold/10 text-codex-gold">{reason}</span>
              {card.economySummary && (
                <span className="text-codex-muted font-mono">
                  {card.economySummary.currencyCode} · HV {card.economySummary.literacyRate}%
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
