"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Compass, GitBranch, Layers, Network, Radar, Route, Sparkles } from "lucide-react";
import type { EntryCardProjection } from "@/types/codex";
import type {
  GraphEdge,
  GraphNode,
  LineageNode,
  ShortestPathResult
} from "@/lib/graph";
import { GenealogyExplorerView } from "./GenealogyExplorerView";

interface MissingLinkCandidate {
  id: string;
  sourceId: string;
  sourceTitle: string;
  targetId: string;
  targetTitle: string;
  suggestedLabel: string;
  reason: string;
}

interface KnowledgeGraphViewProps {
  workspaceId: string;
  entries: EntryCardProjection[];
  onOpenEntry: (id: string) => void;
}

export function KnowledgeGraphView({
  workspaceId,
  entries,
  onOpenEntry
}: KnowledgeGraphViewProps) {
  const [subTab, setSubTab] = useState<"graph" | "lineage" | "genealogy">("graph");
  const [crossDomain, setCrossDomain] = useState<boolean>(true);
  const [depthLimit, setDepthLimit] = useState<number>(2);
  const [graphZoom, setGraphZoom] = useState<number>(1);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [topHubs, setTopHubs] = useState<GraphNode[]>([]);
  const [missingLinkCandidates, setMissingLinkCandidates] = useState<MissingLinkCandidate[]>([]);

  // Ego graph & path finder
  const [focusId, setFocusId] = useState("");
  const [startId, setStartId] = useState("");
  const [endId, setEndId] = useState("");
  const [pathResult, setPathResult] = useState<ShortestPathResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Lineage tree
  const [lineageRootId, setLineageRootId] = useState("");
  const [lineageTree, setLineageTree] = useState<LineageNode | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({
      workspaceId,
      mode: "graph",
      maxNodes: "120",
      crossDomain: String(crossDomain)
    });
    if (focusId) {
      params.set("focusEntryId", focusId);
      params.set("depth", String(depthLimit));
    }
    fetch(`/api/graph?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setNodes(data.graph?.nodes || []);
        setEdges(data.graph?.edges || []);
        setTotalEntries(data.graph?.totalEntriesInWorkspace || 0);
        setTruncated(Boolean(data.graph?.truncated));
        setTopHubs(data.proInsights?.topHubs || []);
        setMissingLinkCandidates(data.proInsights?.missingLinkCandidates || []);
      })
      .catch(() => {});
  }, [workspaceId, focusId, depthLimit, crossDomain]);

  useEffect(() => {
    const root = lineageRootId || entries[0]?.id;
    if (!root || subTab !== "lineage") return;
    fetch(`/api/graph?workspaceId=${workspaceId}&mode=lineage&rootId=${root}`)
      .then((r) => r.json())
      .then((data) => setLineageTree(data.tree || null))
      .catch(() => {});
  }, [workspaceId, lineageRootId, subTab, entries]);

  async function runShortestPath() {
    if (!startId || !endId) return;
    const res = await fetch(
      `/api/graph?workspaceId=${workspaceId}&mode=path&startId=${startId}&endId=${endId}`
    );
    const data = await res.json();
    setPathResult(data.path || null);
  }

  // Deterministic multi-ring radial layout (fast, zero jitter, scales cleanly)
  const layoutPositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const cx = 420;
    const cy = 240;
    const count = Math.max(1, nodes.length);
    nodes.forEach((n, idx) => {
      if (count === 1) {
        map.set(n.id, { x: cx, y: cy });
        return;
      }
      const ring = idx < 12 ? 0 : idx < 36 ? 1 : 2;
      const ringStart = ring === 0 ? 0 : ring === 1 ? 12 : 36;
      const ringCap = ring === 0 ? Math.min(count, 12) : ring === 1 ? Math.min(count - 12, 24) : count - 36;
      const ringIdx = idx - ringStart;
      const radiusX = ring === 0 ? 155 : ring === 1 ? 275 : 375;
      const radiusY = ring === 0 ? 115 : ring === 1 ? 180 : 220;
      const angle = (ringIdx / Math.max(1, ringCap)) * Math.PI * 2 - Math.PI / 2;
      map.set(n.id, {
        x: cx + Math.cos(angle) * radiusX,
        y: cy + Math.sin(angle) * radiusY
      });
    });
    return map;
  }, [nodes]);

  const highlightedNodes = useMemo(
    () => new Set(pathResult?.found ? pathResult.pathNodeIds : []),
    [pathResult]
  );

  function renderLineage(node: LineageNode, depth = 0) {
    return (
      <div key={`${node.entryId}-${depth}`} className="space-y-2">
        <div
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/70 px-3.5 py-2 text-xs hover:border-[var(--accent)] cursor-pointer"
          onClick={() => onOpenEntry(node.entryId)}
        >
          <span style={{ color: node.color }} className="text-base">
            {node.sigil}
          </span>
          <span className="font-semibold text-[var(--text-primary)]">
            {node.title}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[10px]">
            {node.relationLabel}
          </span>
        </div>
        {node.children.length > 0 && (
          <div className="pl-6 ml-4 border-l border-[var(--border-strong)] space-y-2">
            {node.children.map((c) => renderLineage(c, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  const entryIdSet = useMemo(() => new Set(entries.map((e) => e.id)), [entries]);

  return (
    <div className="space-y-4">
      <div className="codex-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
            <Network className="w-5 h-5" />
            Knowledge Graph Pro V9.0 — Đồ thị Tri thức Đa thực thể &amp; Gia phả
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Kết nối hợp nhất Hồ sơ Bách khoa, Nhân vật (CHAR), Quốc gia (KING), tìm đường nối BFS và phát hiện liên kết tiềm ẩn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {subTab === "graph" && (
            <button
              type="button"
              onClick={() => setCrossDomain((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition ${
                crossDomain
                  ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-300 font-semibold"
                  : "border-[var(--border-subtle)] text-[var(--text-muted)]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Đa Thực thể Pro (Entries + Nhân vật + Quốc gia)
            </button>
          )}

          <div className="flex rounded-xl border border-[var(--border-subtle)] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSubTab("graph")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer ${
                subTab === "graph"
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <Network className="w-3.5 h-3.5" /> Đồ thị Tri thức
            </button>
            <button
              type="button"
              onClick={() => setSubTab("genealogy")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer ${
                subTab === "genealogy"
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" /> Gia phả &amp; Triều đại
            </button>
            <button
              type="button"
              onClick={() => setSubTab("lineage")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer ${
                subTab === "lineage"
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" /> Cây Phân cấp
            </button>
          </div>
        </div>
      </div>

      {subTab === "genealogy" ? (
        <GenealogyExplorerView workspaceId={workspaceId} />
      ) : subTab === "graph" ? (
        <>
          {/* Controls: Ego Graph + Shortest Path Finder */}
          <div className="codex-card rounded-2xl p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs">
            <div className="lg:col-span-5 space-y-1">
              <label className="text-[var(--text-muted)] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                Chế độ Lân cận (Ego Graph) &amp; Thu phóng
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={focusId}
                  onChange={(e) => setFocusId(e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
                >
                  <option value="">Toàn cảnh (Top 120 nút trung tâm)</option>
                  {entries.map((e) => (
                    <option key={e.id} value={e.id}>
                      Tập trung quanh: {e.sigil} {e.title}
                    </option>
                  ))}
                </select>
                <select
                  value={depthLimit}
                  onChange={(e) => setDepthLimit(Number(e.target.value))}
                  title="Giới hạn độ sâu hiển thị"
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5 font-mono"
                >
                  <option value={1}>Độ sâu 1</option>
                  <option value={2}>Độ sâu 2</option>
                  <option value={3}>Độ sâu 3</option>
                </select>
                <button
                  type="button"
                  onClick={() => setGraphZoom((z) => (z >= 1.5 ? 0.75 : +(z + 0.25).toFixed(2)))}
                  title="Thu phóng đồ thị"
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] font-mono hover:border-[var(--accent)] cursor-pointer"
                >
                  {Math.round(graphZoom * 100)}%
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-1">
              <label className="text-[var(--text-muted)] flex items-center gap-1">
                <Route className="w-3.5 h-3.5 text-[var(--accent)]" />
                Tìm đường nối ngắn nhất giữa 2 hồ sơ (BFS)
              </label>
              <div className="flex flex-wrap gap-2">
                <select
                  value={startId}
                  onChange={(e) => setStartId(e.target.value)}
                  className="flex-1 min-w-[140px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
                >
                  <option value="">Hồ sơ bắt đầu...</option>
                  {entries.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.sigil} {e.title}
                    </option>
                  ))}
                </select>
                <select
                  value={endId}
                  onChange={(e) => setEndId(e.target.value)}
                  className="flex-1 min-w-[140px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
                >
                  <option value="">Hồ sơ đích...</option>
                  {entries.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.sigil} {e.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={runShortestPath}
                  disabled={!startId || !endId}
                  className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Tìm đường nối
                </button>
              </div>
            </div>
          </div>

          {pathResult && (
            <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] px-4 py-2.5 text-xs">
              {pathResult.found ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <strong className="text-[var(--accent)]">
                    Đường nối ngắn nhất ({pathResult.steps.length} bước):
                  </strong>
                  {pathResult.pathNodeIds.map((nid, i) => {
                    const n = nodes.find((x) => x.id === nid);
                    const step = pathResult.steps[i];
                    return (
                      <React.Fragment key={nid}>
                        <button
                          type="button"
                          onClick={() => onOpenEntry(nid)}
                          className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] font-medium hover:text-[var(--accent)] cursor-pointer"
                        >
                          {n?.sigil} {n?.title || nid}
                        </button>
                        {step && (
                          <span className="text-[var(--text-muted)]">
                            —({step.label})→
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <span className="text-rose-300">
                  Không tìm thấy đường liên kết nào giữa 2 hồ sơ này.
                </span>
              )}
            </div>
          )}

          {/* Interactive SVG Graph Canvas */}
          <div className="codex-card rounded-2xl p-3 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[var(--text-muted)] px-2 pb-2">
              <span>
                Đang hiển thị {nodes.length}/{totalEntries} thực thể · {edges.length} liên kết
                {truncated && " (Đã tối ưu giới hạn Top-120 nút)"}
              </span>
              <span className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> Nhân vật
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Quốc gia / Hồ sơ
                </span>
              </span>
            </div>

            <svg
              viewBox="0 0 840 480"
              className="w-full h-[380px] sm:h-[460px] rounded-xl bg-[var(--bg-base)]/80 border border-[var(--border-subtle)]"
            >
              <g
                transform={`translate(420, 240) scale(${graphZoom}) translate(-420, -240)`}
              >
                {/* Edges */}
                {edges.map((edge) => {
                  const p1 = layoutPositions.get(edge.source);
                  const p2 = layoutPositions.get(edge.target);
                  if (!p1 || !p2) return null;
                  const isPathEdge =
                    highlightedNodes.has(edge.source) &&
                    highlightedNodes.has(edge.target);
                  return (
                    <g key={edge.id}>
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke={
                          isPathEdge
                            ? "var(--accent)"
                            : edge.kind === "relation"
                            ? "rgba(212,175,55,0.42)"
                            : "rgba(148,163,184,0.28)"
                        }
                        strokeWidth={isPathEdge ? 3 : edge.kind === "relation" ? 1.8 : 1.1}
                        strokeDasharray={edge.kind === "wikilink" ? "4 4" : undefined}
                      />
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                  const pos = layoutPositions.get(node.id);
                  if (!pos) return null;
                  const isHighlighted = highlightedNodes.has(node.id);
                  const isSelected = selectedNode?.id === node.id;
                  const r = Math.min(26, 15 + node.degree * 1.4);
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer"
                    >
                      {(isHighlighted || isSelected) && (
                        <circle
                          r={r + 7}
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth={2}
                          opacity={0.75}
                        />
                      )}
                      <circle
                        r={r}
                        fill="var(--bg-elevated)"
                        stroke={node.color}
                        strokeWidth={2}
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={node.color}
                        fontSize="13"
                      >
                        {node.sigil}
                      </text>
                      <text
                        y={r + 14}
                        textAnchor="middle"
                        fill="var(--text-primary)"
                        fontSize="11"
                        fontWeight={isHighlighted ? "700" : "500"}
                      >
                        {node.title.length > 22
                          ? node.title.slice(0, 21) + "…"
                          : node.title}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {selectedNode && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2.5 text-xs">
                <div>
                  <span style={{ color: selectedNode.color }} className="mr-1.5">
                    {selectedNode.sigil}
                  </span>
                  <strong className="text-sm">{selectedNode.title}</strong>
                  <span className="ml-2 font-mono text-[var(--text-muted)]">
                    ({selectedNode.id} · {selectedNode.degree} liên kết trực tiếp)
                  </span>
                </div>
                <div className="flex gap-2">
                  {entryIdSet.has(selectedNode.id) && (
                    <>
                      <button
                        type="button"
                        onClick={() => setFocusId(selectedNode.id)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent)] cursor-pointer"
                      >
                        Xem vùng lân cận
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenEntry(selectedNode.id)}
                        className="px-3 py-1 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer"
                      >
                        Mở hồ sơ →
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Knowledge Graph Pro Insights: Top Hubs + Missing-Link Candidate Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="codex-card rounded-2xl p-4 space-y-2.5 text-xs">
              <h3 className="font-display text-sm font-semibold text-[var(--accent)] flex items-center gap-1.5">
                <Compass className="w-4 h-4" /> Nút Trung tâm Tri thức (Top Knowledge Hubs)
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {topHubs.map((hub) => (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => {
                      setSelectedNode(hub);
                      if (entryIdSet.has(hub.id)) onOpenEntry(hub.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 hover:border-[var(--accent)] cursor-pointer"
                  >
                    <span style={{ color: hub.color }}>{hub.sigil}</span>
                    <span className="font-medium text-[var(--text-primary)]">{hub.title}</span>
                    <span className="font-mono text-[10px] text-[var(--accent)]">
                      {hub.degree} liên kết
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="codex-card rounded-2xl p-4 space-y-2.5 text-xs">
              <h3 className="font-display text-sm font-semibold text-cyan-300 flex items-center gap-1.5">
                <Radar className="w-4 h-4" /> Radar Đề xuất Liên kết Tiềm ẩn ({missingLinkCandidates.length})
              </h3>
              {missingLinkCandidates.length === 0 ? (
                <p className="text-[var(--text-muted)]">
                  Bật chế độ Đa Thực thể Pro để quét các cặp thực thể có nhắc tên nhau nhưng chưa nối quan hệ chính thức.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto codex-scrollbar pr-1">
                  {missingLinkCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-2 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate">
                          {cand.sourceTitle} <span className="text-cyan-300">→ {cand.suggestedLabel} →</span> {cand.targetTitle}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate">
                          {cand.reason}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="codex-card rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="text-[var(--text-muted)]">Chọn hồ sơ gốc:</label>
            <select
              value={lineageRootId || entries[0]?.id || ""}
              onChange={(e) => setLineageRootId(e.target.value)}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5"
            >
              {entries.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.sigil} {e.title}
                </option>
              ))}
            </select>
          </div>
          {lineageTree ? (
            <div className="overflow-x-auto py-2">{renderLineage(lineageTree)}</div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              Chưa có dữ liệu quan hệ phân cấp cho hồ sơ này.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
