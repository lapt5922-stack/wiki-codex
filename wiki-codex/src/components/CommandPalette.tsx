"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Crown, FolderTree, Globe2, Hourglass, MapPin, Search, Users, X } from "lucide-react";
import { buildPlanetaryAtlasBundle } from "@/lib/planetary-atlas/generator";
import { matchesVietnameseQuery } from "@/lib/vietnamese";

interface CommandPaletteProps {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
  onSelectEntry: (id: string) => void;
  onSelectCategory: (id: string) => void;
  onOpenTab: (tab: "timeline" | "atlas" | "characters" | "kingdoms") => void;
  onSelectPlanetaryNation?: (nationId: string) => void;
}

interface SearchResults {
  entries: Array<{ id: string; title: string; subtitle: string; sigil: string }>;
  categories: Array<{ id: string; name: string; sigil: string; color: string }>;
  timelineEvents: Array<{ id: string; title: string; dateLabel: string; sigil: string }>;
  atlasPins: Array<{ id: string; label: string; entryId: string | null; sigil: string }>;
  characters?: Array<{ id: string; fullName: string; race: string; symbol: string; titles: string[] }>;
  kingdoms?: Array<{ id: string; officialName: string; continent: string; governmentType: string; capitalName: string }>;
}

export function CommandPalette({
  workspaceId,
  open,
  onClose,
  onSelectEntry,
  onSelectCategory,
  onOpenTab,
  onSelectPlanetaryNation
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    entries: [],
    categories: [],
    timelineEvents: [],
    atlasPins: []
  });

  const matchedNations = useMemo(() => {
    if (!open) return [];
    const nations = buildPlanetaryAtlasBundle().nations;
    const q = query.trim();
    if (!q) return nations.slice(0, 5);
    return nations
      .filter((n) =>
        matchesVietnameseQuery(
          `#${n.nationNum} ${n.name} ${n.shortName} ${n.capital} ${n.bloc} ${n.regionName}`,
          q
        )
      )
      .slice(0, 6);
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(
        `/api/search?workspaceId=${workspaceId}&q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      )
        .then((r) => r.json())
        .then((data) => setResults(data))
        .catch(() => {});
    }, 120);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query, workspaceId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm pt-16 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)]">
          <Search className="w-5 h-5 text-[var(--accent)]" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nhanh toàn cục (Ctrl+K) — hỗ trợ tiếng Việt không dấu..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-3 space-y-4 codex-scrollbar">
          {/* Character Codex Results */}
          {results.characters && results.characters.length > 0 && (
            <div>
              <div className="text-[11px] font-mono uppercase text-cyan-300 px-2 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Character Codex ({results.characters.length})
              </div>
              {results.characters.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    onOpenTab("characters");
                    onClose();
                  }}
                  className="w-full text-left flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl hover:bg-cyan-500/15 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">{ch.symbol}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {ch.fullName}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] truncate">
                        {ch.id} · {ch.race} {ch.titles[0] ? `· ${ch.titles[0]}` : ""}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Kingdom Codex Results */}
          {results.kingdoms && results.kingdoms.length > 0 && (
            <div>
              <div className="text-[11px] font-mono uppercase text-amber-300 px-2 mb-1 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                Kingdom Codex ({results.kingdoms.length})
              </div>
              {results.kingdoms.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => {
                    onOpenTab("kingdoms");
                    onClose();
                  }}
                  className="w-full text-left flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-500/15 transition cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {k.officialName}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate">
                      {k.id} · Thủ đô {k.capitalName} · {k.continent} · {k.governmentType}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 360 Planetary Nations */}
          {matchedNations.length > 0 && onSelectPlanetaryNation && (
            <div>
              <div className="text-[11px] font-mono uppercase text-cyan-400 px-2 mb-1 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5" />
                Đại Hành Tinh 360 Quốc gia ({matchedNations.length})
              </div>
              {matchedNations.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    onSelectPlanetaryNation(n.id);
                    onClose();
                  }}
                  className="w-full text-left flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl hover:bg-cyan-500/15 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 border border-white/40"
                      style={{ backgroundColor: n.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                        #{n.nationNum} {n.name}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] truncate">
                        Thủ đô {n.capital} • {n.bloc} • {n.regionCode}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 shrink-0">Bay tới →</span>
                </button>
              ))}
            </div>
          )}

          {/* Entries */}
          <div>
            <div className="text-[11px] font-mono uppercase text-[var(--text-muted)] px-2 mb-1">
              Hồ sơ Codex ({results.entries.length})
            </div>
            {results.entries.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] px-2">Không có hồ sơ phù hợp.</p>
            ) : (
              results.entries.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    onSelectEntry(e.id);
                    onClose();
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--accent-soft)] transition cursor-pointer"
                >
                  <span className="text-[var(--accent)]">{e.sigil}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {e.title}
                    </div>
                    {e.subtitle && (
                      <div className="text-xs text-[var(--text-muted)] truncate">
                        {e.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Categories */}
          {results.categories.length > 0 && (
            <div>
              <div className="text-[11px] font-mono uppercase text-[var(--text-muted)] px-2 mb-1 flex items-center gap-1">
                <FolderTree className="w-3 h-3" /> Danh mục
              </div>
              <div className="flex flex-wrap gap-1.5 px-2">
                {results.categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(c.id);
                      onClose();
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent)] cursor-pointer"
                  >
                    <span style={{ color: c.color }} className="mr-1">
                      {c.sigil}
                    </span>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Timeline & Atlas */}
          {(results.timelineEvents.length > 0 || results.atlasPins.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-2">
              {results.timelineEvents.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase text-[var(--text-muted)] mb-1 flex items-center gap-1">
                    <Hourglass className="w-3 h-3" /> Biên niên sử
                  </div>
                  {results.timelineEvents.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onOpenTab("timeline");
                        onClose();
                      }}
                      className="w-full text-left text-xs py-1 hover:text-[var(--accent)] truncate cursor-pointer"
                    >
                      {t.sigil} {t.dateLabel} — {t.title}
                    </button>
                  ))}
                </div>
              )}
              {results.atlasPins.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase text-[var(--text-muted)] mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Ghim Bản đồ Atlas
                  </div>
                  {results.atlasPins.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (p.entryId) onSelectEntry(p.entryId);
                        else onOpenTab("atlas");
                        onClose();
                      }}
                      className="w-full text-left text-xs py-1 hover:text-[var(--accent)] truncate cursor-pointer"
                    >
                      {p.sigil} {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
