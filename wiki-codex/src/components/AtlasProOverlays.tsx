"use client";

import React from "react";
import {
  Compass,
  Eye,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sparkles,
  X
} from "lucide-react";
import type {
  AtlasWikiLens,
  PlanetaryNation
} from "@/lib/planetary-atlas/types";
import {
  WORLD_CURRENCIES,
  buildNationEconomyProfile,
  deriveNationEmblemConfig
} from "@/lib/economy-engine";
import { EntityEmblemSVG } from "./EntityVisualWidgets";

/* ==================== 1. INTERACTIVE MINI-MAP RADAR (Feature #2) ==================== */
export function AtlasMiniMapRadar({
  terrainPreviewUrl,
  viewBounds,
  onJumpToNormalized,
  selectedNation
}: {
  terrainPreviewUrl: string | null;
  viewBounds: { minX: number; maxX: number; minY: number; maxY: number };
  onJumpToNormalized: (nx: number, ny: number) => void;
  selectedNation?: PlanetaryNation | null;
}) {
  const handlePointer = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0.02, Math.min(0.98, (e.clientY - rect.top) / rect.height));
    onJumpToNormalized(nx, ny);
  };

  const leftPct = Math.max(0, Math.min(100, viewBounds.minX * 100));
  const topPct = Math.max(0, Math.min(100, viewBounds.minY * 100));
  const widthPct = Math.max(4, Math.min(100 - leftPct, (viewBounds.maxX - viewBounds.minX) * 100));
  const heightPct = Math.max(4, Math.min(100 - topPct, (viewBounds.maxY - viewBounds.minY) * 100));

  return (
    <div className="rounded-xl border border-amber-400/40 bg-slate-950/90 p-1.5 shadow-2xl backdrop-blur-md w-44 sm:w-52 select-none">
      <div className="flex items-center justify-between px-1 pb-1 text-[10px] font-semibold text-amber-300/90">
        <span>RADAR ĐỊNH VỊ</span>
        <span className="font-mono text-slate-400">64.000 km</span>
      </div>
      <div
        onClick={handlePointer}
        className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-slate-700/80 bg-slate-900 cursor-crosshair"
        title="Bấm bất kỳ vị trí nào để bay tới ngay lập tức"
      >
        {terrainPreviewUrl && (
          <img
            src={terrainPreviewUrl}
            alt="Mini-Map Radar"
            className="w-full h-full object-cover opacity-90 pointer-events-none"
          />
        )}
        {selectedNation && (
          <div
            className="absolute w-2 h-2 -ml-1 -mt-1 rounded-full bg-amber-300 ring-2 ring-amber-400/60 pointer-events-none"
            style={{ left: `${selectedNation.x * 100}%`, top: `${selectedNation.y * 100}%` }}
          />
        )}
        <div
          className="absolute border-[1.5px] border-cyan-300 bg-cyan-400/15 shadow-[0_0_8px_rgba(34,211,238,0.5)] pointer-events-none transition-all duration-75"
          style={{
            left: `${leftPct}%`,
            top: `${topPct}%`,
            width: `${widthPct}%`,
            height: `${heightPct}%`
          }}
        />
      </div>
    </div>
  );
}

