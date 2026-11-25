"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Crown,
  FolderTree,
  Globe2,
  Hourglass,
  Layers,
  MapPin,
  Search,
  Sparkles,
  Users,
  X
} from "lucide-react";
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
  entries: Array<{
    id: string;
    title: string;
    subtitle: string;
    sigil: string;
    workspaceId?: string;
    workspaceName?: string;
    relevance?: number;
  }>;
  categories: Array<{
    id: string;
    name: string;
    sigil: string;
    color: string;
    workspaceName?: string;
  }>;
  timelineEvents: Array<{
    id: string;
    title: string;
    dateLabel: string;
    sigil: string;
    workspaceName?: string;
  }>;
  atlasPins: Array<{
    id: string;
    label: string;
    entryId: string | null;
    sigil: string;
    workspaceName?: string;
  }>;
  characters?: Array<{
    id: string;
    fullName: string;
    race: string;
    symbol: string;
    titles: string[];
    workspaceName?: string;
    relevance?: number;
  }>;
  kingdoms?: Array<{
    id: string;
    officialName: string;
    continent: string;
    governmentType: string;
    capitalName: string;
    workspaceName?: string;
    relevance?: number;
  }>;
  suggestions?: string[];
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
  const [scope, setScope] = useState<"all" | "kingdoms" | "characters" | "entries" | "world">("all");
  const [crossWorkspace, setCrossWorkspace] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResults>({
    entries: [],
    categories: [],
    timelineEvents: [],
    atlasPins: [],
    suggestions: []
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("aethel_search_history_v1");
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, [open]);

  function recordSearch(qText: string) {
    const clean = qText.trim();
    if (clean.length < 2) return;
    setHistory((prev) => {
      const next = [clean, ...prev.filter((x) => x !== clean)].slice(0, 6);
      try {
        window.localStorage.setItem("aethel_search_history_v1", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

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
      const params = new URLSearchParams({
        workspaceId,
        q: query,
        crossWorkspace: String(crossWorkspace)
      });
      fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => setResults(data))
        .catch(() => {});
    }, 120);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query, workspaceId, crossWorkspace]);

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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm pt-12 sm:pt-16 px-3 sm:px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl overflow-hidden animate-v9-page-enter"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)]">
          <Search className="w-5 h-5 text-[var(--accent)] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") recordSearch(query);
            }}
            placeholder="Omni-Search V9.0 (Ctrl+K) — xếp hạng độ khớp, tiếng Việt không dấu, alias, ID..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[var(--text-muted)] cursor-pointer"
            >
              Xóa
            </button>
          )}
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/10 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Entity Scope Filter Bar + Cross-Workspace Switch + Suggestions */}
        <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[#101522]/60 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["all", "Tất cả"],
                  ["kingdoms", "Quốc gia (360)"],
                  ["characters", "Nhân vật"],
                  ["entries", "Hồ sơ Bách khoa"],
                  ["world", "Bản đồ & Sự kiện"]
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setScope(id)}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer transition ${
                    scope === id
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                      : "border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCrossWorkspace((v) => !v)}
              title="Tìm kiếm xuyên qua mọi Không gian thế giới được phép truy cập"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border cursor-pointer transition ${
                crossWorkspace
                  ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-300 font-semibold"
                  : "border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Layers className="w-3 h-3" />
              Xuyên Không gian
            </button>
          </div>

          {results.suggestions && results.suggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-[var(--text-muted)] inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[var(--accent)]" /> Gợi ý nhanh:
              </span>
              {results.suggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setQuery(sug)}
                  className="px-2 py-0.5 rounded-md border border-[var(--border-subtle)] bg-white/5 hover:border-[var(--accent)] text-[var(--text-secondary)] cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {history.length > 0 && !query.trim() && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-[var(--text-muted)]">Tìm gần đây:</span>
              {history.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setQuery(h)}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] cursor-pointer"
                >
                  {h}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setHistory([]);
                  try {
                    window.localStorage.removeItem("aethel_search_history_v1");
                  } catch {}
                }}
                className="text-[10px] text-rose-300 hover:underline ml-auto cursor-pointer"
              >
                Xóa lịch sử
              </button>
            </div>
          )}
        </div>

        <div className="max-h-[62vh] overflow-y-auto p-3 space-y-4 codex-scrollbar">
          {/* Character Codex Results */}
          {(scope === "all" || scope === "characters") &&
            results.characters &&
            results.characters.length > 0 && (
              <div>
                <div className="text-[11px] font-mono uppercase text-cyan-300 px-2 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Character Codex ({results.characters.length})
                </div>
                {results.characters.map((ch) => (
                  <button
                    key={`${ch.workspaceName || ""}-${ch.id}`}
                    type="button"
                    onClick={() => {
                      recordSearch(query || ch.fullName);
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
                    {crossWorkspace && ch.workspaceName && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 shrink-0">
                        {ch.workspaceName}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

          {/* Kingdom Codex Results */}
          {(scope === "all" || scope === "kingdoms") &&
            results.kingdoms &&
            results.kingdoms.length > 0 && (
              <div>
                <div className="text-[11px] font-mono uppercase text-amber-300 px-2 mb-1 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  Kingdom Codex ({results.kingdoms.length})
                </div>
                {results.kingdoms.map((k) => (
                  <button
                    key={`${k.workspaceName || ""}-${k.id}`}
                    type="button"
                    onClick={() => {
                      recordSearch(query || k.officialName);
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
                    {crossWorkspace && k.workspaceName && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 shrink-0">
                        {k.workspaceName}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

          {/* 360 Planetary Nations */}
          {(scope === "all" || scope === "kingdoms" || scope === "world") &&
            matchedNations.length > 0 &&
            onSelectPlanetaryNation && (
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
                      recordSearch(query || n.name);
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
          {(scope === "all" || scope === "entries") && (
            <div>
              <div className="text-[11px] font-mono uppercase text-[var(--text-muted)] px-2 mb-1">
                Hồ sơ Codex ({results.entries.length})
              </div>
              {results.entries.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] px-2">Không có hồ sơ phù hợp.</p>
              ) : (
                results.entries.map((e) => (
                  <button
                    key={`${e.workspaceId || ""}-${e.id}`}
                    type="button"
                    onClick={() => {
                      recordSearch(query || e.title);
                      onSelectEntry(e.id);
                      onClose();
                    }}
                    className="w-full text-left flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--accent-soft)] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
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
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {crossWorkspace && e.workspaceName && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[var(--text-secondary)]">
                          {e.workspaceName}
                        </span>
                      )}
                      {query.trim() && typeof e.relevance === "number" && e.relevance >= 80 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                          Khớp cao
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Categories */}
          {(scope === "all" || scope === "entries") && results.categories.length > 0 && (
            <div>
              <div className="text-[11px] font-mono uppercase text-[var(--text-muted)] px-2 mb-1 flex items-center gap-1">
                <FolderTree className="w-3 h-3" /> Danh mục
              </div>
              <div className="flex flex-wrap gap-1.5 px-2">
                {results.categories.map((c) => (
                  <button
                    key={`${c.workspaceName || ""}-${c.id}`}
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
          {(scope === "all" || scope === "world") &&
            (results.timelineEvents.length > 0 || results.atlasPins.length > 0) && (
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
