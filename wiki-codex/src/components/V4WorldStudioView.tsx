"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Calendar,
  Coins,
  Copy,
  Download,
  GitBranch,
  Layers,
  Leaf,
  Moon,
  Plus,
  Scale,
  Sparkles,
  Trash2
} from "lucide-react";
import type {
  CodexAnalyticsSummary,
  Entry,
  EntryCardProjection,
  HierarchyChart,
  HierarchyNode,
  InteractionEffect,
  TaxonomyNode,
  TaxonomyRank,
  TradeCommodity,
  WorldCalendar,
  WorldSystemRule,
  WorldUnit
} from "@/types/codex";
import {
  buildComparisonMatrix,
  buildHierarchySvgString,
  comparisonToMarkdown,
  computeHierarchyLayout,
  computeMoonPhase,
  fromAbsoluteDay,
  toAbsoluteDay
} from "@/lib/v4-engines";
import { computeRadarPolygonPoints, formatUnboundedPower } from "@/lib/v3-engines";

type V4Tab =
  | "hierarchy"
  | "calendar"
  | "compare"
  | "systems"
  | "taxonomy"
  | "economy"
  | "analytics";

interface V4WorldStudioViewProps {
  workspaceId: string;
  entries: EntryCardProjection[];
  worldUnits: WorldUnit[];
  canEdit: boolean;
  onOpenEntry: (id: string) => void;
  onCreateMissingEntry: (title: string) => void;
}

const COMPARE_COLORS = ["#D4AF37", "#38BDF8", "#C084FC", "#34D399", "#FB7185"];

const EFFECT_CYCLE: InteractionEffect[] = ["neutral", "strong", "weak", "synergy", "nullify"];
const EFFECT_META: Record<
  InteractionEffect,
  { label: string; short: string; cls: string }
