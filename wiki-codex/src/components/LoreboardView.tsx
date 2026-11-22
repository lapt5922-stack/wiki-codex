"use client";

import React, { useEffect, useRef, useState } from "react";
import { Link2, Plus, Save, StickyNote, Trash2 } from "lucide-react";
import type { EntryCardProjection, Loreboard, LoreboardNode } from "@/types/codex";

interface LoreboardViewProps {
  workspaceId: string;
  loreboards: Loreboard[];
  entries: EntryCardProjection[];
  canEdit: boolean;
  onOpenEntry: (id: string) => void;
  onRefresh: () => Promise<void>;
}

export function LoreboardView({
  workspaceId,
  loreboards,
  entries,
  canEdit,
  onOpenEntry,
  onRefresh
}: LoreboardViewProps) {
  const [selectedId, setSelectedId] = useState(loreboards[0]?.id || "");
  const activeBoard = loreboards.find((b) => b.id === selectedId) ?? loreboards[0];

  const [nodes, setNodes] = useState<LoreboardNode[]>(activeBoard?.nodes || []);
  const [edges, setEdges] = useState(activeBoard?.edges || []);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeBoard) {
      setNodes([]);
      setEdges([]);
      return;
    }
    if (selectedId !== activeBoard.id) {
      setSelectedId(activeBoard.id);
    }
    setNodes(activeBoard.nodes || []);
    setEdges(activeBoard.edges || []);
  }, [activeBoard?.id, activeBoard?.updatedAt, workspaceId]);

  // New item forms
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [entryPickId, setEntryPickId] = useState("");
  const [edgeFrom, setEdgeFrom] = useState("");
  const [edgeTo, setEdgeTo] = useState("");
  const [edgeLabel, setEdgeLabel] = useState("Liên kết");
  const [newBoardName, setNewBoardName] = useState("");
  const [saving, setSaving] = useState(false);

  function selectBoard(board: Loreboard) {
    setSelectedId(board.id);
    setNodes(board.nodes);
    setEdges(board.edges);
  }

  async function saveBoard(nextNodes = nodes, nextEdges = edges) {
    if (!activeBoard || !canEdit) return;
    setSaving(true);
    try {
      await fetch("/api/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "loreboard",
          data: {
            id: activeBoard.id,
            workspaceId,
            name: activeBoard.name,
            description: activeBoard.description,
            nodes: nextNodes,
            edges: nextEdges
          }
        })
      });
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function createBoard() {
    if (!newBoardName.trim()) return;
    const res = await fetch("/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "loreboard",
        data: {
          workspaceId,
          name: newBoardName.trim(),
          description: "Bảng ghim ý tưởng tự do",
          nodes: [],
          edges: []
        }
      })
    });
    const data = await res.json();
    setNewBoardName("");
    await onRefresh();
    if (data.item) selectBoard(data.item);
  }

  function addNoteNode() {
    if (!noteTitle.trim()) return;
    const next: LoreboardNode[] = [
      ...nodes,
      {
        id: `ln-${Date.now()}`,
        kind: "note",
        title: noteTitle.trim(),
        content: noteContent.trim() || "Ghi chú nghiên cứu...",
        x: 80 + (nodes.length * 35) % 400,
        y: 80 + (nodes.length * 30) % 240,
        width: 220,
        color: "#A78BFA",
        sigil: "✦"
      }
    ];
    setNodes(next);
    setNoteTitle("");
    setNoteContent("");
    saveBoard(next, edges);
  }

  function addEntryNode() {
    const ent = entries.find((e) => e.id === entryPickId);
    if (!ent) return;
    const next: LoreboardNode[] = [
      ...nodes,
      {
        id: `ln-${Date.now()}`,
        kind: "entry",
        title: ent.title,
        content: ent.summary || ent.subtitle,
        entryId: ent.id,
        x: 120 + (nodes.length * 40) % 450,
        y: 90 + (nodes.length * 35) % 240,
        width: 230,
        color: "#D4AF37",
        sigil: ent.sigil || "✦"
      }
    ];
    setNodes(next);
    setEntryPickId("");
    saveBoard(next, edges);
  }

  function addEdge() {
    if (!edgeFrom || !edgeTo || edgeFrom === edgeTo) return;
    const nextEdges = [
      ...edges,
      {
        id: `le-${Date.now()}`,
        fromNodeId: edgeFrom,
        toNodeId: edgeTo,
        label: edgeLabel.trim() || "Liên kết",
        color: "#D4AF37"
      }
    ];
    setEdges(nextEdges);
    saveBoard(nodes, nextEdges);
  }

  function removeNode(id: string) {
    const nextNodes = nodes.filter((n) => n.id !== id);
    const nextEdges = edges.filter((e) => e.fromNodeId !== id && e.toNodeId !== id);
    setNodes(nextNodes);
    setEdges(nextEdges);
    saveBoard(nextNodes, nextEdges);
  }

  function onPointerDown(e: React.PointerEvent, node: LoreboardNode) {
    if (!canEdit || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y
    };
    setDraggingId(node.id);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(10, Math.round(e.clientX - rect.left - dragOffset.current.x));
    const y = Math.max(10, Math.round(e.clientY - rect.top - dragOffset.current.y));
    setNodes((prev) => prev.map((n) => (n.id === draggingId ? { ...n, x, y } : n)));
  }

  function onPointerUp() {
    if (draggingId) {
      setDraggingId(null);
      saveBoard(nodes, edges);
    }
  }

  return (
    <div className="space-y-4">
      <div className="codex-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
            <StickyNote className="w-5 h-5" />
            Arcane Loreboard — Bảng Ghim Ý Tưởng Kéo-Thả
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Kéo-thả tự do thẻ hồ sơ Codex, ghi chú dán và vẽ dây nối quan hệ (bấm đúp thẻ hồ sơ để mở bài).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeBoard?.id || ""}
            onChange={(e) => {
              const found = loreboards.find((b) => b.id === e.target.value);
              if (found) selectBoard(found);
            }}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5 text-xs"
          >
            {loreboards.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {canEdit && (
            <>
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Tên bảng mới..."
                className="w-36 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              />
              <button type="button" onClick={createBoard} className="px-2.5 py-1.5 rounded-xl border border-[var(--border-strong)] text-xs text-[var(--accent)] cursor-pointer">
                + Bảng
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => saveBoard()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> {saving ? "Đang lưu..." : "Lưu bảng"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Card / Note / Connection Toolbar */}
      {canEdit && activeBoard && (
        <div className="codex-card rounded-2xl p-3 grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
          <div className="flex gap-1.5">
            <select value={entryPickId} onChange={(e) => setEntryPickId(e.target.value)} className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5">
              <option value="">Ghim Hồ sơ Codex lên bảng...</option>
              {entries.map((e) => (
                <option key={e.id} value={e.id}>{e.sigil} {e.title}</option>
              ))}
            </select>
            <button type="button" onClick={addEntryNode} className="px-2.5 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] font-medium cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-1.5">
            <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Tiêu đề ghi chú..." className="w-32 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5" />
            <input type="text" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Nội dung..." className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5" />
            <button type="button" onClick={addNoteNode} className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 cursor-pointer">
              + Ghi chú
            </button>
          </div>

          <div className="flex gap-1.5">
            <select value={edgeFrom} onChange={(e) => setEdgeFrom(e.target.value)} className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-1.5 py-1.5">
              <option value="">Từ thẻ...</option>
              {nodes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
            </select>
            <select value={edgeTo} onChange={(e) => setEdgeTo(e.target.value)} className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-1.5 py-1.5">
              <option value="">Tới thẻ...</option>
              {nodes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
            </select>
            <input type="text" value={edgeLabel} onChange={(e) => setEdgeLabel(e.target.value)} className="w-20 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-1.5 py-1.5" />
            <button type="button" onClick={addEdge} className="px-2 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer" title="Nối dây">
              <Link2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Canvas */}
      <div className="codex-card rounded-2xl p-2 overflow-auto">
        <div
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="relative min-w-[900px] h-[520px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/80 select-none overflow-hidden"
          style={{
            backgroundImage: "radial-gradient(rgba(212,175,55,0.16) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        >
          {/* SVG Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {edges.map((edge) => {
              const a = nodes.find((n) => n.id === edge.fromNodeId);
              const b = nodes.find((n) => n.id === edge.toNodeId);
              if (!a || !b) return null;
              const x1 = a.x + a.width / 2;
              const y1 = a.y + 42;
              const x2 = b.x + b.width / 2;
              const y2 = b.y + 42;
              return (
                <g key={edge.id}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={edge.color || "#D4AF37"} strokeWidth={2} strokeDasharray="5 4" opacity={0.75} />
                  <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle" fill="#D4AF37" fontSize="11" fontFamily="monospace">
                    {edge.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Draggable Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              onPointerDown={(e) => onPointerDown(e, node)}
              onDoubleClick={() => node.entryId && onOpenEntry(node.entryId)}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                borderColor: `${node.color}88`
              }}
              className={`absolute rounded-xl border bg-[var(--bg-elevated)]/95 p-3 shadow-xl space-y-1 ${
                canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-display font-bold truncate" style={{ color: node.color }}>
                  {node.sigil} {node.title}
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNode(node.id);
                    }}
                    className="text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                {node.content}
              </p>
              {node.entryId && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEntry(node.entryId!);
                  }}
                  className="text-[10px] font-mono text-[var(--accent)] hover:underline cursor-pointer"
                >
                  Mở Hồ sơ →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
