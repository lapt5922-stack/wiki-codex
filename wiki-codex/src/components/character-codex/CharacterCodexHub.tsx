"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
  List,
  Network,
  Pin,
  Plus,
  Scale,
  Search,
  Settings2,
  Sparkles,
  Table2,
  Trash2,
  Upload,
  Users,
  X
} from "lucide-react";
import type {
  CharacterAuditIssue,
  CharacterCustomFieldDataType,
  CharacterCustomFieldDef,
  CharacterHydratedDossier,
  CharacterListProjection,
  CharacterRelationshipRecord
} from "@/types/character-codex";
import { RELATION_LABELS_VI } from "@/lib/character-id";
import { useDeviceUI } from "@/lib/device-ui";
import { CharacterDetailView } from "./CharacterDetailView";
import { CharacterEditorModal } from "./CharacterEditorModal";

interface CharacterCodexHubProps {
  workspaceId: string;
  canEdit: boolean;
  onOpenNationEntry?: (entryId: string) => void;
}

export function CharacterCodexHub({
  workspaceId,
  canEdit,
  onOpenNationEntry
}: CharacterCodexHubProps) {
  const { isMobile, isTablet } = useDeviceUI();

  const [items, setItems] = useState<CharacterListProjection[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState<{ nationalities: string[]; races: string[]; organizations: string[] }>({
    nationalities: [],
    races: [],
    organizations: []
  });
  const [allRelations, setAllRelations] = useState<CharacterRelationshipRecord[]>([]);
  const [customFields, setCustomFields] = useState<CharacterCustomFieldDef[]>([]);

  // Filters & view mode
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("grid");
  const [q, setQ] = useState("");
  const [nationality, setNationality] = useState("");
  const [race, setRace] = useState("");
  const [organization, setOrganization] = useState("");
  const [lifeStatus, setLifeStatus] = useState("");
  const [rarity, setRarity] = useState("");
  const [sortBy, setSortBy] = useState<"updatedAt" | "name" | "level" | "statScore">("updatedAt");

  // Active sub-views & modals
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<{ open: boolean; dossier: CharacterHydratedDossier | null }>({
    open: false,
    dossier: null
  });
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareDossiers, setCompareDossiers] = useState<CharacterHydratedDossier[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditIssues, setAuditIssues] = useState<CharacterAuditIssue[]>([]);
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldGroup, setNewFieldGroup] = useState("Mở rộng Thế giới quan");
  const [newFieldType, setNewFieldType] = useState<CharacterCustomFieldDataType>("text");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");

  const loadCharacters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspaceId,
        page: String(page),
        limit: "24",
        sortBy
      });
      if (q.trim()) params.set("q", q.trim());
      if (nationality) params.set("nationality", nationality);
      if (race) params.set("race", race);
      if (organization) params.set("organization", organization);
      if (lifeStatus) params.set("lifeStatus", lifeStatus);
      if (rarity) params.set("rarity", rarity);

      const res = await fetch(`/api/characters?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setFacets(data.facets || { nationalities: [], races: [], organizations: [] });
      setAllRelations(data.allRelationships || []);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, page, sortBy, q, nationality, race, organization, lifeStatus, rarity]);

  const loadCustomFields = useCallback(async () => {
    const res = await fetch(`/api/characters/custom-fields?workspaceId=${workspaceId}`);
    const data = await res.json();
    setCustomFields(data.fields || []);
  }, [workspaceId]);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  useEffect(() => {
    loadCustomFields();
  }, [loadCustomFields]);

  async function openComparator() {
    const ids = compareIds.length >= 2 ? compareIds : items.slice(0, 3).map((x) => x.id);
    setCompareIds(ids);
    setShowCompareModal(true);
    const loaded = await Promise.all(
      ids.map((id) =>
        fetch(`/api/characters/${encodeURIComponent(id)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d?.dossier || null)
      )
    );
    setCompareDossiers(loaded.filter(Boolean));
  }

  async function runAudit() {
    setShowAuditModal(true);
    const res = await fetch(`/api/characters/audit?workspaceId=${workspaceId}`);
    const data = await res.json();
    setAuditIssues(data.issues || []);
  }

  async function handleAddCustomField(e: React.FormEvent) {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;
    await fetch("/api/characters/custom-fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        label: newFieldLabel.trim(),
        groupName: newFieldGroup.trim() || "Mở rộng",
        dataType: newFieldType
      })
    });
    setNewFieldLabel("");
    await loadCustomFields();
  }

  async function handleBulkImport() {
    setImportMsg("");
    try {
      const trimmed = importText.trim();
      let records: Array<{ fullName: string; race?: string; nationality?: string; occupation?: string; level?: number }> = [];
      if (trimmed.startsWith("[")) {
        records = JSON.parse(trimmed);
      } else {
        // Parse CSV lines: FullName,Race,Nationality,Occupation,Level
        const lines = trimmed.split(/\r?\n/).filter(Boolean);
        records = lines.map((line) => {
          const [fullName, raceVal, natVal, occVal, lvVal] = line.split(",").map((s) => s.trim());
          return {
            fullName,
            race: raceVal || "Nhân tộc",
            nationality: natVal || "",
            occupation: occVal || "",
            level: lvVal ? Number(lvVal) : 1
          };
        });
      }
      const res = await fetch("/api/characters/io", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, records })
      });
      const data = await res.json();
      if (!res.ok) {
        setImportMsg(data.error || "Lỗi nhập dữ liệu.");
      } else {
        setImportMsg(`✓ Đã nhập thành công ${data.imported} hồ sơ nhân vật vào DB!`);
        setImportText("");
        await loadCharacters();
      }
    } catch {
      setImportMsg("Định dạng JSON hoặc CSV chưa hợp lệ.");
    }
  }

  if (activeCharacterId) {
    return (
      <>
        <CharacterDetailView
          characterId={activeCharacterId}
          canEdit={canEdit}
          onBack={() => setActiveCharacterId(null)}
          onOpenCharacter={(id) => setActiveCharacterId(id)}
          onEdit={(dossier) => setEditorState({ open: true, dossier })}
          onDeleted={() => {
            setActiveCharacterId(null);
            loadCharacters();
          }}
          onOpenNationEntry={onOpenNationEntry}
        />
        {editorState.open && (
          <CharacterEditorModal
            workspaceId={workspaceId}
            initialDossier={editorState.dossier}
            allCharacters={items}
            customFieldDefs={customFields}
            onClose={() => setEditorState({ open: false, dossier: null })}
            onSaved={(saved) => {
              setEditorState({ open: false, dossier: null });
              setActiveCharacterId(saved.character.id);
              loadCharacters();
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-4 animate-codex-fade-up">
      {/* Header Banner */}
      <div className="codex-card arcane-corners rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--accent)] flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>CHARACTER CODEX — Hệ Thống Hồ Sơ Nhân Vật 17 Nhóm</span>
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Chuẩn hóa 22 bảng quan hệ · ID bất biến <code className="text-[var(--accent)]">CHAR-XXXXXX</code> · 13 Chỉ số · Quan hệ 2 chiều · Spoiler cấp từng mục.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowGraphModal(true)}
              className="px-2.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 text-xs flex items-center gap-1 cursor-pointer"
            >
              <Network className="w-3.5 h-3.5" /> Sơ đồ Quan hệ
            </button>
            <button
              type="button"
              onClick={openComparator}
              className="px-2.5 py-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 text-xs flex items-center gap-1 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" /> So sánh ({compareIds.length})
            </button>
            <button
              type="button"
              onClick={runAudit}
              className="px-2.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 text-xs flex items-center gap-1 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" /> Kiểm định
            </button>
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => setShowFieldsModal(true)}
                  className="px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] flex items-center gap-1 cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" /> Trường động ({customFields.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="px-2.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Import / Export
                </button>
                <button
                  type="button"
                  onClick={() => setEditorState({ open: true, dossier: null })}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-xs flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-lg shadow-[var(--accent)]/20"
                >
                  <Plus className="w-4 h-4" /> Tạo Nhân vật
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search & Multi-Condition Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[var(--accent)] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên, bí danh, danh hiệu, kỹ năng, quốc gia, tổ chức..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] pl-8 pr-3 py-2 text-xs text-[var(--text-primary)]"
            />
          </div>

          <select value={nationality} onChange={(e) => { setNationality(e.target.value); setPage(1); }} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs">
            <option value="">Tất cả Quốc gia</option>
            {facets.nationalities.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>

          <select value={race} onChange={(e) => { setRace(e.target.value); setPage(1); }} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs">
            <option value="">Tất cả Chủng tộc</option>
            {facets.races.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          <select value={organization} onChange={(e) => { setOrganization(e.target.value); setPage(1); }} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs">
            <option value="">Tất cả Tổ chức</option>
            {facets.organizations.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>

          <select value={lifeStatus} onChange={(e) => { setLifeStatus(e.target.value); setPage(1); }} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs">
            <option value="">Mọi trạng thái</option>
            <option value="alive">Còn sống</option>
            <option value="deceased">Đã mất</option>
            <option value="missing">Mất tích</option>
            <option value="immortal">Bất tử</option>
          </select>

          <select value={rarity} onChange={(e) => { setRarity(e.target.value); setPage(1); }} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs">
            <option value="">Mọi độ hiếm</option>
            <option value="legendary">Huyền thoại</option>
            <option value="mythic">Thần thoại</option>
            <option value="epic">Sử thi</option>
            <option value="rare">Hiếm</option>
            <option value="common">Thường</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs">
            <option value="updatedAt">Mới cập nhật</option>
            <option value="level">Cấp độ (Cao → Thấp)</option>
            <option value="statScore">Tổng chỉ số</option>
            <option value="name">Tên A → Z</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-0.5 ml-auto">
            {(
              [
                ["grid", LayoutGrid, "Lưới"],
                ["list", List, "Danh sách"],
                ...(!isMobile ? ([["table", Table2, "Bảng"]] as const) : [])
              ] as const
            ).map(([m, Icon, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                title={label}
                className={`p-1.5 rounded-lg cursor-pointer ${
                  viewMode === m ? "bg-[var(--accent)] text-[#090e1c]" : "text-[var(--text-muted)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className={`grid ${isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-3"} gap-4`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="codex-card rounded-2xl h-44 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="codex-card rounded-2xl p-12 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-[var(--accent)] mx-auto opacity-60" />
          <p className="font-display text-base">Chưa có hồ sơ nhân vật nào khớp bộ lọc</p>
        </div>
      ) : viewMode === "table" && !isMobile ? (
        <div className="codex-card rounded-2xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-[var(--border-subtle)] bg-white/5 text-[var(--text-muted)]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Họ và tên</th>
                <th className="p-3">Quốc gia</th>
                <th className="p-3">Chủng tộc</th>
                <th className="p-3">Nghề nghiệp / Chức vụ</th>
                <th className="p-3">Cấp độ</th>
                <th className="p-3">So sánh</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const checked = compareIds.includes(c.id);
                return (
                  <tr key={c.id} className="border-b border-[var(--border-subtle)]/40 hover:bg-white/5">
                    <td className="p-3 font-mono text-[var(--accent)]">{c.id}</td>
                    <td className="p-3">
                      <button type="button" onClick={() => setActiveCharacterId(c.id)} className="font-bold text-[var(--text-primary)] hover:text-[var(--accent)] cursor-pointer text-left">
                        {c.symbol} {c.fullName}
                      </button>
                    </td>
                    <td className="p-3 text-[var(--text-secondary)]">{c.nationality || "—"}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{c.race}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{c.position || c.occupation || "—"}</td>
                    <td className="p-3 font-mono text-amber-300 font-bold">Lv.{c.level}</td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setCompareIds((prev) =>
                            checked ? prev.filter((x) => x !== c.id) : [...prev, c.id].slice(0, 4)
                          )
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-2.5">
          {items.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveCharacterId(c.id)}
              className="codex-card rounded-2xl p-3.5 flex items-center gap-3.5 hover:border-[var(--accent)] transition cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 bg-black/30"
                style={{ borderColor: c.accentColor, color: c.accentColor }}
              >
                {c.symbol}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] text-[var(--accent)]">{c.id}</span>
                  <span className="font-display font-bold text-sm text-[var(--text-primary)]">{c.fullName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">Lv.{c.level}</span>
                </div>
                <div className="text-xs text-[var(--text-muted)] truncate">
                  {c.titles[0] || c.position || c.occupation} · {c.nationality} · {c.race}
                </div>
              </div>
              <span className="hidden sm:inline font-mono text-xs text-purple-300 shrink-0">
                Tổng chỉ số: {c.totalStatScore}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid ${isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"} gap-4`}>
          {items.map((c) => {
            const inCompare = compareIds.includes(c.id);
            return (
              <div
                key={c.id}
                onClick={() => setActiveCharacterId(c.id)}
                className="codex-card codex-card-lift rounded-2xl p-4 space-y-3 cursor-pointer relative overflow-hidden border"
                style={{ borderColor: `${c.accentColor}44` }}
              >
                <div className="flex items-start gap-3">
                  {c.portraitUrl ? (
                    <img src={c.portraitUrl} alt={c.fullName} className="w-14 h-14 rounded-xl object-cover border shrink-0" style={{ borderColor: c.accentColor }} />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl border flex items-center justify-center text-2xl shrink-0 bg-black/35"
                      style={{ borderColor: c.accentColor, color: c.accentColor }}
                    >
                      {c.symbol}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-[var(--accent)]">{c.id}</span>
                      <div className="flex items-center gap-1">
                        {c.pinnedToGrandHall && <Pin className="w-3 h-3 text-amber-400" />}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompareIds((prev) =>
                              inCompare ? prev.filter((x) => x !== c.id) : [...prev, c.id].slice(0, 4)
                            );
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] border cursor-pointer ${
                            inCompare ? "border-purple-400 bg-purple-500/20 text-purple-200" : "border-white/15 text-[var(--text-muted)]"
                          }`}
                        >
                          {inCompare ? "✓ SS" : "+SS"}
                        </button>
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-base text-[var(--text-primary)] truncate">
                      {c.fullName}
                    </h3>
                    <div className="text-[11px] text-[var(--accent)] truncate">
                      {c.titles[0] || c.position || c.occupation || "Chưa cập nhật danh hiệu"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="rounded-lg bg-[var(--bg-base)]/60 px-2 py-1 truncate">
                    <span className="text-[var(--text-muted)]">Quốc gia: </span>
                    <strong className="text-[var(--text-primary)]">{c.nationality || "—"}</strong>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-base)]/60 px-2 py-1 truncate">
                    <span className="text-[var(--text-muted)]">Chủng tộc: </span>
                    <strong className="text-[var(--text-primary)]">{c.race}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--border-subtle)]/50">
                  <span className="font-mono text-amber-300 font-bold">
                    Lv.{c.level} {c.realm ? `· ${c.realm}` : ""}
                  </span>
                  <span className="text-[var(--text-muted)] font-mono">Chỉ số {c.totalStatScore}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Server Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] disabled:opacity-40 cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Trước
          </button>
          <span className="font-mono text-[var(--text-muted)]">
            Trang {page} / {totalPages} ({total.toLocaleString("vi-VN")} nhân vật)
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] disabled:opacity-40 cursor-pointer flex items-center gap-1"
          >
            Sau <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Modal */}
      {editorState.open && (
        <CharacterEditorModal
          workspaceId={workspaceId}
          initialDossier={editorState.dossier}
          allCharacters={items}
          customFieldDefs={customFields}
          onClose={() => setEditorState({ open: false, dossier: null })}
          onSaved={(saved) => {
            setEditorState({ open: false, dossier: null });
            loadCharacters();
            setActiveCharacterId(saved.character.id);
          }}
        />
      )}

      {/* Global Interactive SVG Relationship Network Modal */}
      {showGraphModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-[var(--border-strong)] bg-slate-950 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-cyan-300 flex items-center gap-2">
                <Network className="w-4 h-4" /> Sơ đồ Mạng lưới Quan hệ Nhân vật ({allRelations.length} liên kết)
              </h3>
              <button type="button" onClick={() => setShowGraphModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <svg viewBox="0 0 760 400" className="w-full h-[380px] rounded-xl border border-slate-800 bg-[#050c1a]">
              {(() => {
                const posMap = new Map<string, { x: number; y: number }>();
                items.forEach((c, idx) => {
                  const ang = (idx / Math.max(1, items.length)) * Math.PI * 2 - Math.PI / 2;
                  posMap.set(c.id, {
                    x: 380 + Math.cos(ang) * 230,
                    y: 200 + Math.sin(ang) * 135
                  });
                });
                return (
                  <>
                    {allRelations.map((r) => {
                      const a = posMap.get(r.characterAId);
                      const b = posMap.get(r.characterBId);
                      if (!a || !b) return null;
                      return (
                        <g key={r.id}>
                          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#d4af37" strokeOpacity={0.6} strokeWidth={1.6} />
                          <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle" fontSize={10} fill="#cbd5e1">
                            {RELATION_LABELS_VI[r.relationType]}
                          </text>
                        </g>
                      );
                    })}
                    {items.map((c) => {
                      const p = posMap.get(c.id);
                      if (!p) return null;
                      return (
                        <g
                          key={c.id}
                          onClick={() => {
                            setShowGraphModal(false);
                            setActiveCharacterId(c.id);
                          }}
                          className="cursor-pointer"
                        >
                          <circle cx={p.x} cy={p.y} r={24} fill="#0f172a" stroke={c.accentColor} strokeWidth={2.2} />
                          <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={16} fill={c.accentColor}>{c.symbol}</text>
                          <text x={p.x} y={p.y + 39} textAnchor="middle" fontSize={11} fontWeight={700} fill="#f8fafc">{c.fullName}</text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      )}

      {/* Multi-Character Power & Stat Comparator Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[88vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="font-display font-bold text-base text-[var(--accent)] flex items-center gap-2">
                <Scale className="w-4 h-4" /> So sánh Đa Nhân vật &amp; 13 Chỉ số Sức mạnh
              </h3>
              <button type="button" onClick={() => setShowCompareModal(false)} className="p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {compareDossiers.map((d) => (
                <div key={d.character.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3.5 text-xs space-y-2">
                  <div className="font-display font-bold text-sm text-[var(--accent)]">
                    {d.character.symbol} {d.character.fullName}
                  </div>
                  <div className="font-mono text-amber-300">Lv.{d.ability.level} · {d.ability.realm || "—"}</div>
                  <div className="space-y-1 pt-2 border-t border-[var(--border-subtle)]">
                    {(
                      [
                        ["HP", d.ability.stats.hp],
                        ["MP", d.ability.stats.mp],
                        ["Thể lực", d.ability.stats.stamina],
                        ["Sức mạnh", d.ability.stats.strength],
                        ["Tốc độ", d.ability.stats.speed],
                        ["Phòng thủ", d.ability.stats.defense],
                        ["Trí tuệ", d.ability.stats.intelligence],
                        ["Ý chí", d.ability.stats.willpower]
                      ] as const
                    ).map(([label, val]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-[var(--text-muted)]">{label}</span>
                        <strong className="font-mono text-[var(--text-primary)]">{val}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Integrity Auditor Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[82vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="font-display font-bold text-base text-amber-300">
                Kiểm định Toàn vẹn Character Codex ({auditIssues.length} phát hiện)
              </h3>
              <button type="button" onClick={() => setShowAuditModal(false)} className="p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            {auditIssues.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-300">
                ✓ Không phát hiện ID trùng lặp, quan hệ gãy hay mâu thuẫn niên đại!
              </div>
            ) : (
              <div className="space-y-2">
                {auditIssues.map((iss) => (
                  <div key={iss.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 text-xs flex items-center justify-between gap-2">
                    <div>
                      <span className={`uppercase font-mono text-[10px] mr-2 ${iss.severity === "error" ? "text-rose-400" : iss.severity === "warning" ? "text-amber-300" : "text-sky-300"}`}>
                        [{iss.severity}]
                      </span>
                      <span>{iss.message}</span>
                    </div>
                    {iss.characterId && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAuditModal(false);
                          setActiveCharacterId(iss.characterId!);
                        }}
                        className="px-2 py-1 rounded bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] shrink-0 cursor-pointer"
                      >
                        Mở hồ sơ
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Non-Destructive Custom Fields Manager Modal */}
      {showFieldsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="font-display font-bold text-base text-[var(--accent)]">
                Quản lý Trường Dữ liệu Tùy biến (Không mất dữ liệu cũ)
              </h3>
              <button type="button" onClick={() => setShowFieldsModal(false)} className="p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCustomField} className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <input required placeholder="Tên trường mới..." value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
              <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as CharacterCustomFieldDataType)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5">
                <option value="text">Văn bản</option>
                <option value="long_text">Văn bản dài</option>
                <option value="integer">Số nguyên</option>
                <option value="decimal">Số thập phân</option>
                <option value="date">Ngày tháng</option>
                <option value="boolean">Boolean</option>
                <option value="select">Select</option>
                <option value="url">URL</option>
              </select>
              <button type="submit" className="rounded-lg bg-[var(--accent)] text-[#090e1c] font-bold py-1.5 cursor-pointer">+ Tạo trường</button>
            </form>
            <div className="space-y-1.5 max-h-60 overflow-y-auto text-xs">
              {customFields.map((cf) => (
                <div key={cf.id} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-2">
                  <div>
                    <span className="font-mono text-[10px] text-[var(--accent)] mr-2">{cf.id}</span>
                    <strong>{cf.label}</strong> <span className="text-[var(--text-muted)]">({cf.dataType})</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/characters/custom-fields?id=${cf.id}`, { method: "DELETE" });
                      loadCustomFields();
                    }}
                    className="text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Export / Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="font-display font-bold text-base text-[var(--accent)]">Xuất &amp; Nhập Hàng loạt (JSON / CSV)</h3>
              <button type="button" onClick={() => setShowImportModal(false)} className="p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/api/characters/io?workspaceId=${workspaceId}&format=json`}
                className="px-3 py-2 rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-200 inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Xuất toàn bộ JSON
              </a>
              <a
                href={`/api/characters/io?workspaceId=${workspaceId}&format=csv`}
                className="px-3 py-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Xuất toàn bộ CSV
              </a>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
              <div className="font-semibold text-[var(--text-primary)]">Nhập nhanh nhiều nhân vật (CSV: HọTên,ChủngTộc,QuốcGia,Nghề,CấpĐộ — hoặc JSON Array):</div>
              <textarea
                rows={5}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={"Lyra Solis,Nhân tộc,Vương quốc Valoria,Học giả Thiên văn,42\nDarius Koth,Chiến tộc,Zog-Koth,Thương nhân,35"}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-2.5 font-mono text-xs"
              />
              {importMsg && <div className="text-emerald-300">{importMsg}</div>}
              <button
                type="button"
                disabled={!importText.trim()}
                onClick={handleBulkImport}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold disabled:opacity-50 cursor-pointer"
              >
                Nhập vào Cơ sở Dữ liệu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
