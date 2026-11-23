"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Crown, GitBranch, Heart, Search, Users } from "lucide-react";
import type { CharacterListProjection } from "@/types/character-codex";
import type { UniversalRelationRecord } from "@/db/universal-relations-repo";
import { matchesVietnameseQuery } from "@/lib/vietnamese";

interface GenealogyExplorerViewProps {
  workspaceId: string;
}

const FAMILY_CODES = new Set(["parent_of", "child_of", "married_to", "heir_of", "founder_of"]);

export function GenealogyExplorerView({ workspaceId }: GenealogyExplorerViewProps) {
  const [characters, setCharacters] = useState<CharacterListProjection[]>([]);
  const [relations, setRelations] = useState<UniversalRelationRecord[]>([]);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selectedChar, setSelectedChar] = useState<CharacterListProjection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      fetch(`/api/characters?workspaceId=${encodeURIComponent(workspaceId)}&limit=100`).then((r) => r.json()),
      fetch(`/api/universal-relations?workspaceId=${encodeURIComponent(workspaceId)}`).then((r) => r.json())
    ])
      .then(([cData, rData]) => {
        if (!alive) return;
        setCharacters(cData.items || []);
        setRelations(
          (rData.relations || []).filter((rel: UniversalRelationRecord) =>
            FAMILY_CODES.has(rel.relationTypeCode)
          )
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [workspaceId]);

  // Group characters by Nationality / Dynasty / House for structured tree exploration
  const groups = useMemo(() => {
    const filtered = characters.filter((c) => {
      if (!search.trim()) return true;
      const hay = `${c.id} ${c.fullName} ${c.race} ${c.nationality} ${c.titles.join(" ")} ${c.organizationNames.join(" ")}`;
      return matchesVietnameseQuery(hay, search);
    });
    const map = new Map<string, CharacterListProjection[]>();
    for (const ch of filtered) {
      const key = ch.organizationNames[0] || ch.nationality || "Các Dòng tộc & Nhân vật Độc lập";
      const arr = map.get(key) || [];
      arr.push(ch);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [characters, search]);

  function toggleBranch(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-4 text-xs">
      <div className="codex-card rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-[var(--accent)] flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> Dynasty &amp; Genealogy — Cây Gia phả &amp; Kế vị Triều đại
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Dựng trực tiếp từ quan hệ dữ liệu có cấu trúc (CHAR-ID): phân biệt rõ đường Huyết thống, Hôn nhân và Người kế vị.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1 text-cyan-300">
              <span className="w-4 h-0.5 bg-cyan-400 inline-block" /> Huyết thống
            </span>
            <span className="inline-flex items-center gap-1 text-rose-300">
              <span className="w-4 border-t-2 border-dashed border-rose-400 inline-block" /> Hôn nhân
            </span>
            <span className="inline-flex items-center gap-1 text-amber-300">
              <Crown className="w-3.5 h-3.5" /> Kế vị
            </span>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm thành viên hoàng tộc, gia tộc, danh hiệu hoặc CHAR-ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] text-xs outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="codex-card rounded-2xl p-8 text-center text-[var(--text-muted)]">
          Đang dựng sơ đồ gia phả và triều đại...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8 space-y-3">
            {groups.map(([groupName, members]) => {
              const isCollapsed = collapsed.has(groupName);
              return (
                <div key={groupName} className="codex-card rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleBranch(groupName)}
                    className="w-full px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-2 cursor-pointer hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--accent)]">
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <Crown className="w-4 h-4" />
                      <span>{groupName}</span>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
                      {members.length} thành viên
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="p-4 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {members.map((m) => {
                          const charRels = relations.filter(
                            (r) => r.sourceId === m.id || r.targetId === m.id
                          );
                          const isSelected = selectedChar?.id === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setSelectedChar(m)}
                              className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                                isSelected
                                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                  : "border-[var(--border-subtle)] bg-[var(--bg-base)]/60 hover:border-[var(--accent)]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-[var(--text-primary)] truncate">
                                  {m.symbol || "✦"} {m.fullName}
                                </span>
                                <span className="font-mono text-[10px] text-[var(--accent)] shrink-0">
                                  {m.id}
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                                {m.titles[0] || m.race} · {m.nationality || "Chưa rõ quốc gia"}
                              </div>
                              {charRels.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {charRels.map((r) => (
                                    <span
                                      key={r.id}
                                      className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                                        r.relationTypeCode === "married_to"
                                          ? "border-rose-400/50 bg-rose-500/10 text-rose-200 border-dashed"
                                          : r.relationTypeCode === "heir_of"
                                          ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
                                          : "border-cyan-400/50 bg-cyan-500/10 text-cyan-200"
                                      }`}
                                    >
                                      {r.relationTypeCode === "married_to" && <Heart className="w-2.5 h-2.5" />}
                                      {r.relationLabel}: {r.sourceId === m.id ? r.targetTitle : r.sourceTitle}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Inspection Card */}
          <div className="lg:col-span-4 codex-card rounded-2xl p-4 space-y-3 sticky top-20">
            <div className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Hồ sơ Thành viên Gia phả
            </div>
            {selectedChar ? (
              <div className="space-y-2.5">
                <div>
                  <div className="font-mono text-[11px] text-[var(--accent)]">{selectedChar.id}</div>
                  <div className="font-display text-lg font-bold text-[var(--text-primary)]">
                    {selectedChar.fullName}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {selectedChar.titles.join(" · ") || selectedChar.race}
                  </div>
                </div>
                <div className="rounded-xl bg-[var(--bg-base)]/70 border border-[var(--border-subtle)] p-2.5 space-y-1 text-[11px]">
                  <div>Chủng tộc: <strong>{selectedChar.race}</strong></div>
                  <div>Quốc gia: <strong>{selectedChar.nationality || "—"}</strong></div>
                  <div>Trạng thái: <strong>{selectedChar.lifeStatus}</strong></div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-cyan-300">Quan hệ Huyết thống &amp; Kế vị:</div>
                  {relations.filter((r) => r.sourceId === selectedChar.id || r.targetId === selectedChar.id).length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Chưa ghi nhận quan hệ gia phả trực tiếp. Bạn có thể thêm tại Relationship Manager (loại Cha mẹ / Con cái / Hôn nhân / Người kế vị).
                    </p>
                  ) : (
                    relations
                      .filter((r) => r.sourceId === selectedChar.id || r.targetId === selectedChar.id)
                      .map((r) => (
                        <div key={r.id} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px]">
                          <strong>{r.relationLabel}</strong>:{" "}
                          {r.sourceId === selectedChar.id ? r.targetTitle : r.sourceTitle}
                        </div>
                      ))
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[var(--text-muted)]">
                Chọn bất kỳ thành viên nào trong cây gia phả bên trái để xem thông tin chi tiết, quan hệ huyết thống, hôn nhân và kế vị.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