/* ==================== 2. DYNAMIC FLOATING LEGEND CARD (10 Lenses) ==================== */
export function AtlasLiveLegendCard({ lens }: { lens: AtlasWikiLens }) {
  const items: Array<{ label: string; color: string }> = React.useMemo(() => {
    switch (lens) {
      case "ECONOMY":
        return [
          { label: "Xuất sắc (≥85%)", color: "#10b981" },
          { label: "Cao (78–84%)", color: "#34d399" },
          { label: "Khá (72–77%)", color: "#38bdf8" },
          { label: "Trung bình (66–71%)", color: "#fbbf24" },
          { label: "Đang phát triển", color: "#f97316" }
        ];
      case "CURRENCY":
        return WORLD_CURRENCIES.slice(0, 6).map((c) => ({
          label: `${c.code} (${c.regionLabel.split(" ")[0]})`,
          color: c.color
        }));
      case "TRADE_BALANCE":
        return [
          { label: "Thặng dư mạnh (≥+10%)", color: "#059669" },
          { label: "Thặng dư nhẹ", color: "#34d399" },
          { label: "Cân bằng ổn định", color: "#f59e0b" },
          { label: "Nhập siêu hạ tầng", color: "#38bdf8" }
        ];
      case "TERRAIN":
        return [
          { label: "Đỉnh tuyết >3200m", color: "#cbd5e1" },
          { label: "Sơn mạch 1200–3200m", color: "#9c6d49" },
          { label: "Cao nguyên", color: "#b8a056" },
          { label: "Đồng bằng & Rừng", color: "#2f7d57" }
        ];
      case "CLIMATE":
        return [
          { label: "Nóng >30°C", color: "#ef4444" },
          { label: "Ấm 18–25°C", color: "#facc15" },
          { label: "Ôn hòa 10–18°C", color: "#4ade80" },
          { label: "Lạnh ≤0°C", color: "#38bdf8" }
        ];
      case "DEMOGRAPHICS":
        return [
          { label: "Siêu đô thị ≥80M", color: "#7c3aed" },
          { label: "Đông dân 15–80M", color: "#c026d3" },
          { label: "Trung bình 5–15M", color: "#e879f9" },
          { label: "Thưa dân <5M", color: "#fae8ff" }
        ];
      case "DIPLOMACY":
        return [
          { label: "Liên minh", color: "#10b981" },
          { label: "Liên bang", color: "#3b82f6" },
          { label: "Hiệp ước Thương mại", color: "#f59e0b" },
          { label: "Cạnh tranh", color: "#ef4444" }
        ];
      default:
        return [
          { label: "Đồng bằng & Rừng", color: "#22c55e" },
          { label: "Sa mạc & Hẻm núi", color: "#eab308" },
          { label: "Núi lửa & Cao nguyên", color: "#f97316" },
          { label: "Băng nguyên & Biển", color: "#38bdf8" }
        ];
    }
  }, [lens]);

  return (
    <div className="rounded-xl border border-amber-400/30 bg-slate-950/85 px-3 py-2 text-[11px] text-slate-200 backdrop-blur-md shadow-xl max-w-[220px]">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300 mb-1.5">
        Chú giải · {lens}
      </div>
      <div className="space-y-1">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0 border border-white/20"
              style={{ backgroundColor: it.color }}
            />
            <span className="truncate text-slate-300">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== 3. RICH FLOATING HOVER TOOLTIP WITH EMBLEM (Feature #7) ==================== */
export function AtlasRichHoverCard({
  nation,
  screenPos
}: {
  nation: PlanetaryNation;
  screenPos: { x: number; y: number };
}) {
  const econ = React.useMemo(() => buildNationEconomyProfile(nation), [nation]);
  const emblem = React.useMemo(() => deriveNationEmblemConfig(nation), [nation]);
  const literacy = econ.developmentMeters.find((m) => m.id === "dev-literacy")?.score ?? 0;
  const infra = econ.developmentMeters.find((m) => m.id === "dev-infra")?.score ?? 0;

  return (
    <div
      className="pointer-events-none fixed z-50 w-64 rounded-2xl border border-amber-400/45 bg-slate-950/92 p-3 text-xs text-slate-100 shadow-2xl backdrop-blur-md"
      style={{
        left: Math.min(typeof window !== "undefined" ? window.innerWidth - 275 : 800, screenPos.x + 16),
        top: Math.max(12, Math.min(typeof window !== "undefined" ? window.innerHeight - 190 : 500, screenPos.y - 24))
      }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <EntityEmblemSVG config={emblem} size={38} />
        <div className="min-w-0">
          <div className="font-serif font-bold text-sm text-amber-200 truncate">
            #{nation.nationNum} {nation.shortName}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Thủ đô: <strong className="text-slate-200">{nation.capital}</strong> · {econ.currencyCode}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center mb-2">
        <div className="rounded-lg bg-slate-900/90 border border-slate-800 py-1 px-1">
          <div className="text-[9px] text-slate-400">Dân số</div>
          <div className="font-mono font-bold text-[11px] text-white">
            {(nation.population / 1_000_000).toFixed(1)}M
          </div>
        </div>
        <div className="rounded-lg bg-slate-900/90 border border-slate-800 py-1 px-1">
          <div className="text-[9px] text-slate-400">Học vấn</div>
          <div className="font-mono font-bold text-[11px] text-purple-300">{literacy}%</div>
        </div>
        <div className="rounded-lg bg-slate-900/90 border border-slate-800 py-1 px-1">
          <div className="text-[9px] text-slate-400">Hạ tầng</div>
          <div className="font-mono font-bold text-[11px] text-sky-300">{infra}%</div>
        </div>
      </div>

      {/* Mini Sector Stacked Bar */}
      <div className="flex h-2 rounded-full overflow-hidden border border-slate-700">
        {econ.sectorBreakdown.map((sec) => (
          <div
            key={sec.id}
            style={{ width: `${sec.percentage}%`, backgroundColor: sec.color }}
            className="h-full"
          />
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
        <span>{econ.tradeBalance.balanceLabel}</span>
        <span>Cao độ {nation.elevationM.toLocaleString("vi-VN")}m</span>
      </div>
    </div>
  );
}

/* ==================== 4. LIVE VIEWPORT INSPECTOR + DYNAMIC KM SCALE BAR ==================== */
export function AtlasViewportInspector({
  visibleNations,
  zoom,
  cursorCoord
}: {
  visibleNations: PlanetaryNation[];
  zoom: number;
  cursorCoord?: { lat: string; lon: string } | null;
}) {
  const stats = React.useMemo(() => {
    const totalPop = visibleNations.reduce((s, n) => s + n.population, 0);
    return { count: visibleNations.length, totalPopM: (totalPop / 1_000_000).toFixed(1) };
  }, [visibleNations]);

  // Dynamic km scale bar: at zoom=1 full width ~ 64,000 km; a 96px bar represents ~ 64000 / (zoom * 11)
  const rawKm = 64000 / Math.max(1, zoom * 10);
  const niceKm =
    rawKm >= 4000 ? 5000 : rawKm >= 2000 ? 2500 : rawKm >= 1000 ? 1000 : rawKm >= 400 ? 500 : 250;

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-amber-400/30 bg-slate-950/85 px-3 py-1.5 text-[11px] text-slate-200 backdrop-blur-md shadow-xl">
      <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
        <Compass className="w-3.5 h-3.5" />
        <span>{zoom.toFixed(1)}×</span>
      </span>
      <span className="inline-flex items-center gap-1 text-slate-300">
        <Eye className="w-3 h-3 text-cyan-400" />
        <strong>{stats.count}</strong> QG · <strong className="font-mono">{stats.totalPopM}M</strong> dân
      </span>
      {cursorCoord && (
        <span className="hidden md:inline font-mono text-[10px] text-cyan-300">
          {cursorCoord.lat} · {cursorCoord.lon}
        </span>
      )}
      <div className="flex items-center gap-1.5 pl-1 border-l border-slate-700">
        <div className="w-16 h-1.5 border-x border-b border-amber-300/90 rounded-b-sm" />
        <span className="font-mono text-[10px] text-amber-200">{niceKm.toLocaleString("vi-VN")} km</span>
      </div>
    </div>
  );
}

/* ==================== 5. CINEMATIC WORLD TOUR CONTROLLER (Feature #1) ==================== */
export const WORLD_TOUR_STOPS: Array<{ nationNum: number; title: string; narration: string }> = [
  { nationNum: 1, title: "Valoria — Trái tim Liên minh Tam Biên", narration: "Cường quốc đồng bằng ôn đới và trung tâm lưu trữ hiến chương của lục địa Aurelia." },
  { nationNum: 2, title: "Zog-Koth — Hẻm núi Đá Đỏ", narration: "Nút giao thương lữ hành vĩ đại kết nối miền trung Aurelia qua các hẻm núi hùng vĩ." },
  { nationNum: 3, title: "Ignisia — Kinh đô Địa nhiệt & Luyện kim", narration: "Thành phố thủy tinh và công nghệ địa nhiệt rực sáng bên dãy núi lửa phương Đông." },
  { nationNum: 201, title: "Vùng Đệm Lưu Trữ Concordia (#201)", narration: "Đặc khu trung lập bảo quản toàn bộ hiệp ước hòa bình của hành tinh." },
  { nationNum: 203, title: "Học Viện Ngã Ba Tam Biên (#203)", narration: "Quy tụ hơn 40.000 học giả, nhà bản đồ học và ngôn ngữ học liên lục địa." },
  { nationNum: 4, title: "Cộng hòa Ngân Hà Occidentia (#4)", narration: "Trung tâm tài chính bạc Argent và đài thiên văn lớn nhất phương Tây." },
  { nationNum: 5, title: "Thiên Triều Ngọc Lĩnh (#5)", narration: "Cổ quốc Viễn Đông nổi tiếng với nền hành chính khoa cử và lưu vực Long Mạch." },
  { nationNum: 7, title: "Vương quốc Lục Bảo Solara (#7)", narration: "Vùng rừng mưa xích đạo giàu dược thảo và đài quan sát nhật thực Heliopolis." },
  { nationNum: 9, title: "Quần đảo Trung Dương Pelagia (#9)", narration: "Thương cảng tự do san hô kết nối mọi hải trình giữa 8 lục địa." },
  { nationNum: 10, title: "Liên hiệp Khảo sát Bắc Cực (#10)", narration: "Vành đai băng nguyên cực quang lưu giữ ký ức khí hậu nguyên sơ của hành tinh." }
];

export function AtlasWorldTourBanner({
  stopIndex,
  playing,
  onTogglePlay,
  onPrev,
  onNext,
  onClose
}: {
  stopIndex: number;
  playing: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const stop = WORLD_TOUR_STOPS[stopIndex] ?? WORLD_TOUR_STOPS[0];
  return (
    <div className="rounded-2xl border border-amber-400/50 bg-slate-950/92 px-4 py-3 text-xs text-slate-100 shadow-2xl backdrop-blur-md max-w-md space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Du hành Hành tinh ({stopIndex + 1}/{WORLD_TOUR_STOPS.length})</span>
        </span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onPrev} className="p-1 rounded hover:bg-slate-800 cursor-pointer" title="Điểm trước">
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="p-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 cursor-pointer"
            title={playing ? "Tạm dừng" : "Tiếp tục"}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button type="button" onClick={onNext} className="p-1 rounded hover:bg-slate-800 cursor-pointer" title="Điểm tiếp">
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 cursor-pointer" title="Đóng Tour">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="font-serif font-bold text-sm text-white">{stop.title}</div>
      <p className="text-[11px] text-slate-300 leading-relaxed">{stop.narration}</p>
    </div>
  );
}
