"use client";

import React from "react";
import { CheckSquare, EyeOff, Link2, Lock, Sparkles, Square } from "lucide-react";
import type { Category, EntityCardStyle, EntryCardProjection, EntryType } from "@/types/codex";
import { classifyPowerTier, formatUnboundedPower } from "@/lib/v3-engines";

interface EntityCodexCardProps {
  entry: EntryCardProjection;
  entryType?: EntryType;
  category?: Category;
  canEdit: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

function resolveCardStyle(entry: EntryCardProjection, entryType?: EntryType): EntityCardStyle {
  if (entry.cardStyle) return entry.cardStyle;
  if (entryType?.cardStyle) return entryType.cardStyle;
  const slug = entryType?.slug || "";
  if (slug.includes("nhan-vat")) return "character";
  if (slug.includes("vuong-quoc")) return "kingdom";
  if (slug.includes("ngon-ngu")) return "language";
  if (slug.includes("co-vat")) return "artifact";
  if (slug.includes("sinh-vat")) return "creature";
  if (slug.includes("thanh-pho")) return "city";
  if (slug.includes("dia-danh")) return "landmark";
  if (slug.includes("ton-giao")) return "religion";
  if (slug.includes("quy-luat") || slug.includes("ky-thuat")) return "system";
  if (slug.includes("su-kien")) return "event";
  if (slug.includes("dong-toc")) return "house";
  if (slug.includes("to-chuc")) return "organization";
  return "lore";
}

export function EntityCodexCard({
  entry,
  entryType,
  category,
  canEdit,
  selected,
  onToggleSelect,
  onOpen
}: EntityCodexCardProps) {
  const style = resolveCardStyle(entry, entryType);
  const accent = entryType?.color || "#D4AF37";
  const hasPower =
    entry.supportsPower !== false &&
    (entry.powerLevel !== undefined || entry.powerInfinite);
  const tier = hasPower
    ? classifyPowerTier(entry.powerLevel, entry.powerInfinite, entry.powerTierOverride)
    : null;
  const highlights = entry.cardHighlights || [];
  const topAttrs = hasPower ? (entry.attributes || []).slice(0, 3) : [];

  const selectBtn = canEdit && (
    <button
      type="button"
      onClick={(ev) => {
        ev.stopPropagation();
        onToggleSelect(entry.id);
      }}
      className="p-1 rounded-lg bg-black/55 hover:bg-black/80 text-white/90 cursor-pointer z-10"
      title="Chọn thẻ này"
    >
      {selected ? (
        <CheckSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
      ) : (
        <Square className="w-3.5 h-3.5" />
      )}
    </button>
  );

  const footerRow = (
    <div className="flex items-center justify-between pt-2 mt-auto border-t border-white/10 text-[10px] text-[var(--text-muted)]">
      <div className="flex items-center gap-1.5 min-w-0 truncate">
        {category && (
          <span className="px-1.5 py-0.5 rounded bg-white/8 truncate max-w-[120px]">
            {category.sigil} {category.name}
          </span>
        )}
        {(entry.extraFieldCount ?? 0) > 0 && (
          <span className="font-mono text-[var(--accent)]">+{entry.extraFieldCount} trường</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0 font-mono">
        {entry.visibility === "private" && <Lock className="w-3 h-3 text-amber-400" />}
        {entry.spoilerGate && <EyeOff className="w-3 h-3 text-purple-300" />}
        <span className="flex items-center gap-0.5">
          <Link2 className="w-3 h-3" /> {entry.backlinkCount}
        </span>
      </div>
    </div>
  );

  /* ==========================================================================
     1. CHARACTER — Portrait Hero Collectible Foil Card
     ========================================================================== */
  if (style === "character") {
    return (
      <article
        onClick={() => onOpen(entry.id)}
        className={`group relative rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 border-2 ${
          selected ? "ring-2 ring-[var(--accent)]" : ""
        }`}
        style={{
          borderColor: `${accent}77`,
          background:
            "linear-gradient(165deg, rgba(28,18,52,0.96) 0%, rgba(12,16,34,0.98) 65%, rgba(24,18,40,0.96) 100%)",
          boxShadow: `0 12px 30px -14px ${accent}55`
        }}
      >
        {/* Top Hero Header */}
        <div className="relative h-40 overflow-hidden">
          {entry.thumbImage ? (
            <img
              src={entry.thumbImage}
              alt={entry.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-6xl opacity-25"
              style={{
                background: `radial-gradient(circle at 50% 40%, ${accent}44, transparent 70%)`,
                color: accent
              }}
            >
              {entry.sigil}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1124] via-[#0d1124]/30 to-transparent" />
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              {selectBtn}
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold backdrop-blur-md border"
                style={{
                  backgroundColor: "rgba(10,12,24,0.75)",
                  borderColor: `${accent}88`,
                  color: accent
                }}
              >
                {entry.sigil} NHÂN VẬT
              </span>
            </div>
            {tier && (
              <span
                className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold backdrop-blur-md border shadow-md"
                style={{
                  backgroundColor: "rgba(10,12,24,0.85)",
                  borderColor: `${tier.color}99`,
                  color: tier.color
                }}
              >
                ⚡ {formatUnboundedPower(entry.powerLevel, entry.powerInfinite)}
              </span>
            )}
          </div>
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-lg text-white leading-tight truncate drop-shadow">
                {entry.title}
              </h3>
              {entry.subtitle && (
                <p className="text-[11px] text-purple-200/85 italic truncate">{entry.subtitle}</p>
              )}
            </div>
            {(entry.variantCount ?? 0) > 1 && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/25 border border-amber-400/50 text-[10px] font-mono text-amber-200 shrink-0">
                ✦ {entry.variantCount} dạng
              </span>
            )}
          </div>
        </div>

        {/* Character Mini-Stats + Highlights */}
        <div className="p-3.5 flex-1 flex flex-col gap-2.5">
          {topAttrs.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {topAttrs.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-center"
                >
                  <div className="text-[9px] text-[var(--text-muted)] truncate">{a.label}</div>
                  <div className="font-mono text-xs font-bold mt-0.5" style={{ color: a.color }}>
                    {formatUnboundedPower(a.value, false)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {highlights.slice(0, 2).map((h, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-400/25 text-purple-100 truncate max-w-full"
                >
                  <span className="opacity-70">{h.label}:</span> <strong>{h.value}</strong>
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {entry.summary}
          </p>
          {footerRow}
        </div>
      </article>
    );
  }

  /* ==========================================================================
     2. KINGDOM — Royal Charter Banner Card
     ========================================================================== */
  if (style === "kingdom") {
    return (
      <article
        onClick={() => onOpen(entry.id)}
        className={`group relative rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 border-2 ${
          selected ? "ring-2 ring-[var(--accent)]" : ""
        }`}
        style={{
          borderColor: `${accent}88`,
          background:
            "linear-gradient(180deg, rgba(34,26,12,0.95) 0%, rgba(12,18,34,0.98) 45%, rgba(10,16,30,0.98) 100%)",
          boxShadow: `0 12px 30px -14px ${accent}55`
        }}
      >
        {/* Royal Banner Header */}
        <div
          className="relative h-28 overflow-hidden border-b-2"
          style={{ borderColor: `${accent}66` }}
        >
          {entry.thumbImage ? (
            <img
              src={entry.thumbImage}
              alt={entry.title}
              loading="lazy"
              className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${accent}33, rgba(15,23,42,0.9))`
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1426] via-transparent to-black/40" />
          <div className="absolute top-2 left-2.5 right-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {selectBtn}
              <span className="px-2 py-0.5 rounded bg-black/70 border border-amber-400/50 text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                QUỐC GIA · VƯƠNG QUỐC
              </span>
            </div>
            {tier && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/60 text-[10px] font-mono font-bold text-amber-200">
                ⚡ {formatUnboundedPower(entry.powerLevel, entry.powerInfinite)}
              </span>
            )}
          </div>
        </div>

        {/* Floating Royal Crest Medallion */}
        <div className="relative px-4 pt-6 pb-3.5 flex-1 flex flex-col gap-2.5">
          <div
            className="absolute -top-6 left-4 w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl shadow-xl"
            style={{
              backgroundColor: "#0f172a",
              borderColor: accent,
              color: accent
            }}
          >
            {entry.sigil}
          </div>

          <div className="pl-14 -mt-4">
            <h3 className="font-display font-bold text-base sm:text-lg text-amber-100 leading-tight line-clamp-1">
              {entry.title}
            </h3>
            {entry.subtitle && (
              <p className="text-[11px] text-amber-200/70 italic line-clamp-1">{entry.subtitle}</p>
            )}
          </div>

          {/* 2-Column Kingdom Charter Stats */}
          {highlights.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {highlights.slice(0, 2).map((h, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-amber-400/20 bg-amber-500/8 px-2.5 py-1.5"
                >
                  <div className="text-[9px] font-mono uppercase text-amber-300/75 truncate">
                    {h.label}
                  </div>
                  <div className="text-xs font-semibold text-amber-50 truncate">{h.value}</div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {entry.summary}
          </p>
          {footerRow}
        </div>
      </article>
    );
  }

  /* ==========================================================================
     3. LANGUAGE — Runic Parchment Stone Tablet Card (ZERO Power Level!)
     ========================================================================== */
  if (style === "language") {
    return (
      <article
        onClick={() => onOpen(entry.id)}
        className={`group relative rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 border-2 ${
          selected ? "ring-2 ring-[var(--accent)]" : ""
        }`}
        style={{
          borderColor: "rgba(192,132,252,0.5)",
          background:
            "linear-gradient(155deg, rgba(30,19,48,0.96) 0%, rgba(16,13,28,0.98) 100%)"
        }}
      >
        {/* Giant Watermark Rune */}
        <div className="pointer-events-none select-none absolute -right-3 -top-3 text-[110px] leading-none font-serif text-purple-300/10 group-hover:text-purple-300/18 transition">
          {entry.sigil}
        </div>

        <div className="p-4 flex-1 flex flex-col gap-3 relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {selectBtn}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-purple-500/20 border border-purple-400/40 text-purple-200 font-semibold">
                {entry.sigil} NGÔN NGỮ & CỔ TỰ
              </span>
            </div>
            <span className="text-[10px] font-mono text-purple-300/80">Thuần Học Thuật</span>
          </div>

          <div className="border-l-2 border-purple-400/70 pl-3 py-0.5">
            <h3 className="font-display font-bold text-lg text-purple-50 leading-tight">
              {entry.title}
            </h3>
            {entry.subtitle && (
              <p className="text-[11px] italic text-purple-200/75 mt-0.5 line-clamp-1">
                {entry.subtitle}
              </p>
            )}
          </div>

          {highlights.length > 0 && (
            <div className="space-y-1.5">
              {highlights.slice(0, 3).map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg bg-purple-950/60 border border-purple-400/20 px-2.5 py-1 text-[11px]"
                >
                  <span className="text-purple-300/80 truncate">{h.label}</span>
                  <strong className="font-mono text-purple-100 shrink-0">{h.value}</strong>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {entry.summary}
          </p>
          {footerRow}
        </div>
      </article>
    );
  }

  /* ==========================================================================
     4. ARTIFACT — Relic Pedestal Showcase Card
     ========================================================================== */
  if (style === "artifact") {
    return (
      <article
        onClick={() => onOpen(entry.id)}
        className={`group relative rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 border-2 ${
          selected ? "ring-2 ring-[var(--accent)]" : ""
        }`}
        style={{
          borderColor: "rgba(251,113,133,0.55)",
          background:
            "radial-gradient(circle at 50% 18%, rgba(251,113,133,0.22), rgba(15,15,28,0.98) 62%)"
        }}
      >
        <div className="p-4 flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {selectBtn}
              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/45 text-[10px] font-mono uppercase text-rose-200 font-bold">
                ❖ CỔ VẬT & BẢO VẬT
              </span>
            </div>
            {tier && (
              <span className="px-2 py-0.5 rounded-md bg-black/60 border border-rose-400/50 text-[10px] font-mono font-bold text-rose-200">
                ⚡ {formatUnboundedPower(entry.powerLevel, entry.powerInfinite)}
              </span>
            )}
          </div>

          {/* Center Relic Pedestal */}
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-16 h-16 rounded-2xl rotate-45 border-2 border-rose-400/70 bg-rose-500/15 flex items-center justify-center shadow-[0_0_28px_rgba(251,113,133,0.35)] mb-3 group-hover:scale-105 transition">
              <span className="-rotate-45 text-3xl text-rose-200">{entry.sigil}</span>
            </div>
            <h3 className="font-display font-bold text-base sm:text-lg text-rose-50 leading-tight line-clamp-1">
              {entry.title}
            </h3>
            {entry.subtitle && (
              <p className="text-[11px] italic text-rose-200/75 line-clamp-1 mt-0.5">
                {entry.subtitle}
              </p>
            )}
          </div>

          {highlights.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {highlights.slice(0, 2).map((h, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-rose-950/50 border border-rose-400/20 px-2 py-1 text-center"
                >
                  <div className="text-[9px] text-rose-300/75 truncate">{h.label}</div>
                  <div className="text-[11px] font-semibold text-rose-100 truncate">{h.value}</div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 text-center">
            {entry.summary}
          </p>
          {footerRow}
        </div>
      </article>
    );
  }

  /* ==========================================================================
     5. CREATURE / FLORA-FAUNA — Bestiary Field Guide Card
     ========================================================================== */
  if (style === "creature") {
    return (
      <article
        onClick={() => onOpen(entry.id)}
        className={`group relative rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 border-2 ${
          selected ? "ring-2 ring-[var(--accent)]" : ""
        }`}
        style={{
          borderColor: "rgba(16,185,129,0.5)",
          background:
            "linear-gradient(160deg, rgba(8,36,28,0.96) 0%, rgba(9,18,22,0.98) 100%)"
        }}
      >
        <div className="p-4 flex-1 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {selectBtn}
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/45 text-[10px] font-mono uppercase text-emerald-200 font-bold">
                ᛇ SINH HỌC · BESTIARY
              </span>
            </div>
            {tier && (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-400/50 text-[10px] font-mono font-bold text-emerald-300">
                ⚡ {formatUnboundedPower(entry.powerLevel, entry.powerInfinite)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border border-emerald-400/50 bg-emerald-500/15 flex items-center justify-center text-2xl text-emerald-300 shrink-0">
              {entry.sigil}
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base sm:text-lg text-emerald-50 leading-tight truncate">
                {entry.title}
              </h3>
              {entry.subtitle && (
                <p className="text-[11px] italic text-emerald-300/80 truncate">{entry.subtitle}</p>
              )}
            </div>
          </div>

          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {highlights.slice(0, 3).map((h, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-400/25 text-emerald-100"
                >
                  <span className="opacity-70">{h.label}:</span> <strong>{h.value}</strong>
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {entry.summary}
          </p>
          {footerRow}
        </div>
      </article>
    );
  }

  /* ==========================================================================
     6. CITY / LANDMARK — Atlas Postcard (ZERO Power Level!)
     ========================================================================== */
  if (style === "city" || style === "landmark") {
    return (
      <article
        onClick={() => onOpen(entry.id)}
        className={`group relative rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 border-2 ${
          selected ? "ring-2 ring-[var(--accent)]" : ""
        }`}
        style={{
          borderColor: `${accent}66`,
          background:
            "linear-gradient(170deg, rgba(12,26,42,0.96) 0%, rgba(10,16,28,0.98) 100%)"
        }}
      >
        <div className="relative h-32 overflow-hidden">
          {entry.thumbImage ? (
            <img
              src={entry.thumbImage}
              alt={entry.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-5xl opacity-20"
              style={{ color: accent }}
            >
              {entry.sigil}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1322] via-transparent to-black/35" />
          <div className="absolute top-2 left-2.5 flex items-center gap-1.5">
            {selectBtn}
            <span
              className="px-2 py-0.5 rounded bg-black/70 border text-[10px] font-mono uppercase font-bold"
              style={{ borderColor: `${accent}77`, color: accent }}
            >
              {entry.sigil} {style === "city" ? "ĐÔ THỊ · THÀNH PHỐ" : "ĐỊA DANH · KỲ QUAN"}
            </span>
          </div>
          <div className="absolute bottom-2 left-3 right-3">
            <h3 className="font-display font-bold text-base sm:text-lg text-white truncate">
              {entry.title}
            </h3>
          </div>
        </div>

        <div className="p-3.5 flex-1 flex flex-col gap-2">
          {highlights.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {highlights.slice(0, 2).map((h, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-sky-950/50 border border-sky-400/20 px-2 py-1"
                >
                  <div className="text-[9px] text-sky-300/75 truncate">{h.label}</div>
                  <div className="text-[11px] font-semibold text-sky-50 truncate">{h.value}</div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{entry.summary}</p>
          {footerRow}
        </div>
      </article>
    );
  }

  /* ==========================================================================
     7. RELIGION, SYSTEM, EVENT, ORGANIZATION, HOUSE, LORE — Specialized Emblem Card
     ========================================================================== */
  const badgeTitleMap: Record<EntityCardStyle, string> = {
    character: "NHÂN VẬT",
    kingdom: "VƯƠNG QUỐC",
    language: "CỔ NGỮ",
    artifact: "CỔ VẬT",
    creature: "SINH VẬT",
    city: "ĐÔ THỊ",
    landmark: "ĐỊA DANH",
    religion: "TÔN GIÁO · TÍN NGƯỠNG",
    system: "QUY LUẬT · HỆ THỐNG",
    event: "BIÊN NIÊN · SỰ KIỆN",
    organization: "TỔ CHỨC · HỌC PHÁI",
    house: "GIA TỘC · DÒNG HỌ",
    lore: "VĂN HIẾN · HIỆP ƯỚC"
  };

  return (
    <article
      onClick={() => onOpen(entry.id)}
      className={`group relative rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 border-2 ${
        selected ? "ring-2 ring-[var(--accent)]" : ""
      }`}
      style={{
        borderColor: `${accent}55`,
        background: `linear-gradient(160deg, ${accent}14 0%, rgba(14,20,38,0.97) 48%, rgba(10,14,28,0.99) 100%)`
      }}
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
      <div className="p-4 flex-1 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {selectBtn}
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold border"
              style={{
                backgroundColor: `${accent}1A`,
                borderColor: `${accent}55`,
                color: accent
              }}
            >
              {entry.sigil} {badgeTitleMap[style]}
            </span>
          </div>
          {tier && (
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border"
              style={{
                backgroundColor: `${tier.color}18`,
                borderColor: `${tier.color}66`,
                color: tier.color
              }}
            >
              <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
              {formatUnboundedPower(entry.powerLevel, entry.powerInfinite)}
            </span>
          )}
        </div>

        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)] leading-snug line-clamp-1">
            {entry.title}
          </h3>
          {entry.subtitle && (
            <p className="text-[11px] italic text-[var(--text-muted)] line-clamp-1 mt-0.5">
              {entry.subtitle}
            </p>
          )}
        </div>

        {highlights.length > 0 && (
          <div className="space-y-1">
            {highlights.slice(0, 2).map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 text-[11px] rounded-lg bg-white/5 border border-white/8 px-2.5 py-1"
              >
                <span className="text-[var(--text-muted)] truncate">{h.label}</span>
                <strong className="text-[var(--text-primary)] truncate">{h.value}</strong>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
          {entry.summary}
        </p>
        {footerRow}
      </div>
    </article>
  );
}
