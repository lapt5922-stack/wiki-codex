"use client";

import React, { useState } from "react";
import { BookMarked, Eye, EyeOff, Languages, Sparkles } from "lucide-react";
import type { ConlangLanguage, GlossaryTerm } from "@/types/codex";
import { translateVietnameseToConlang } from "@/lib/conlang";
import { normalizeVietnamese } from "@/lib/vietnamese";

export interface LinkLookupItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  sigil: string;
  thumbImage: string;
}

interface MarkdownCodexRendererProps {
  markdown: string;
  linkLookup: LinkLookupItem[];
  glossaryTerms?: GlossaryTerm[];
  conlang?: ConlangLanguage;
  conlangDisplayMode?: "vi" | "romanized" | "runic" | "bilingual";
  onOpenEntry?: (id: string) => void;
  onCreateRedLink?: (missingTitle: string) => void;
}

function InlineSpoiler({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setRevealed((v) => !v)}
      title={revealed ? "Nhấn để ẩn lại" : "Nhấn để lật mở Spoiler"}
      className={`inline rounded px-1.5 py-0.5 text-xs transition cursor-pointer ${
        revealed
          ? "bg-purple-500/20 text-purple-100 border border-purple-400/40"
          : "bg-slate-800 text-transparent select-none border border-purple-400/30 hover:border-purple-400/70"
      }`}
    >
      {text}
    </button>
  );
}