> = {
  neutral: { label: "Trung lập", short: "·", cls: "bg-white/5 text-[var(--text-muted)] border-[var(--border-subtle)]" },
  strong: { label: "Khắc chế", short: "▲", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" },
  weak: { label: "Bị khắc", short: "▼", cls: "bg-rose-500/20 text-rose-300 border-rose-400/40" },
  synergy: { label: "Cộng hưởng", short: "✦", cls: "bg-sky-500/20 text-sky-300 border-sky-400/40" },
  nullify: { label: "Triệt tiêu", short: "✕", cls: "bg-purple-500/20 text-purple-300 border-purple-400/40" }
};

const TAXONOMY_RANKS: TaxonomyRank[] = ["Giới", "Ngành", "Lớp", "Bộ", "Họ", "Chi", "Loài"];

export function V4WorldStudioView({
  workspaceId,
  entries,
  worldUnits,
  canEdit,
  onOpenEntry,
  onCreateMissingEntry
}: V4WorldStudioViewProps) {
  const [tab, setTab] = useState<V4Tab>("hierarchy");
  const [loading, setLoading] = useState(true);

  const [calendars, setCalendars] = useState<WorldCalendar[]>([]);
  const [hierarchyCharts, setHierarchyCharts] = useState<HierarchyChart[]>([]);
  const [systemRules, setSystemRules] = useState<WorldSystemRule[]>([]);
  const [taxonomyNodes, setTaxonomyNodes] = useState<TaxonomyNode[]>([]);
  const [commodities, setCommodities] = useState<TradeCommodity[]>([]);
  const [analytics, setAnalytics] = useState<CodexAnalyticsSummary | null>(null);

  // Hierarchy state
  const [activeChartId, setActiveChartId] = useState("");
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeSub, setNewNodeSub] = useState("");
  const [newNodeParent, setNewNodeParent] = useState("");
  const [newNodeRel, setNewNodeRel] = useState("Kế vị");
  const [newNodeEntryId, setNewNodeEntryId] = useState("");

  // Calendar state
  const [calYear, setCalYear] = useState(330);
  const [calMonthIdx, setCalMonthIdx] = useState(0);
  const [absDayInput, setAbsDayInput] = useState("118440");
  const [newHolName, setNewHolName] = useState("");
  const [newHolDay, setNewHolDay] = useState("15");

  // Comparison state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareFullEntries, setCompareFullEntries] = useState<Entry[]>([]);
  const [diffOnly, setDiffOnly] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  // System Rule state
  const [activeRuleId, setActiveRuleId] = useState("");
  const [newElemName, setNewElemName] = useState("");

  // Taxonomy state
  const [taxRank, setTaxRank] = useState<TaxonomyRank>("Loài");
  const [taxName, setTaxName] = useState("");
  const [taxSci, setTaxSci] = useState("");
  const [taxBiome, setTaxBiome] = useState("");
  const [taxParentId, setTaxParentId] = useState("");

  // Economy state
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [comName, setComName] = useState("");
  const [comPrice, setComPrice] = useState("100");
  const [comUnit, setComUnit] = useState("1 đơn vị");
  const [comOrigin, setComOrigin] = useState("");

  async function loadAll() {
    setLoading(true);
    try {
      const [bundleRes, analRes] = await Promise.all([
        fetch(`/api/v4?workspaceId=${encodeURIComponent(workspaceId)}`),
        fetch(`/api/v4?workspaceId=${encodeURIComponent(workspaceId)}&kind=analytics`)
      ]);
      if (bundleRes.ok) {
        const data = await bundleRes.json();
        setCalendars(data.calendars || []);
        setHierarchyCharts(data.hierarchyCharts || []);
        setSystemRules(data.systemRules || []);
        setTaxonomyNodes(data.taxonomyNodes || []);
        setCommodities(data.tradeCommodities || []);
        if (data.hierarchyCharts?.[0] && !activeChartId) {
          setActiveChartId(data.hierarchyCharts[0].id);
        }
        if (data.systemRules?.[0] && !activeRuleId) {
          setActiveRuleId(data.systemRules[0].id);
        }
        if (data.calendars?.[0]) {
          setCalYear(data.calendars[0].currentYear || 330);
        }
      }
      if (analRes.ok) {
        const aData = await analRes.json();
        setAnalytics(aData.analytics || null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  useEffect(() => {
    if (compareIds.length === 0 && entries.length >= 2) {
      setCompareIds(entries.slice(0, 3).map((e) => e.id));
    }
  }, [entries, compareIds.length]);

  useEffect(() => {
    if (compareIds.length === 0) {
      setCompareFullEntries([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      compareIds.map((id) =>
        fetch(`/api/entries/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d?.entry as Entry | undefined)
      )
    ).then((list) => {
      if (!cancelled) {
        setCompareFullEntries(list.filter((x): x is Entry => Boolean(x)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [compareIds]);

  const activeChart = useMemo(
    () => hierarchyCharts.find((c) => c.id === activeChartId) || hierarchyCharts[0] || null,
    [hierarchyCharts, activeChartId]
  );

  const hierarchyLayout = useMemo(
    () => computeHierarchyLayout(activeChart?.nodes || []),
    [activeChart]
  );

  const activeCalendar = calendars[0] || null;
  const activeRule = useMemo(
    () => systemRules.find((r) => r.id === activeRuleId) || systemRules[0] || null,
    [systemRules, activeRuleId]
  );

  const currencyUnits = useMemo(
    () => worldUnits.filter((u) => u.category === "currency"),
    [worldUnits]
  );
  const activeCurrency =
    currencyUnits.find((u) => u.id === selectedUnitId) || currencyUnits[0] || null;

  const comparisonRows = useMemo(
    () => buildComparisonMatrix(compareFullEntries),
    [compareFullEntries]
  );
  const visibleComparisonRows = diffOnly
    ? comparisonRows.filter((r) => !r.allEqual)
    : comparisonRows;

  // Handlers
  async function handleAddHierarchyNode(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChart || !newNodeLabel.trim()) return;
    const node: HierarchyNode = {
      id: `hn-${Date.now()}`,
      label: newNodeLabel.trim(),
      subtitle: newNodeSub.trim(),
      sigil: "✦",
      color: "#D4AF37",
      parentId: newNodeParent || null,
      relationLabel: newNodeRel.trim() || "Nhánh con",
      entryId: newNodeEntryId || null
    };
    const updated: HierarchyChart = {
      ...activeChart,
      nodes: [...activeChart.nodes, node]
    };
    await fetch("/api/v4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "hierarchy", chart: updated })
    });
    setNewNodeLabel("");
    setNewNodeSub("");
    await loadAll();
  }

  async function handleDeleteHierarchyNode(nodeId: string) {
    if (!activeChart) return;
    const updated: HierarchyChart = {
      ...activeChart,
      nodes: activeChart.nodes.filter((n) => n.id !== nodeId)
    };
    await fetch("/api/v4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "hierarchy", chart: updated })
    });
    await loadAll();
  }

  function handleExportHierarchySvg() {
    if (!activeChart) return;
    const svg = buildHierarchySvgString(activeChart.name, hierarchyLayout);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeChart.name.toLowerCase().replace(/\s+/g, "-")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleAddHoliday(e: React.FormEvent) {
    e.preventDefault();
    if (!activeCalendar || !newHolName.trim()) return;
    const nextCal: WorldCalendar = {
      ...activeCalendar,
      holidays: [
        ...(activeCalendar.holidays || []),
        {
          id: `hol-${Date.now()}`,
          monthIndex: calMonthIdx,
          day: Math.max(1, Number(newHolDay) || 1),
          name: newHolName.trim(),
          description: "Lễ hội văn hóa định kỳ",
          sigil: "✦"
        }
      ]
    };
    await fetch("/api/v4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "calendar", calendar: nextCal })
    });
    setNewHolName("");
    await loadAll();
  }

  async function handleCycleMatrixCell(src: string, dst: string) {
    if (!activeRule || !canEdit || src === dst) return;
    const key = `${src}::${dst}`;
    const cur = activeRule.matrix[key] || "neutral";
    const next = EFFECT_CYCLE[(EFFECT_CYCLE.indexOf(cur) + 1) % EFFECT_CYCLE.length];
    const updated: WorldSystemRule = {
      ...activeRule,
      matrix: { ...activeRule.matrix, [key]: next }
    };
    setSystemRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    await fetch("/api/v4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "system_rule", rule: updated })
    });
  }

  async function handleAddElement(e: React.FormEvent) {
    e.preventDefault();
    if (!activeRule || !newElemName.trim()) return;
    if (activeRule.elements.includes(newElemName.trim())) return;
    const updated: WorldSystemRule = {
      ...activeRule,
      elements: [...activeRule.elements, newElemName.trim()]
    };
    await fetch("/api/v4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "system_rule", rule: updated })
    });
    setNewElemName("");
    await loadAll();
  }

  async function handleAddTaxonomy(e: React.FormEvent) {
    e.preventDefault();
    if (!taxName.trim()) return;
    await fetch("/api/v4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "taxonomy",
        node: {
          workspaceId,
          parentId: taxParentId || null,
          rank: taxRank,
          name: taxName.trim(),
          scientificName: taxSci.trim() || taxName.trim(),
          biome: taxBiome.trim() || "Đa vùng",
          rarity: "Ít gặp",
          dietOrRole: "Thành phần hệ sinh thái",
          description: "",
          sigil: "ᛇ"
        }
      })
    });
    setTaxName("");
    setTaxSci("");
    setTaxBiome("");
    await loadAll();
  }

  async function handleDeleteTaxonomy(id: string) {
    await fetch(`/api/v4?kind=taxonomy&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadAll();
  }

  async function handleAddCommodity(e: React.FormEvent) {
    e.preventDefault();
    if (!comName.trim()) return;
    await fetch("/api/v4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "commodity",
        commodity: {
          workspaceId,
          name: comName.trim(),
          category: "Ma pháp",
          basePrice: Math.max(0, Number(comPrice) || 10),
          unitLabel: comUnit.trim() || "1 đơn vị",
          rarity: "Ổn định",
          originLabel: comOrigin.trim() || "Toàn lục địa",
          tradeRouteNote: ""
        }
      })
    });
    setComName("");
    setComOrigin("");
    await loadAll();
  }

  async function handleDeleteCommodity(id: string) {
    await fetch(`/api/v4?kind=commodity&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadAll();
  }

  const TABS: Array<{ id: V4Tab; label: string; icon: React.ReactNode }> = [
    { id: "hierarchy", label: "Gia Phả & Phả Hệ", icon: <GitBranch className="w-3.5 h-3.5" /> },
    { id: "calendar", label: "Lịch & Đa Mặt Trăng", icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: "compare", label: "So Sánh Thực Thể", icon: <Scale className="w-3.5 h-3.5" /> },
    { id: "systems", label: "Quy Luật Vũ Trụ", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "taxonomy", label: "Phân Loại Sinh Học", icon: <Leaf className="w-3.5 h-3.5" /> },
    { id: "economy", label: "Sổ Cái Kinh Tế", icon: <Coins className="w-3.5 h-3.5" /> },
    { id: "analytics", label: "Thống Kê Tri Thức", icon: <BarChart3 className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="space-y-4">
      {/* Header + 1-Click 7-Tool Dock */}
      <div className="codex-card arcane-corners rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--accent)] flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Studio Chuyên Khảo Thế Giới V4.0
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              7 công cụ thiết kế thế giới & phân tích bách khoa toàn thư chuyển đổi tức thì với 1 click.
            </p>
          </div>
          {loading && (
            <span className="text-xs font-mono text-[var(--text-muted)]">Đang đồng bộ...</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium shrink-0 transition cursor-pointer ${
                tab === t.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)]/60"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: HIERARCHY & FAMILY TREE SVG */}
      {tab === "hierarchy" && (
        <div className="codex-card rounded-2xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                {activeChart?.name || "Sơ đồ Gia phả & Phả hệ"}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {activeChart?.description || "Bấm vào nút có liên kết để mở thẳng hồ sơ Codex."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportHierarchySvg}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Xuất SVG độ nét cao
            </button>
          </div>

          <div className="overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[#060a14] p-2">
            <svg
              viewBox={`0 0 ${hierarchyLayout.width} ${hierarchyLayout.height}`}
              style={{ minWidth: Math.min(720, hierarchyLayout.width), width: "100%", height: "auto" }}
            >
              {hierarchyLayout.edges.map((e, idx) => {
                const x1 = e.from.x + 93;
                const y1 = e.from.y + 74;
                const x2 = e.to.x + 93;
                const y2 = e.to.y;
                const midY = (y1 + y2) / 2;
                return (
                  <g key={idx}>
                    <path
                      d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                      fill="none"
                      stroke="rgba(212,175,55,0.55)"
                      strokeWidth="2"
                    />
                    {e.label && (
                      <text
                        x={(x1 + x2) / 2}
                        y={midY - 4}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize="10"
                      >
                        {e.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {hierarchyLayout.nodes.map((p) => (
                <g
                  key={p.node.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  onClick={() => p.node.entryId && onOpenEntry(p.node.entryId)}
                  className={p.node.entryId ? "cursor-pointer" : ""}
                >
                  <rect
                    width="186"
                    height="74"
                    rx="14"
                    fill="#10182f"
                    stroke={p.node.color || "#D4AF37"}
                    strokeWidth="2"
                  />
                  <text x="12" y="28" fill="#f5efdf" fontSize="13" fontWeight="700">
                    {p.node.sigil} {p.node.label.slice(0, 21)}
                  </text>
                  <text x="12" y="48" fill="#94a3b8" fontSize="10.5">
                    {(p.node.subtitle || "").slice(0, 28)}
                  </text>
                  {p.node.entryId && (
                    <text x="12" y="64" fill="#38bdf8" fontSize="9.5">
                      ↗ Nhấn mở hồ sơ
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>

          {canEdit && activeChart && (
            <form
              onSubmit={handleAddHierarchyNode}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 pt-3 border-t border-[var(--border-subtle)]"
            >
              <input
                type="text"
                required
                value={newNodeLabel}
                onChange={(e) => setNewNodeLabel(e.target.value)}
                placeholder="Tên nhân vật / chức vị *"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                value={newNodeSub}
                onChange={(e) => setNewNodeSub(e.target.value)}
                placeholder="Chú thích (Đời VI...)"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              />
              <select
                value={newNodeParent}
                onChange={(e) => setNewNodeParent(e.target.value)}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              >
                <option value="">— Nút gốc (Không có cha) —</option>
                {activeChart.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    Con của: {n.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newNodeRel}
                onChange={(e) => setNewNodeRel(e.target.value)}
                placeholder="Nhãn quan hệ"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              />
              <select
                value={newNodeEntryId}
                onChange={(e) => setNewNodeEntryId(e.target.value)}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              >
                <option value="">— Liên kết hồ sơ —</option>
                {entries.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.sigil} {ent.title}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs py-1.5 px-3 cursor-pointer inline-flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm nút
              </button>
            </form>
          )}

          {canEdit && activeChart && activeChart.nodes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeChart.nodes.map((n) => (
                <span
                  key={n.id}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/60"
                >
                  <span>{n.sigil} {n.label}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteHierarchyNode(n.id)}
                    className="text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOM WORLD CALENDAR & MULTI-MOON ENGINE */}
      {tab === "calendar" && activeCalendar && (() => {
        const month = activeCalendar.months[calMonthIdx] || activeCalendar.months[0];
        const moons = activeCalendar.moons || [];
        const holidays = (activeCalendar.holidays || []).filter((h) => h.monthIndex === calMonthIdx);
        const convertedDate = fromAbsoluteDay(activeCalendar, Number(absDayInput) || 0);

        return (
          <div className="codex-card rounded-2xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-[var(--accent)]">
                  {activeCalendar.name} — {activeCalendar.eraName}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {activeCalendar.months.length} tháng · {activeCalendar.weekdays.length} ngày/tuần · {moons.length} mặt trăng quay song song
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalYear((y) => Math.max(1, y - 1))}
                  className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] text-xs cursor-pointer"
                >
                  ← Năm trước
                </button>
                <span className="font-mono text-sm font-bold text-[var(--text-primary)] px-2">
                  Năm {calYear}
                </span>
                <button
                  type="button"
                  onClick={() => setCalYear((y) => y + 1)}
                  className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] text-xs cursor-pointer"
                >
                  Năm sau →
                </button>
              </div>
            </div>

            {/* Month pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {activeCalendar.months.map((m, idx) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => setCalMonthIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl border text-xs shrink-0 cursor-pointer ${
                    idx === calMonthIdx
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                      : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
                  }`}
                >
                  {m.sigil} {m.name} ({m.days}d)
                </button>
              ))}
            </div>

            {/* Moons Legend */}
            {moons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {moons.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 text-xs"
                  >
                    <Moon className="w-3.5 h-3.5" style={{ color: m.color }} />
                    <strong style={{ color: m.color }}>{m.name}</strong>
                    <span className="text-[var(--text-muted)]">· Chu kỳ {m.cycleDays} ngày</span>
                  </span>
                ))}
              </div>
            )}

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div
                className="grid gap-1.5 min-w-[600px]"
                style={{ gridTemplateColumns: `repeat(${activeCalendar.weekdays.length}, minmax(0, 1fr))` }}
              >
                {activeCalendar.weekdays.map((wd) => (
                  <div
                    key={wd}
                    className="text-center text-[11px] font-mono uppercase text-[var(--accent)] py-1.5 rounded-lg bg-[var(--bg-base)]/60 border border-[var(--border-subtle)]"
                  >
                    {wd}
                  </div>
                ))}
                {Array.from({ length: month.days }, (_, i) => {
                  const dayNum = i + 1;
                  const abs = toAbsoluteDay(activeCalendar, calYear, calMonthIdx, dayNum);
                  const hol = holidays.find((h) => h.day === dayNum);
                  return (
                    <div
                      key={dayNum}
                      className={`rounded-xl border p-2 min-h-[76px] flex flex-col justify-between ${
                        hol
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-base)]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                          {dayNum}
                        </span>
                        <span className="text-[10px] tracking-tighter" title={moons.map((m) => `${m.name}: ${computeMoonPhase(m, abs).phaseName}`).join(" | ")}>
                          {moons.map((m) => computeMoonPhase(m, abs).glyph).join("")}
                        </span>
                      </div>
                      {hol && (
                        <div className="text-[10px] leading-tight text-[var(--accent)] font-medium line-clamp-2 mt-1">
                          {hol.sigil} {hol.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Absolute Day Converter + Add Holiday */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 space-y-2">
                <div className="text-xs font-semibold text-[var(--accent)]">
                  Bộ Chuyển Đổi Ngày Tuyệt Đối ↔ Lịch Thế Giới
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={absDayInput}
                    onChange={(e) => setAbsDayInput(e.target.value)}
                    className="w-36 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs font-mono"
                  />
                  <span className="text-xs text-[var(--text-secondary)]">
                    → Ngày <strong>{convertedDate.day}</strong>,{" "}
                    <strong>{activeCalendar.months[convertedDate.monthIndex]?.name}</strong>, Năm{" "}
                    <strong>{convertedDate.year}</strong> ({activeCalendar.weekdays[convertedDate.weekdayIndex]})
                  </span>
                </div>
              </div>

              {canEdit && (
                <form
                  onSubmit={handleAddHoliday}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 flex flex-wrap items-center gap-2"
                >
                  <input
                    type="number"
                    min={1}
                    max={month.days}
                    value={newHolDay}
                    onChange={(e) => setNewHolDay(e.target.value)}
                    className="w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5 text-xs font-mono"
                  />
                  <input
                    type="text"
                    required
                    value={newHolName}
                    onChange={(e) => setNewHolName(e.target.value)}
                    placeholder={`Thêm lễ hội trong ${month.name}...`}
                    className="flex-1 min-w-[160px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
                  >
                    + Lễ hội
                  </button>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* TAB 3: MULTI-ENTITY COMPARISON MATRIX */}
      {tab === "compare" && (
        <div className="codex-card rounded-2xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                So Sánh Đa Thực Thể Side-by-Side (2–5 hồ sơ)
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Tự động hợp nhất Power Level, chỉ số RPG không giới hạn, tô sáng điểm vượt trội và chồng lớp biểu đồ Radar.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={diffOnly}
                  onChange={(e) => setDiffOnly(e.target.checked)}
                />
                Chỉ hiện điểm khác biệt
              </label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    comparisonToMarkdown(compareFullEntries, visibleComparisonRows)
                  );
                  setCopiedMd(true);
                  setTimeout(() => setCopiedMd(false), 1800);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--border-strong)] text-xs text-[var(--accent)] cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> {copiedMd ? "Đã chép Markdown!" : "Chép bảng MD"}
              </button>
            </div>
          </div>

          {/* Selector pills */}
          <div className="flex flex-wrap gap-1.5">
            {entries.slice(0, 20).map((e) => {
              const selected = compareIds.includes(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() =>
                    setCompareIds((prev) =>
                      prev.includes(e.id)
                        ? prev.filter((x) => x !== e.id)
                        : prev.length < 5
                        ? [...prev, e.id]
                        : prev
                    )
                  }
                  className={`px-2.5 py-1 rounded-full border text-xs transition cursor-pointer ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                      : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  {e.sigil} {e.title}
                </button>
              );
            })}
          </div>

          {/* Multi-layer Radar Overlay */}
          {compareFullEntries.length >= 2 && (() => {
            const firstAttrs = compareFullEntries[0]?.attributes || [];
            if (firstAttrs.length < 3) return null;
            return (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-4 flex flex-col md:flex-row items-center gap-6">
                <svg viewBox="0 0 260 260" className="w-56 h-56 shrink-0">
                  {[0.25, 0.5, 0.75, 1].map((r) => (
                    <circle
                      key={r}
                      cx="130"
                      cy="130"
                      r={95 * r}
                      fill="none"
                      stroke="rgba(148,163,184,0.2)"
                    />
                  ))}
                  {compareFullEntries.map((ent, idx) => {
                    const attrs = ent.attributes || [];
                    if (attrs.length < 3) return null;
                    const poly = computeRadarPolygonPoints(attrs, 130, 130, 95);
                    const col = COMPARE_COLORS[idx % COMPARE_COLORS.length];
                    return (
                      <polygon
                        key={ent.id}
                        points={poly.polygonString}
                        fill={`${col}28`}
                        stroke={col}
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>
                <div className="space-y-2 text-xs flex-1">
                  <div className="font-semibold text-[var(--accent)]">
                    Biểu đồ Radar Chồng Lớp (Tự động thang Logarit)
                  </div>
                  {compareFullEntries.map((ent, idx) => (
                    <div key={ent.id} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COMPARE_COLORS[idx % COMPARE_COLORS.length] }}
                      />
                      <span className="font-medium text-[var(--text-primary)]">
                        {ent.sigil} {ent.title}
                      </span>
                      <span className="font-mono text-[var(--text-muted)]">
                        — ⚡ {formatUnboundedPower(ent.powerLevel ?? 0, ent.powerInfinite)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-[var(--border-strong)]">
                  <th className="text-left py-2.5 px-3 text-[var(--accent)] font-mono uppercase">
                    Tiêu chí đối chiếu
                  </th>
                  {compareFullEntries.map((e, idx) => (
                    <th key={e.id} className="text-left py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => onOpenEntry(e.id)}
                        className="font-display font-bold text-sm hover:underline cursor-pointer"
                        style={{ color: COMPARE_COLORS[idx % COMPARE_COLORS.length] }}
                      >
                        {e.sigil} {e.title}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleComparisonRows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-[var(--border-subtle)] hover:bg-white/5"
                  >
                    <td className="py-2 px-3 font-medium text-[var(--text-secondary)]">
                      {row.label}
                    </td>
                    {row.values.map((v) => (
                      <td
                        key={v.entryId}
                        className={`py-2 px-3 font-mono ${
                          v.isMax
                            ? "text-amber-300 font-bold bg-amber-500/10"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        {v.display} {v.isMax && "★"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COSMOLOGY & MAGIC / TECH SYSTEM RULES */}
      {tab === "systems" && activeRule && (
        <div className="codex-card rounded-2xl p-4 space-y-4">
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-[var(--accent)]">
              {activeRule.name}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">{activeRule.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 text-xs">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3">
                <strong className="text-sky-300">Nguồn Năng Lượng:</strong>{" "}
                <span className="text-[var(--text-secondary)]">{activeRule.energySource}</span>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3">
                <strong className="text-rose-300">Cái Giá & Giới Hạn:</strong>{" "}
                <span className="text-[var(--text-secondary)]">{activeRule.costAndLimits}</span>
              </div>
            </div>
          </div>

          {/* Interaction Matrix N x N */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                Ma Trận Tương Khắc & Cộng Hưởng {canEdit ? "(Nhấn vào ô để xoay vòng trạng thái)" : ""}
              </h4>
              {canEdit && (
                <form onSubmit={handleAddElement} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newElemName}
                    onChange={(e) => setNewElemName(e.target.value)}
                    placeholder="Thêm nguyên tố / hệ phái..."
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
                  >
                    + Thêm
                  </button>
                </form>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[520px]">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-[var(--text-muted)] font-mono">Nguồn \ Đích</th>
                    {activeRule.elements.map((el) => (
                      <th key={el} className="p-2 text-center text-[var(--accent)] font-semibold">
                        {el}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeRule.elements.map((src) => (
                    <tr key={src} className="border-t border-[var(--border-subtle)]">
                      <td className="p-2 font-semibold text-[var(--text-primary)]">{src}</td>
                      {activeRule.elements.map((dst) => {
                        const eff = activeRule.matrix[`${src}::${dst}`] || "neutral";
                        const meta = EFFECT_META[eff];
                        return (
                          <td key={dst} className="p-1.5 text-center">
                            <button
                              type="button"
                              disabled={!canEdit || src === dst}
                              onClick={() => handleCycleMatrixCell(src, dst)}
                              className={`w-full py-1.5 px-2 rounded-lg border text-[11px] font-medium transition ${
                                src === dst
                                  ? "opacity-30 border-transparent"
                                  : `${meta.cls} ${canEdit ? "cursor-pointer hover:brightness-125" : ""}`
                              }`}
                            >
                              {src === dst ? "—" : `${meta.short} ${meta.label}`}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tiers */}
          <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            <h4 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              Thang Cảnh Giới & Cấp Bậc Học Thuật
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {activeRule.tiers.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 space-y-1"
                  style={{ borderLeftWidth: 3, borderLeftColor: t.color }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold" style={{ color: t.color }}>
                      Cấp {t.rank}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">
                      ⚡ {t.powerHint}
                    </span>
                  </div>
                  <div className="font-display font-semibold text-sm text-[var(--text-primary)]">
                    {t.name}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">{t.requirement}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TAXONOMY & BESTIARY TREE */}
      {tab === "taxonomy" && (
        <div className="codex-card rounded-2xl p-4 space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Cây Phân Loại Sinh Học & Hệ Sinh Thái ({taxonomyNodes.length} đơn vị)
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Quản lý Chủng tộc, Thảo mộc, Sinh vật cổ đại theo bậc Giới → Ngành → Lớp → Bộ → Họ → Chi → Loài.
            </p>
          </div>

          <div className="space-y-2">
            {taxonomyNodes.map((node) => {
              const depth = TAXONOMY_RANKS.indexOf(node.rank);
              return (
                <div
                  key={node.id}
                  style={{ marginLeft: `${Math.max(0, depth) * 16}px` }}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono">
                        {node.rank}
                      </span>
                      <span className="font-display font-semibold text-sm text-[var(--text-primary)]">
                        {node.sigil} {node.name}
                      </span>
                      <span className="text-xs italic text-[var(--text-muted)]">
                        ({node.scientificName})
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      Môi trường: <strong>{node.biome}</strong> · Độ hiếm: <strong>{node.rarity}</strong> · {node.dietOrRole}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {node.linkedEntryId && (
                      <button
                        type="button"
                        onClick={() => onOpenEntry(node.linkedEntryId!)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border-strong)] text-[11px] text-[var(--accent)] cursor-pointer"
                      >
                        Mở hồ sơ →
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTaxonomy(node.id)}
                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {canEdit && (
            <form
              onSubmit={handleAddTaxonomy}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 pt-3 border-t border-[var(--border-subtle)]"
            >
              <select
                value={taxRank}
                onChange={(e) => setTaxRank(e.target.value as TaxonomyRank)}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              >
                {TAXONOMY_RANKS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <input
                type="text"
                required
                value={taxName}
                onChange={(e) => setTaxName(e.target.value)}
                placeholder="Tên loài / nhóm *"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                value={taxSci}
                onChange={(e) => setTaxSci(e.target.value)}
                placeholder="Tên khoa học / Latin"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                value={taxBiome}
                onChange={(e) => setTaxBiome(e.target.value)}
                placeholder="Môi trường sống (Biome)"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              />
              <select
                value={taxParentId}
                onChange={(e) => setTaxParentId(e.target.value)}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              >
                <option value="">— Nhánh gốc —</option>
                {taxonomyNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    Thuộc: {n.rank} {n.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs py-1.5 px-3 cursor-pointer"
              >
                + Thêm loài
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 6: WORLD ECONOMY & TRADE LEDGER */}
      {tab === "economy" && (
        <div className="codex-card rounded-2xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                Sổ Cái Kinh Tế, Tài Nguyên & Giá Cả Thế Giới
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Tự động quy đổi giá mặt hàng theo mọi đơn vị tiền tệ đã khai báo trong World Units V3.0.
              </p>
            </div>
            {currencyUnits.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-muted)]">Hiển thị bằng tiền tệ:</span>
                <select
                  value={activeCurrency?.id || ""}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-base)] px-2.5 py-1 text-xs text-[var(--accent)]"
                >
                  {currencyUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.symbol} {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[540px]">
              <thead>
                <tr className="border-b border-[var(--border-strong)] text-left text-[var(--accent)] font-mono uppercase">
                  <th className="py-2 px-3">Mặt hàng</th>
                  <th className="py-2 px-3">Nhóm</th>
                  <th className="py-2 px-3">Giá tham chiếu</th>
                  <th className="py-2 px-3">Độ hiếm</th>
                  <th className="py-2 px-3">Xuất xứ</th>
                  {canEdit && <th className="py-2 px-3 text-right">Xóa</th>}
                </tr>
              </thead>
              <tbody>
                {commodities.map((c) => {
                  const ratio = activeCurrency?.ratioToBase || 1;
                  const converted = (c.basePrice / ratio).toLocaleString("vi-VN", {
                    maximumFractionDigits: 2
                  });
                  return (
                    <tr key={c.id} className="border-b border-[var(--border-subtle)] hover:bg-white/5">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[var(--text-primary)]">{c.name}</div>
                        {c.tradeRouteNote && (
                          <div className="text-[11px] text-[var(--text-muted)]">{c.tradeRouteNote}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-secondary)]">{c.category}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                        {converted} {activeCurrency?.symbol || "đv"} / {c.unitLabel}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-white/8 border border-[var(--border-subtle)] text-[10px]">
                          {c.rarity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-secondary)]">{c.originLabel}</td>
                      {canEdit && (
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteCommodity(c.id)}
                            className="p-1 text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {canEdit && (
            <form
              onSubmit={handleAddCommodity}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-3 border-t border-[var(--border-subtle)]"
            >
              <input
                type="text"
                required
                value={comName}
                onChange={(e) => setComName(e.target.value)}
                placeholder="Tên hàng hóa / tài nguyên *"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              />
              <input
                type="number"
                value={comPrice}
                onChange={(e) => setComPrice(e.target.value)}
                placeholder="Giá gốc (đơn vị cơ sở)"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs font-mono"
              />
              <input
                type="text"
                value={comUnit}
                onChange={(e) => setComUnit(e.target.value)}
                placeholder="Đơn vị tính (VD: 1 thùng)"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                value={comOrigin}
                onChange={(e) => setComOrigin(e.target.value)}
                placeholder="Vùng sản xuất"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs py-1.5 px-3 cursor-pointer"
              >
                + Thêm hàng hóa
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 7: CODEX ANALYTICS & WORLD HEALTH DASHBOARD */}
      {tab === "analytics" && analytics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="codex-card rounded-2xl p-4">
              <div className="text-[11px] font-mono uppercase text-[var(--text-muted)]">Tổng hồ sơ</div>
              <div className="font-display text-2xl font-bold text-[var(--accent)] mt-1">
                {analytics.totalEntries.toLocaleString("vi-VN")}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {analytics.publishedEntries} công khai · {analytics.draftEntries} nháp
              </div>
            </div>
            <div className="codex-card rounded-2xl p-4">
              <div className="text-[11px] font-mono uppercase text-[var(--text-muted)]">Tổng số từ</div>
              <div className="font-display text-2xl font-bold text-sky-300 mt-1">
                {analytics.totalWords.toLocaleString("vi-VN")}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                ~{analytics.avgWordsPerEntry} từ / hồ sơ
              </div>
            </div>
            <div className="codex-card rounded-2xl p-4">
              <div className="text-[11px] font-mono uppercase text-[var(--text-muted)]">Độ hoàn thiện</div>
              <div className="font-display text-2xl font-bold text-emerald-300 mt-1">
                {analytics.completenessPercent}%
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Ảnh + Tóm tắt + Nội dung + Thẻ
              </div>
            </div>
            <div className="codex-card rounded-2xl p-4">
              <div className="text-[11px] font-mono uppercase text-[var(--text-muted)]">Liên kết gãy</div>
              <div className="font-display text-2xl font-bold text-rose-400 mt-1">
                {analytics.brokenLinks.length}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {analytics.orphanEntries.length} bài viết mồ côi
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar chart by Entry Type */}
            <div className="codex-card rounded-2xl p-4 space-y-3">
              <h4 className="font-display text-sm font-semibold text-[var(--accent)] flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Phân bổ theo Loại thực thể
              </h4>
              <div className="space-y-2">
                {analytics.byType.map((t) => {
                  const pct = Math.max(
                    6,
                    Math.round((t.count / Math.max(1, analytics.totalEntries)) * 100)
                  );
                  return (
                    <div key={t.typeId} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-primary)]">{t.name}</span>
                        <span className="font-mono text-[var(--text-muted)]">{t.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: t.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Broken links with 1-Click Create */}
            <div className="codex-card rounded-2xl p-4 space-y-3">
              <h4 className="font-display text-sm font-semibold text-rose-300">
                Liên kết đỏ cần bổ sung ({analytics.brokenLinks.length})
              </h4>
              {analytics.brokenLinks.length === 0 ? (
                <p className="text-xs text-emerald-300">
                  ✦ Tuyệt vời! Không phát hiện liên kết [[WikiLink]] gãy nào trong không gian này.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {analytics.brokenLinks.map((bl, i) => (
                    <div
                      key={`${bl.sourceEntryId}-${bl.missingTitle}-${i}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-rose-400/25 bg-rose-500/5 px-3 py-1.5 text-xs"
                    >
                      <div className="min-w-0 truncate">
                        <span className="text-rose-300 font-medium">[[{bl.missingTitle}]]</span>
                        <span className="text-[var(--text-muted)]"> từ {bl.sourceTitle}</span>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onCreateMissingEntry(bl.missingTitle)}
                          className="px-2 py-0.5 rounded bg-[var(--accent)] text-[#090e1c] font-semibold text-[11px] shrink-0 cursor-pointer"
                        >
                          + Tạo ngay
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
