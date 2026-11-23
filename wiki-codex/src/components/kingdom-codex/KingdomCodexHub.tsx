"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  LayoutGrid,
  List,
  Plus,
  Scale,
  Search,
  Settings2,
  Table2,
  Trash2,
  Upload,
  X
} from "lucide-react";
import type {
  KingdomCustomFieldDef,
  KingdomCustomFieldType,
  KingdomHydratedDossier,
  KingdomListProjection
} from "@/types/kingdom-codex";
import { EntityEmblemSVG } from "../EntityVisualWidgets";
import { useDeviceUI } from "@/lib/device-ui";
import { KingdomDetailView } from "./KingdomDetailView";
import { KingdomEditorModal } from "./KingdomEditorModal";

interface KingdomCodexHubProps {
  workspaceId: string;
  canEdit: boolean;
  onViewOnAtlas?: (atlasNationId: string) => void;
  onOpenWikiEntry?: (entryId: string) => void;
  onOpenCharacter?: (charId: string) => void;
  autoOpenCreateSignal?: number;
}

export function KingdomCodexHub({
  workspaceId,
  canEdit,
  onViewOnAtlas,
  onOpenWikiEntry,
  onOpenCharacter,
  autoOpenCreateSignal = 0
}: KingdomCodexHubProps) {
  const { isMobile, isTablet } = useDeviceUI();

  const [items, setItems] = useState<KingdomListProjection[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState<{ continents: string[]; governments: string[] }>({
    continents: [],
    governments: []
  });
  const [customFields, setCustomFields] = useState<KingdomCustomFieldDef[]>([]);

  // Filters
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("grid");
  const [q, setQ] = useState("");
  const [continent, setContinent] = useState("");
  const [polityType, setPolityType] = useState("");
  const [developmentLevel, setDevelopmentLevel] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "population" | "area" | "gdp" | "updatedAt">("population");

  // Sub-views & Modals
  const [activeKingdomId, setActiveKingdomId] = useState<string | null>(null);
  const [editingDossier, setEditingDossier] = useState<KingdomHydratedDossier | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareDossiers, setCompareDossiers] = useState<KingdomHydratedDossier[]>([]);

  // Create / Clone Modal
  const [createModal, setCreateModal] = useState<{ open: boolean; cloneFromId?: string; cloneLabel?: string }>({
    open: false
  });

  useEffect(() => {
    if (autoOpenCreateSignal > 0 && canEdit) {
      setActiveKingdomId(null);
      setCreateModal({ open: true });
    }
  }, [autoOpenCreateSignal, canEdit]);
  const [newName, setNewName] = useState("");
  const [newCapital, setNewCapital] = useState("");
  const [newContinent, setNewContinent] = useState("Lục địa Aurelia");

  // Custom Fields & IO Modals
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<KingdomCustomFieldType>("text");
  const [showIOModal, setShowIOModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");

  const loadKingdoms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspaceId,
        page: String(page),
        limit: "24",
        sortBy
      });
      if (q.trim()) params.set("q", q.trim());
      if (continent) params.set("continent", continent);
      if (polityType) params.set("polityType", polityType);
      if (developmentLevel) params.set("developmentLevel", developmentLevel);

      const res = await fetch(`/api/kingdoms?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setFacets(data.facets || { continents: [], governments: [] });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, page, sortBy, q, continent, polityType, developmentLevel]);

  const loadCustomFields = useCallback(async () => {
    const res = await fetch(`/api/kingdoms/custom-fields?workspaceId=${workspaceId}`);
    const data = await res.json();
    setCustomFields(data.fields || []);
  }, [workspaceId]);

  useEffect(() => {
    loadKingdoms();
  }, [loadKingdoms]);

  useEffect(() => {
    loadCustomFields();
  }, [loadCustomFields]);

  async function openComparator() {
    const ids = compareIds.length >= 2 ? compareIds : items.slice(0, 3).map((x) => x.id);
    setCompareIds(ids);
    setShowCompareModal(true);
    const loaded = await Promise.all(
      ids.map((id) =>
        fetch(`/api/kingdoms/${encodeURIComponent(id)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d?.dossier || null)
      )
    );
    setCompareDossiers(loaded.filter(Boolean));
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch("/api/kingdoms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        cloneFromId: createModal.cloneFromId,
        officialName: newName.trim(),
        capitalName: newCapital.trim() || undefined,
        continent: newContinent
      })
    });
    const data = await res.json();
    if (res.ok && data.dossier) {
      setCreateModal({ open: false });
      setNewName("");
      setNewCapital("");
      await loadKingdoms();
      setActiveKingdomId(data.dossier.kingdom.id);
    }
  }

  async function handleBulkImport() {
    setImportMsg("");
    try {
      const trimmed = importText.trim();
      const records = trimmed.startsWith("[")
        ? JSON.parse(trimmed)
        : trimmed
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => {
              const [officialName, capitalName, continentVal, governmentType] = line.split(",").map((s) => s.trim());
              return { officialName, capitalName, continent: continentVal, governmentType };
            });
      const res = await fetch("/api/kingdoms/io", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, records })
      });
      const data = await res.json();
      if (res.ok) {
        setImportMsg(`✓ Đã nhập thành công ${data.imported} quốc gia mới!`);
        setImportText("");
        await loadKingdoms();
      } else {
        setImportMsg(data.error || "Lỗi nhập dữ liệu.");
      }
    } catch {
      setImportMsg("Định dạng JSON/CSV chưa hợp lệ.");
    }
  }

  if (activeKingdomId) {
    return (
      <>
        <KingdomDetailView
          kingdomId={activeKingdomId}
          canEdit={canEdit}
          onBack={() => setActiveKingdomId(null)}
          onOpenKingdom={(id) => setActiveKingdomId(id)}
          onEdit={(d) => setEditingDossier(d)}
          onClone={(sourceId, sourceName) => {
            setNewName(`${sourceName} (Bản sao)`);
            setCreateModal({ open: true, cloneFromId: sourceId, cloneLabel: sourceName });
          }}
          onDeleted={() => {
            setActiveKingdomId(null);
            loadKingdoms();
          }}
          onViewOnAtlas={onViewOnAtlas}
          onOpenWikiEntry={onOpenWikiEntry}
          onOpenCharacter={onOpenCharacter}
        />
        {editingDossier && (
          <KingdomEditorModal
            dossier={editingDossier}
            customFieldDefs={customFields}
            onClose={() => setEditingDossier(null)}
            onSaved={(updated) => {
              setEditingDossier(null);
              setActiveKingdomId(updated.kingdom.id);
              loadKingdoms();
            }}
          />
        )}
      </>
    );
  }

  // Radar helper for 2-5 Kingdom Comparator (6 core axes)
  const RADAR_AXES: Array<{ key: string; label: string }> = [
    { key: "economic_power", label: "Kinh tế" },
    { key: "tech_level", label: "Công nghệ" },
    { key: "political_stability", label: "Chính trị" },
    { key: "defense_capability", label: "Quốc phòng" },
    { key: "infrastructure_dev", label: "Hạ tầng" },
    { key: "cultural_strength", label: "Văn hóa" }
  ];
  const RADAR_COLORS = ["#f59e0b", "#38bdf8", "#10b981", "#a78bfa", "#f43f5e"];

  return (
    <div className="space-y-4 animate-codex-fade-up">
      {/* Header Banner */}
      <div className="codex-card arcane-corners rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--accent)] flex items-center gap-2">
              <Crown className="w-5 h-5" />
              <span>KINGDOM CODEX — Đại Bách Khoa 360+ Quốc Gia</span>
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              24 bảng chuẩn hóa · ID bất biến <code className="text-[var(--accent)]">KING-000001..000360</code> · 18 nhóm dữ liệu · Liên kết 2 chiều với Character Codex &amp; Bản đồ 360.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={openComparator}
              className="px-2.5 py-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 text-xs flex items-center gap-1 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" /> So sánh 2–5 QG ({compareIds.length})
            </button>
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => setShowFieldsModal(true)}
                  className="px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-center gap-1 cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" /> Trường động ({customFields.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowIOModal(true)}
                  className="px-2.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Export / Import
                </button>
                <button
                  type="button"
                  onClick={() => setCreateModal({ open: true })}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-xs flex items-center gap-1 hover:brightness-110 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Tạo Quốc gia
                </button>
              </>
            )}
          </div>
        </div>

        {/* Multi-Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[var(--accent)] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Tìm tên quốc gia, mã KING-..., thủ đô, lục địa, tiền tệ..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] pl-8 pr-3 py-2 text-xs"
            />
          </div>

          <select value={continent} onChange={(e) => { setContinent(e.target.value); setPage(1); }} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs">
            <option value="">Tất cả 9 Lục địa</option>
            {facets.continents.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={polityType} onChange={(e) => { setPolityType(e.target.value); setPage(1); }} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs">
            <option value="">Mọi loại chính thể</option>
            <option value="kingdom">Vương quốc</option>
            <option value="empire">Đế chế</option>
            <option value="federation">Liên bang</option>
            <option value="republic">Cộng hòa</option>
            <option value="city_state">Thành bang</option>
            <option value="special_zone">Đặc khu</option>
          </select>

          <select value={developmentLevel} onChange={(e) => { setDevelopmentLevel(e.target.value); setPage(1); }} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs">
            <option value="">Mọi cấp phát triển</option>
            <option value="superpower">Siêu cường</option>
            <option value="developed">Phát triển cao</option>
            <option value="developing">Đang phát triển</option>
            <option value="emerging">Mới nổi</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs">
            <option value="population">Dân số (Cao → Thấp)</option>
            <option value="gdp">GDP (Cao → Thấp)</option>
            <option value="area">Diện tích (Lớn → Nhỏ)</option>
            <option value="name">Tên A → Z</option>
            <option value="updatedAt">Mới cập nhật</option>
          </select>

          <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-0.5 ml-auto">
            {(
              [
                ["grid", LayoutGrid],
                ["list", List],
                ...(!isMobile ? ([["table", Table2]] as const) : [])
              ] as const
            ).map(([m, Icon]) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`p-1.5 rounded-lg cursor-pointer ${viewMode === m ? "bg-[var(--accent)] text-[#090e1c]" : "text-[var(--text-muted)]"}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className={`grid ${isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-3"} gap-4`}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="codex-card rounded-2xl h-44 animate-pulse bg-white/5" />)}
        </div>
      ) : viewMode === "table" && !isMobile ? (
        <div className="codex-card rounded-2xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-[var(--border-subtle)] bg-white/5 text-[var(--text-muted)]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Quốc gia</th>
                <th className="p-3">Thủ đô</th>
                <th className="p-3">Lục địa</th>
                <th className="p-3">Dân số</th>
                <th className="p-3">Diện tích</th>
                <th className="p-3">Tiền tệ</th>
                <th className="p-3">SS</th>
              </tr>
            </thead>
            <tbody>
              {items.map((k) => {
                const checked = compareIds.includes(k.id);
                return (
                  <tr key={k.id} className="border-b border-[var(--border-subtle)]/40 hover:bg-white/5">
                    <td className="p-3 font-mono text-[var(--accent)]">{k.id}</td>
                    <td className="p-3">
                      <button type="button" onClick={() => setActiveKingdomId(k.id)} className="font-bold hover:text-[var(--accent)] cursor-pointer text-left">
                        {k.officialName}
                      </button>
                    </td>
                    <td className="p-3">{k.capitalName}</td>
                    <td className="p-3 text-[var(--text-muted)]">{k.continent}</td>
                    <td className="p-3 font-mono">{(k.population / 1_000_000).toFixed(2)}M</td>
                    <td className="p-3 font-mono">{k.areaKm2.toLocaleString("vi-VN")} km²</td>
                    <td className="p-3 font-mono text-amber-300">{k.currencyCode}</td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setCompareIds((p) => (checked ? p.filter((x) => x !== k.id) : [...p, k.id].slice(0, 5)))
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
          {items.map((k) => (
            <div
              key={k.id}
              onClick={() => setActiveKingdomId(k.id)}
              className="codex-card rounded-2xl p-3.5 flex items-center gap-3 hover:border-[var(--accent)] cursor-pointer"
            >
              <EntityEmblemSVG config={k.emblemConfig} sigil="⚜" size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[var(--accent)]">{k.id}</span>
                  <span className="font-display font-bold text-sm truncate">{k.officialName}</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] truncate">
                  Thủ đô: {k.capitalName} · {k.continent} · {k.governmentType}
                </div>
              </div>
              <div className="text-right font-mono text-xs shrink-0">
                <div className="text-amber-300">{k.currencyCode}</div>
                <div className="text-[11px] text-[var(--text-muted)]">{(k.population / 1_000_000).toFixed(1)}M dân</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid ${isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"} gap-4`}>
          {items.map((k) => {
            const inCompare = compareIds.includes(k.id);
            return (
              <div
                key={k.id}
                onClick={() => setActiveKingdomId(k.id)}
                className="codex-card codex-card-lift rounded-2xl p-4 space-y-3 cursor-pointer border"
                style={{ borderColor: `${k.accentColor}44` }}
              >
                <div className="flex items-start gap-3">
                  <EntityEmblemSVG config={k.emblemConfig} sigil="⚜" size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-[var(--accent)]">{k.id}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompareIds((p) => (inCompare ? p.filter((x) => x !== k.id) : [...p, k.id].slice(0, 5)));
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] border cursor-pointer ${
                          inCompare ? "border-purple-400 bg-purple-500/20 text-purple-200" : "border-white/15 text-[var(--text-muted)]"
                        }`}
                      >
                        {inCompare ? "✓ SS" : "+SS"}
                      </button>
                    </div>
                    <h3 className="font-display font-bold text-base truncate">{k.officialName}</h3>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">
                      Thủ đô: <strong className="text-[var(--text-primary)]">{k.capitalName}</strong> · {k.continent}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-center">
                  <div className="rounded-lg bg-[var(--bg-base)]/60 py-1.5">
                    <div className="text-[var(--text-muted)]">Dân số</div>
                    <div className="font-bold text-[var(--text-primary)]">{(k.population / 1_000_000).toFixed(1)}M</div>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-base)]/60 py-1.5">
                    <div className="text-[var(--text-muted)]">Diện tích</div>
                    <div className="font-bold text-cyan-300">{Math.round(k.areaKm2 / 1000)}k km²</div>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-base)]/60 py-1.5">
                    <div className="text-[var(--text-muted)]">Tiền tệ</div>
                    <div className="font-bold text-amber-300">{k.currencyCode}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Server Pagination */}
      <div className="flex items-center justify-center gap-3 text-xs">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] disabled:opacity-40 cursor-pointer flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Trước
        </button>
        <span className="font-mono text-[var(--text-muted)]">
          Trang {page} / {totalPages} ({total.toLocaleString("vi-VN")} quốc gia)
        </span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] disabled:opacity-40 cursor-pointer flex items-center gap-1">
          Sau <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2-5 Kingdom Comparator Modal with SVG Radar Chart */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="font-display font-bold text-base text-[var(--accent)] flex items-center gap-2">
                <Scale className="w-4 h-4" /> So sánh {compareDossiers.length} Quốc gia (Biểu đồ Radar &amp; Chỉ số)
              </h3>
              <button type="button" onClick={() => setShowCompareModal(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {compareDossiers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Interactive SVG Radar */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <svg viewBox="0 0 280 280" className="w-64 h-64">
                    {[25, 50, 75, 100].map((r) => (
                      <circle key={r} cx={140} cy={140} r={r} fill="none" stroke="rgba(148,163,184,0.22)" />
                    ))}
                    {RADAR_AXES.map((ax, i) => {
                      const ang = (i / RADAR_AXES.length) * Math.PI * 2 - Math.PI / 2;
                      const x2 = 140 + Math.cos(ang) * 100;
                      const y2 = 140 + Math.sin(ang) * 100;
                      const lx = 140 + Math.cos(ang) * 120;
                      const ly = 140 + Math.sin(ang) * 120;
                      return (
                        <g key={ax.key}>
                          <line x1={140} y1={140} x2={x2} y2={y2} stroke="rgba(148,163,184,0.25)" />
                          <text x={lx} y={ly + 3} textAnchor="middle" fontSize={10} fill="#cbd5e1">{ax.label}</text>
                        </g>
                      );
                    })}
                    {compareDossiers.map((d, dIdx) => {
                      const pts = RADAR_AXES.map((ax, i) => {
                        const score = d.statistics.find((s) => s.key === ax.key)?.score ?? 50;
                        const ang = (i / RADAR_AXES.length) * Math.PI * 2 - Math.PI / 2;
                        return `${(140 + Math.cos(ang) * score).toFixed(1)},${(140 + Math.sin(ang) * score).toFixed(1)}`;
                      }).join(" ");
                      const col = RADAR_COLORS[dIdx % RADAR_COLORS.length];
                      return <polygon key={d.kingdom.id} points={pts} fill={col} fillOpacity={0.18} stroke={col} strokeWidth={2} />;
                    })}
                  </svg>
                  <div className="flex flex-wrap justify-center gap-2 text-[11px] mt-1">
                    {compareDossiers.map((d, i) => (
                      <span key={d.kingdom.id} className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RADAR_COLORS[i % RADAR_COLORS.length] }} />
                        <span>{d.kingdom.commonName}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="md:col-span-7 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                      <tr>
                        <th className="py-2 pr-2">Tiêu chí</th>
                        {compareDossiers.map((d) => <th key={d.kingdom.id} className="py-2 px-2 text-[var(--accent)]">{d.kingdom.commonName}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[var(--border-subtle)]/40">
                        <td className="py-2 pr-2 text-[var(--text-muted)]">Diện tích</td>
                        {compareDossiers.map((d) => <td key={d.kingdom.id} className="py-2 px-2 font-mono">{d.territory.areaKm2.toLocaleString("vi-VN")} km²</td>)}
                      </tr>
                      <tr className="border-b border-[var(--border-subtle)]/40">
                        <td className="py-2 pr-2 text-[var(--text-muted)]">Dân số</td>
                        {compareDossiers.map((d) => {
                          const p = d.populationHistory[d.populationHistory.length - 1]?.totalPopulation ?? 0;
                          return <td key={d.kingdom.id} className="py-2 px-2 font-mono">{(p / 1_000_000).toFixed(2)}M</td>;
                        })}
                      </tr>
                      {RADAR_AXES.map((ax) => (
                        <tr key={ax.key} className="border-b border-[var(--border-subtle)]/40">
                          <td className="py-2 pr-2 text-[var(--text-muted)]">{ax.label}</td>
                          {compareDossiers.map((d) => (
                            <td key={d.kingdom.id} className="py-2 px-2 font-mono font-bold">
                              {d.statistics.find((s) => s.key === ax.key)?.score ?? 0}/100
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Clone Kingdom Modal */}
      {createModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateSubmit} className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
              <h3 className="font-display font-bold text-base text-[var(--accent)]">
                {createModal.cloneFromId ? `Nhân bản Quốc gia từ ${createModal.cloneLabel}` : "Tạo Hồ sơ Quốc gia Mới"}
              </h3>
              <button type="button" onClick={() => setCreateModal({ open: false })} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <input required placeholder="Tên chính thức quốc gia *" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
            <input placeholder="Tên Thủ đô" value={newCapital} onChange={(e) => setNewCapital(e.target.value)} className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
            <input placeholder="Lục địa / Khu vực" value={newContinent} onChange={(e) => setNewContinent(e.target.value)} className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCreateModal({ open: false })} className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] cursor-pointer">Hủy</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-bold cursor-pointer">Khởi tạo</button>
            </div>
          </form>
        </div>
      )}

      {/* Custom Fields Modal (13 Types) */}
      {showFieldsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
              <h3 className="font-display font-bold text-base text-[var(--accent)]">Quản lý Trường Dữ liệu Động Quốc gia (13 Kiểu)</h3>
              <button type="button" onClick={() => setShowFieldsModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newFieldLabel.trim()) return;
                await fetch("/api/kingdoms/custom-fields", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ workspaceId, label: newFieldLabel.trim(), dataType: newFieldType })
                });
                setNewFieldLabel("");
                loadCustomFields();
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              <input required placeholder="Tên trường mới..." value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
              <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as KingdomCustomFieldType)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5">
                <option value="text">Text</option>
                <option value="long_text">Long Text</option>
                <option value="number">Number</option>
                <option value="decimal">Decimal</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean</option>
                <option value="select">Select</option>
                <option value="multi_select">Multi-select</option>
                <option value="url">URL</option>
                <option value="image">Image</option>
                <option value="file">File</option>
                <option value="relation">Relation</option>
                <option value="json">JSON</option>
              </select>
              <button type="submit" className="rounded-lg bg-[var(--accent)] text-[#090e1c] font-bold py-1.5 cursor-pointer">+ Thêm trường</button>
            </form>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {customFields.map((cf) => (
                <div key={cf.id} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-2">
                  <span><code className="text-[var(--accent)] mr-1.5">{cf.id}</code><strong>{cf.label}</strong> ({cf.dataType})</span>
                  <button type="button" onClick={async () => { await fetch(`/api/kingdoms/custom-fields?id=${cf.id}`, { method: "DELETE" }); loadCustomFields(); }} className="text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export / Import Modal */}
      {showIOModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
              <h3 className="font-display font-bold text-base text-[var(--accent)]">Xuất &amp; Nhập Hàng loạt Quốc gia (JSON / CSV)</h3>
              <button type="button" onClick={() => setShowIOModal(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-2">
              <a href={`/api/kingdoms/io?workspaceId=${workspaceId}&format=json`} className="px-3 py-2 rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-200 inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Xuất JSON</a>
              <a href={`/api/kingdoms/io?workspaceId=${workspaceId}&format=csv`} className="px-3 py-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Xuất CSV</a>
            </div>
            <textarea rows={4} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="CSV: TenChinhThuc,ThuDo,LucDia,TheChe — hoặc JSON Array" className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-2.5 font-mono" />
            {importMsg && <div className="text-emerald-300">{importMsg}</div>}
            <button type="button" disabled={!importText.trim()} onClick={handleBulkImport} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold disabled:opacity-50 cursor-pointer">Nhập vào DB</button>
          </div>
        </div>
      )}
    </div>
  );
}
