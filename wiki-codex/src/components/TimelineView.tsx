"use client";

import React, { useEffect, useState } from "react";
import { Edit3, Hourglass, Plus, Trash2, X } from "lucide-react";
import type { EntryCardProjection, TimelineEvent } from "@/types/codex";
import { IconSigilPicker } from "./IconSigilPicker";

interface TimelineViewProps {
  workspaceId: string;
  entries: EntryCardProjection[];
  canEdit: boolean;
  onOpenEntry: (id: string) => void;
}

export function TimelineView({
  workspaceId,
  entries,
  canEdit,
  onOpenEntry
}: TimelineViewProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [eraFilter, setEraFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);

  const [title, setTitle] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [sortYear, setSortYear] = useState(100);
  const [era, setEra] = useState("Kỷ Nguyên Ánh Sao");
  const [summary, setSummary] = useState("");
  const [icon, setIcon] = useState("Hourglass");
  const [sigil, setSigil] = useState("⧗");
  const [color, setColor] = useState("#D4AF37");
  const [entryIds, setEntryIds] = useState<string[]>([]);

  async function loadEvents() {
    const res = await fetch(`/api/timeline?workspaceId=${workspaceId}`);
    const data = await res.json();
    setEvents(data.events || []);
  }

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const eras = Array.from(new Set(events.map((e) => e.era).filter(Boolean)));
  const visible = eraFilter
    ? events.filter((e) => e.era === eraFilter)
    : events;

  function openCreate() {
    setEditing(null);
    setTitle("");
    setDateLabel("");
    setSortYear(100);
    setEra(eras[0] || "Kỷ Nguyên Ánh Sao");
    setSummary("");
    setIcon("Hourglass");
    setSigil("⧗");
    setColor("#D4AF37");
    setEntryIds([]);
    setModalOpen(true);
  }

  function openEdit(ev: TimelineEvent) {
    setEditing(ev);
    setTitle(ev.title);
    setDateLabel(ev.dateLabel);
    setSortYear(ev.sortYear);
    setEra(ev.era);
    setSummary(ev.summary);
    setIcon(ev.icon);
    setSigil(ev.sigil);
    setColor(ev.color);
    setEntryIds([...ev.entryIds]);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/timeline", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing?.id,
        workspaceId,
        title,
        dateLabel,
        sortYear,
        era,
        summary,
        icon,
        sigil,
        color,
        entryIds
      })
    });
    setModalOpen(false);
    await loadEvents();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa mốc sự kiện này khỏi Biên niên sử?")) return;
    await fetch(`/api/timeline?id=${id}`, { method: "DELETE" });
    await loadEvents();
  }

  return (
    <div className="space-y-4">
      <div className="codex-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
            <Hourglass className="w-5 h-5" />
            Biên niên sử & Dòng thời gian (Timeline)
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Ghi nhận các mốc lịch sử, kỷ nguyên hình thành và biến chuyển của từng vương quốc, nhân vật.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={eraFilter}
            onChange={(e) => setEraFilter(e.target.value)}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5 text-xs"
          >
            <option value="">Tất cả Kỷ nguyên ({events.length})</option>
            {eras.map((er) => (
              <option key={er} value={er}>
                {er}
              </option>
            ))}
          </select>

          {canEdit && (
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm mốc sự kiện
            </button>
          )}
        </div>
      </div>

      {/* Vertical Chronicle Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-4 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-[var(--accent)] before:via-[var(--border-strong)] before:to-transparent">
        {visible.length === 0 ? (
          <div className="codex-card rounded-2xl p-8 text-center text-xs text-[var(--text-muted)]">
            Chưa có sự kiện biên niên sử nào.
          </div>
        ) : (
          visible.map((ev) => (
            <div key={ev.id} className="relative">
              <div
                className="absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs bg-[var(--bg-base)] shadow-md"
                style={{ borderColor: ev.color, color: ev.color }}
              >
                {ev.sigil}
              </div>

              <div className="codex-card rounded-2xl p-4 sm:p-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                      style={{
                        borderColor: `${ev.color}55`,
                        color: ev.color,
                        backgroundColor: `${ev.color}18`
                      }}
                    >
                      {ev.dateLabel}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {ev.era}
                    </span>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(ev)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ev.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  {ev.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {ev.summary}
                </p>

                {ev.entryIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {ev.entryIds.map((eid) => {
                      const found = entries.find((e) => e.id === eid);
                      if (!found) return null;
                      return (
                        <button
                          key={eid}
                          type="button"
                          onClick={() => onOpenEntry(eid)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 hover:border-[var(--accent)] text-[var(--accent)] cursor-pointer"
                        >
                          {found.sigil} {found.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Timeline Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-[var(--accent)]">
                {editing ? "✦ Sửa mốc Biên niên sử" : "✦ Thêm mốc Biên niên sử"}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên sự kiện lịch sử *"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm"
            />

            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
                placeholder="Nhãn thời gian (VD: Năm 305)"
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
              />
              <input
                type="number"
                value={sortYear}
                onChange={(e) => setSortYear(Number(e.target.value))}
                placeholder="Năm sắp xếp (hỗ trợ số âm TCN)"
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs font-mono"
              />
            </div>

            <input
              type="text"
              value={era}
              onChange={(e) => setEra(e.target.value)}
              placeholder="Tên Kỷ nguyên / Thời kỳ"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
            />

            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Diễn biến và ý nghĩa lịch sử..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 text-xs"
            />

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Hồ sơ liên quan
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60">
                {entries.map((ent) => {
                  const active = entryIds.includes(ent.id);
                  return (
                    <button
                      key={ent.id}
                      type="button"
                      onClick={() =>
                        setEntryIds((prev) =>
                          active ? prev.filter((x) => x !== ent.id) : [...prev, ent.id]
                        )
                      }
                      className={`text-[11px] px-2 py-1 rounded-lg border cursor-pointer ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                      }`}
                    >
                      {ent.sigil} {ent.title}
                    </button>
                  );
                })}
              </div>
            </div>

            <IconSigilPicker
              icon={icon}
              sigil={sigil}
              color={color}
              onChange={(n) => {
                setIcon(n.icon);
                setSigil(n.sigil);
                setColor(n.color);
              }}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
              >
                Lưu sự kiện
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