function SpoilerCard({ label, content }: { label: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-4 rounded-xl border border-purple-400/35 bg-purple-500/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-purple-200 hover:bg-purple-500/10 cursor-pointer"
      >
        <span className="flex items-center gap-2">
          {open ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{label}</span>
        </span>
        <span>{open ? "Ẩn bớt" : "Nhấn để hiển thị"}</span>
      </button>
      {open && (
        <div className="px-4 pb-3.5 pt-1 text-sm text-[var(--text-secondary)] border-t border-purple-400/20 whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
}

function CalloutBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="my-4 rounded-xl border border-sky-400/35 bg-sky-500/10 p-4 space-y-1">
      <div className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
        <BookMarked className="w-3.5 h-3.5" />
        <span>{title}</span>
      </div>
      <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

function ConlangInscriptionBlock({
  vietnamese,
  conlang
}: {
  vietnamese: string;
  conlang?: ConlangLanguage;
}) {
  const [showVi, setShowVi] = useState(false);
  const translated = translateVietnameseToConlang(vietnamese, conlang);

  return (
    <div className="my-4 rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] p-4 relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Văn bia {conlang?.name || "Cổ ngữ Aethel'va"} ({conlang?.nativeName || "Aethel'va"})
        </span>
        <button
          type="button"
          onClick={() => setShowVi((v) => !v)}
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-[var(--border-strong)] text-[var(--accent)] hover:bg-white/10 cursor-pointer"
        >
          <Languages className="w-3 h-3" />
          {showVi ? "Ẩn bản dịch Việt" : "Xem bản dịch Việt"}
        </button>
      </div>
      <div className="font-mono text-base tracking-widest text-[var(--accent)] leading-relaxed break-words">
        {translated.runic}
      </div>
      <div className="font-display italic text-sm text-[var(--text-primary)] mt-1">
        “{translated.romanized}”
      </div>
      {showVi && (
        <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
          <strong>Bản dịch Tiếng Việt:</strong> {vietnamese}
        </div>
      )}
    </div>
  );
}

export function MarkdownCodexRenderer({
  markdown,
  linkLookup,
  glossaryTerms = [],
  conlang,
  conlangDisplayMode = "vi",
  onOpenEntry,
  onCreateRedLink
}: MarkdownCodexRendererProps) {
  const [hoveredLink, setHoveredLink] = useState<LinkLookupItem | null>(null);
  const [activeGlossary, setActiveGlossary] = useState<GlossaryTerm | null>(null);

  const lookupMap = new Map<string, LinkLookupItem>();
  for (const item of linkLookup) {
    lookupMap.set(normalizeVietnamese(item.title), item);
    lookupMap.set(item.slug.toLowerCase(), item);
  }

  if (conlangDisplayMode !== "vi") {
    const result = translateVietnameseToConlang(markdown, conlang);
    return (
      <div className="space-y-3 leading-relaxed">
        {result.bilingualLines.map((line, idx) => {
          if (!line.vi.trim()) return <div key={idx} className="h-2" />;
          return (
            <div
              key={idx}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 px-3.5 py-2.5"
            >
              {(conlangDisplayMode === "runic" || conlangDisplayMode === "bilingual") && (
                <div className="font-mono text-sm tracking-wider text-[var(--accent)] break-words">
                  {line.runic}
                </div>
              )}
              {(conlangDisplayMode === "romanized" ||
                conlangDisplayMode === "bilingual") && (
                <div className="font-display text-base text-[var(--text-primary)] mt-0.5">
                  {line.romanized}
                </div>
              )}
              {conlangDisplayMode === "bilingual" && (
                <div className="text-xs text-[var(--text-muted)] mt-1 border-t border-[var(--border-subtle)] pt-1">
                  {line.vi}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderPlainWithGlossary(text: string, keyPrefix: string): React.ReactNode {
    if (glossaryTerms.length === 0 || !text) return text;
    const escapedTerms = glossaryTerms
      .filter((g) => g.term.trim().length >= 3)
      .map((g) => g.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (escapedTerms.length === 0) return text;

    const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");
    const chunks = text.split(regex);
    if (chunks.length === 1) return text;

    return chunks.map((chunk, i) => {
      const hit = glossaryTerms.find(
        (g) => g.term.toLowerCase() === chunk.toLowerCase()
      );
      if (!hit) return <React.Fragment key={`${keyPrefix}-${i}`}>{chunk}</React.Fragment>;
      return (
        <span
          key={`${keyPrefix}-${i}`}
          className="relative inline-block"
          onMouseEnter={() => setActiveGlossary(hit)}
          onMouseLeave={() => setActiveGlossary(null)}
        >
          <button
            type="button"
            onClick={() => setActiveGlossary(activeGlossary?.id === hit.id ? null : hit)}
            className="underline decoration-dotted decoration-sky-400 underline-offset-4 text-[var(--text-primary)] hover:text-sky-300 cursor-help"
          >
            {chunk}
          </button>
          {activeGlossary?.id === hit.id && (
            <span className="absolute left-0 bottom-full mb-2 z-40 w-64 rounded-xl border border-sky-400/50 bg-[var(--bg-elevated)] p-2.5 shadow-2xl text-left text-xs">
              <span className="block font-semibold text-sky-300 mb-0.5">
                {hit.sigil} {hit.term} · {hit.category}
              </span>
              <span className="block text-[var(--text-secondary)] leading-relaxed">
                {hit.shortDef}
              </span>
            </span>
          )}
        </span>
      );
    });
  }

  function renderInline(text: string): React.ReactNode[] {
    const tokenRegex = /(\[\[[^\]]+\]\]|\|\|[^|]+\|\||\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, idx) => {
      if (part.startsWith("||") && part.endsWith("||") && part.length > 4) {
        return <InlineSpoiler key={idx} text={part.slice(2, -2)} />;
      }
      if (part.startsWith("[[") && part.endsWith("]]")) {
        const inner = part.slice(2, -2);
        const [rawTarget, rawAlias] = inner.split("|");
        const target = rawTarget.trim();
        const label = (rawAlias || rawTarget).trim();
        const found =
          lookupMap.get(normalizeVietnamese(target)) ??
          lookupMap.get(target.toLowerCase());

        if (found) {
          return (
            <span
              key={idx}
              className="relative inline-block"
              onMouseEnter={() => setHoveredLink(found)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <button
                type="button"
                onClick={() => onOpenEntry?.(found.id)}
                className="inline-flex items-center gap-0.5 text-[var(--accent)] underline decoration-[var(--accent)]/50 underline-offset-4 hover:decoration-[var(--accent)] font-medium cursor-pointer"
              >
                <span className="text-xs opacity-80">{found.sigil}</span>
                <span>{label}</span>
              </button>

              {hoveredLink?.id === found.id && (
                <span className="hidden md:block absolute left-0 bottom-full mb-2 z-40 w-72 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-3 shadow-2xl text-left pointer-events-none">
                  <span className="flex items-center gap-2 mb-1">
                    <span className="text-[var(--accent)]">{found.sigil}</span>
                    <span className="font-display font-semibold text-sm text-[var(--text-primary)] truncate">
                      {found.title}
                    </span>
                  </span>
                  {found.subtitle && (
                    <span className="block text-[11px] italic text-[var(--text-muted)] mb-1">
                      {found.subtitle}
                    </span>
                  )}
                  <span className="block text-xs text-[var(--text-secondary)] line-clamp-3">
                    {found.summary || "Nhấn để mở hồ sơ chi tiết."}
                  </span>
                </span>
              )}
            </span>
          );
        }

        return (
          <button
            key={idx}
            type="button"
            title={`Hồ sơ "${target}" chưa tồn tại — nhấn để tạo mới`}
            onClick={() => onCreateRedLink?.(target)}
            className="text-rose-400 underline decoration-dashed decoration-rose-400/70 underline-offset-4 hover:text-rose-300 cursor-pointer"
          >
            {label}
          </button>
        );
      }

      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold text-[var(--text-primary)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={idx} className="italic text-[var(--text-secondary)]">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="font-mono text-[0.88em] px-1.5 py-0.5 rounded bg-white/10 text-[var(--accent)]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return (
        <React.Fragment key={idx}>
          {renderPlainWithGlossary(part, `p-${idx}`)}
        </React.Fragment>
      );
    });
  }

  const blockRegex =
    /(:::spoiler[^\n]*\r?\n[\s\S]*?:::|:::conlang\r?\n[\s\S]*?:::|:::callout[^\n]*\r?\n[\s\S]*?:::)/g;
  const segments = markdown.split(blockRegex);

  return (
    <div className="space-y-3 text-[var(--text-secondary)] leading-relaxed">
      {segments.map((seg, sIdx) => {
        if (seg.startsWith(":::spoiler")) {
          const m = /^:::spoiler(?:\s+([^\n]+))?\r?\n([\s\S]*?):::$/.exec(seg.trim());
          if (m) {
            return (
              <SpoilerCard
                key={sIdx}
                label={(m[1] || "Nội dung tiết lộ / bản nháp").trim()}
                content={m[2].trim()}
              />
            );
          }
        }
        if (seg.startsWith(":::callout")) {
          const m = /^:::callout(?:\s+([^\n]+))?\r?\n([\s\S]*?):::$/.exec(seg.trim());
          if (m) {
            return (
              <CalloutBlock
                key={sIdx}
                title={(m[1] || "Ghi chú Học thuật").trim()}
                content={m[2].trim()}
              />
            );
          }
        }
        if (seg.startsWith(":::conlang")) {
          const m = /^:::conlang\r?\n([\s\S]*?):::$/.exec(seg.trim());
          if (m) {
            return (
              <ConlangInscriptionBlock
                key={sIdx}
                vietnamese={m[1].trim()}
                conlang={conlang}
              />
            );
          }
        }

        const lines = seg.split(/\r?\n/);
        return (
          <div key={sIdx} className="space-y-2.5">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
              if (headingMatch) {
                const level = headingMatch[1].length;
                const rawHeading = headingMatch[2];
                const id =
                  "sec-" +
                  normalizeVietnamese(rawHeading)
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-");
                if (level === 1) {
                  return (
                    <h1
                      key={lIdx}
                      id={id}
                      className="font-display text-2xl font-bold text-[var(--accent)] pt-3"
                    >
                      {renderInline(rawHeading)}
                    </h1>
                  );
                }
                if (level === 2) {
                  return (
                    <h2
                      key={lIdx}
                      id={id}
                      className="font-display text-xl font-semibold text-[var(--text-primary)] pt-3 border-b border-[var(--border-subtle)] pb-1.5 flex items-center gap-2"
                    >
                      <span className="text-sm text-[var(--accent)]">✦</span>
                      <span>{renderInline(rawHeading)}</span>
                    </h2>
                  );
                }
                return (
                  <h3
                    key={lIdx}
                    id={id}
                    className="font-display text-base font-semibold text-[var(--accent)] pt-2"
                  >
                    {renderInline(rawHeading)}
                  </h3>
                );
              }

              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                  <div key={lIdx} className="flex gap-2 pl-2">
                    <span className="text-[var(--accent)] mt-0.5">✧</span>
                    <div className="flex-1">{renderInline(trimmed.slice(2))}</div>
                  </div>
                );
              }

              if (/^\d+\.\s+/.test(trimmed)) {
                const num = trimmed.match(/^(\d+\.)\s+(.*)$/);
                if (num) {
                  return (
                    <div key={lIdx} className="flex gap-2 pl-2">
                      <span className="font-mono text-xs text-[var(--accent)] mt-1">
                        {num[1]}
                      </span>
                      <div className="flex-1">{renderInline(num[2])}</div>
                    </div>
                  );
                }
              }

              if (trimmed.startsWith("> ")) {
                const body = trimmed.slice(2);
                const calloutMatch = body.match(/^\[!(LORE|SECRET|TIMELINE|WARNING)\]\s*(.*)$/i);
                if (calloutMatch) {
                  const kind = calloutMatch[1].toUpperCase();
                  const colorMap: Record<string, string> = {
                    LORE: "border-amber-400/40 bg-amber-500/10 text-amber-200",
                    SECRET: "border-purple-400/40 bg-purple-500/10 text-purple-200",
                    TIMELINE: "border-sky-400/40 bg-sky-500/10 text-sky-200",
                    WARNING: "border-rose-400/40 bg-rose-500/10 text-rose-200"
                  };
                  return (
                    <div
                      key={lIdx}
                      className={`my-2 rounded-xl border px-3.5 py-2.5 text-sm ${colorMap[kind] || colorMap.LORE}`}
                    >
                      <span className="font-mono text-[10px] uppercase tracking-wider font-semibold mr-2">
                        [{kind}]
                      </span>
                      <span className="text-[var(--text-primary)]">{renderInline(calloutMatch[2])}</span>
                    </div>
                  );
                }
                return (
                  <blockquote
                    key={lIdx}
                    className="border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2 rounded-r-lg italic text-sm"
                  >
                    {renderInline(trimmed.slice(2))}
                  </blockquote>
                );
              }

              return (
                <p key={lIdx} className="text-[15px] leading-7">
                  {renderInline(trimmed)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
