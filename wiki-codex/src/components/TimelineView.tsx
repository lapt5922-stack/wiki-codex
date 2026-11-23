"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Edit3,
  Hourglass,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import type { EntryCardProjection, TimelineEvent } from "@/types/codex";
import { matchesVietnameseQuery } from "@/lib/vietnamese";
import { DraggableScrollArea } from "./DraggableScrollArea";
import { IconSigilPicker } from "./IconSigilPicker";

interface TimelineViewProps {
  workspaceId: string;
  entries: EntryCardProjection[];
  canEdit: boolean;
  onOpenEntry: (id: string) => void;
}

const EVENT_TYPE_LABELS: Record<NonNullable<TimelineEvent["eventType"]>, string> = {
  political: "Chính trị",
  military: "Quân sự / Chiến dịch",
  treaty: "Hiệp ước / Ngoại giao",
  cultural: "Văn hóa / Tôn giáo",
  discovery: "Khám phá / Khoa học",
  disaster: "Thiên tai / Biến cố",
  dynastic: "Triều đại / Kế vị"
};

function splitCsv(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function TimelineView({
  workspaceId,
  entries,
  canEdit,
  onOpenEntry
}: TimelineViewProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [eraFilter, setEraFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);

  // 15 Living History Fields
  const [title, setTitle] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [endDateLabel, setEndDateLabel] = useState("");
  const [sortYear, setSortYear] = useState(100);
  const [era, setEra] = useState("Kỷ Nguyên Ánh Sao");
  const [eventType, setEventType] =
    useState<NonNullable<TimelineEvent["eventType"]>>("political");
  const [locationName, setLocationName] = useState("");
  const [linkedCharsText, setLinkedCharsText] = useState("");
  const [linkedKingdomsText, setLinkedKingdomsText] = useState("");
  const [linkedOrgsText, setLinkedOrgsText] = useState("");
  const [summary, setSummary] = useState("");
  const [causes, setCauses] = useState("");
  const [developments, setDevelopments] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [impacts, setImpacts] = useState("");
  const [sourcesText, setSourcesText] = useState("");
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
    void loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const eras = useMemo(
    () => Array.from(new Set(events.map((e) => e.era).filter(Boolean))),
    [events]
  );

  const visible = useMemo(() => {
    return events.filter((ev) => {
      if (eraFilter && ev.era !== eraFilter) return false;
      if (typeFilter && (ev.eventType || "political") !== typeFilter) return false;
      if (searchQuery.trim()) {
        const hay = [
          ev.id,
          ev.title,
          ev.dateLabel,
          ev.endDateLabel || "",
          String(ev.sortYear),
          ev.era,
          ev.locationName || "",
          ev.summary,
          ev.causes || "",
          ev.impacts || "",
          ...(ev.linkedCharacterIds || []),
          ...(ev.linkedKingdomIds || []),
          ...(ev.linkedOrganizations || [])
        ].join(" ");
        if (!matchesVietnameseQuery(hay, searchQuery)) return false;
      }
      return true;
    });
  }, [events, eraFilter, typeFilter, searchQuery]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreate() {
    setEditing(null);
    setTitle("");
    setDateLabel("");
    setEndDateLabel("");
    setSortYear(100);
    setEra(eras[0] || "Kỷ Nguyên Ánh Sao");
    setEventType("political");
    setLocationName("");
    setLinkedCharsText("");
    setLinkedKingdomsText("");
    setLinkedOrgsText("");
    setSummary("");
    setCauses("");
    setDevelopments("");
    setOutcomes("");
    setImpacts("");
    setSourcesText("");
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
    setEndDateLabel(ev.endDateLabel || "");
    setSortYear(ev.sortYear);
    setEra(ev.era);
    setEventType(ev.eventType || "political");
    setLocationName(ev.locationName || "");
    setLinkedCharsText((ev.linkedCharacterIds || []).join(", "));
    setLinkedKingdomsText((ev.linkedKingdomIds || []).join(", "));
    setLinkedOrgsText((ev.linkedOrganizations || []).join(", "));
    setSummary(ev.summary);
    setCauses(ev.causes || "");
    setDevelopments(ev.developments || "");
    setOutcomes(ev.outcomes || "");
    setImpacts(ev.impacts || "");
    setSourcesText((ev.sources || []).join(", "));
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
        endDateLabel,
        sortYear,
        era,
        eventType,
        locationName,
        linkedCharacterIds: splitCsv(linkedCharsText),
        linkedKingdomIds: splitCsv(linkedKingdomsText),
        linkedOrganizations: splitCsv(linkedOrgsText),
        summary,
        causes,
        developments,
        outcomes,
        impacts,
        sources: splitCsv(sourcesText),
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
    if (!window.confirm("Xóa sự kiện lịch sử này khỏi Biên niên sử?")) return;
    await fetch(`/api/timeline?id=${id}`, { method: "DELETE" });
    await loadEvents();
  }

  const entryMap = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);

  return (
    <div className="space-y-4">
      {/* Header & Multi-Dimensional Filters */}
      <div className="codex-card rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[var(--accent)] flex items-center gap-2">
              <Hourglass className="w-5 h-5" /> Living History — Biên niên sử &amp; Ảnh hưởng Lịch sử ({visible.length})
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Theo dõi sự kiện theo trình tự thời gian đầy đủ Nguyên nhân → Diễn biến → Kết quả → Ảnh hưởng &amp; Nguồn tham khảo.
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={openCreate}
              className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm Sự kiện Lịch sử
            </button>
          )}
        </div>

        {/* Search & Type Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc theo năm, quốc gia (KING-ID), nhân vật (CHAR-ID), tổ chức, địa điểm..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] text-xs outline-none focus:border-[var(--accent)]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
          >
            <option value="">Tất cả loại sự kiện</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([k, lbl]) => (
              <option key={k} value={k}>
                {lbl}
              </option>
            ))}
          </select>
        </div>

        {/* Era Ribbon */}
        <DraggableScrollArea ariaLabel="Lọc theo thời đại" innerClassName="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEraFilter("")}
            className={`shrink-0 min-h-[34px] px-3 py-1 rounded-xl text-xs border cursor-pointer ${
              !eraFilter
                ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c] font-bold"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
            }`}
          >
            Mọi thời đại ({events.length})
          </button>
          {eras.map((er) => (
            <button
              key={er}
              type="button"
              onClick={() => setEraFilter(eraFilter === er ? "" : er)}
              className={`shrink-0 min-h-[34px] px-3 py-1 rounded-xl text-xs border cursor-pointer ${
                eraFilter === er
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c] font-bold"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              {er}
            </button>
          ))}
        </DraggableScrollArea>
      </div>

      {/* Chronological Event Stream */}
      {visible.length === 0 ? (
        <div className="codex-card rounded-2xl p-10 text-center text-xs text-[var(--text-muted)]">
          Chưa có sự kiện nào khớp bộ lọc thời gian.
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-4 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border-strong)]">
          {visible.map((ev) => {
            const expanded = expandedIds.has(ev.id);
            const hasDeepDetails = Boolean(
              ev.causes || ev.developments || ev.outcomes || ev.impacts || (ev.sources && ev.sources.length > 0)
            );
            return (
              <article
                key={ev.id}
                className="relative codex-card rounded-2xl p-4 sm:p-5 space-y-2.5 text-xs"
              >
                <span
                  className="absolute -left-[25px] sm:-left-[29px] top-5 w-4 h-4 rounded-full border-2 border-[var(--bg-base)] shadow"
                  style={{ backgroundColor: ev.color || "#D4AF37" }}
                />

                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                        {ev.dateLabel}
                        {ev.endDateLabel ? ` → ${ev.endDateLabel}` : ""}
                      </span>
                      <span className="px-2 py-0.5 rounded-full border border-[var(--border-subtle)] text-[var(--text-muted)]">
                        {ev.era}
                      </span>
                      {ev.eventType && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-500/35">
                          {EVENT_TYPE_LABELS[ev.eventType]}
                        </span>
                      )}
                      {ev.locationName && (
                        <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                          <MapPin className="w-3 h-3 text-emerald-400" /> {ev.locationName}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)]">
                      {ev.sigil} {ev.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {hasDeepDetails && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(ev.id)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] text-[11px] inline-flex items-center gap-1 cursor-pointer hover:border-[var(--accent)]"
                      >
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {expanded ? "Thu gọn" : "Phân tích & Ảnh hưởng"}
                      </button>
                    )}
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(ev)}
                          className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent)] cursor-pointer"
                          title="Chỉnh sửa sự kiện"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(ev.id)}
                          className="p-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                          title="Xóa sự kiện"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {ev.summary && (
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {ev.summary}
                  </p>
                )}

                {/* Linked Entities & Historical Impact Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {ev.entryIds.map((eid) => {
                    const ent = entryMap.get(eid);
                    if (!ent) return null;
                    return (
                      <button
                        key={eid}
                        type="button"
                        onClick={() => onOpenEntry(eid)}
                        className="px-2 py-0.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 hover:border-[var(--accent)] text-[11px] cursor-pointer"
                      >
                        {ent.sigil} {ent.title}
                      </button>
                    );
                  })}
                  {(ev.linkedKingdomIds || []).map((kid) => (
                    <span key={kid} className="font-mono text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-200">
                      👑 {kid}
                    </span>
                  ))}
                  {(ev.linkedCharacterIds || []).map((cid) => (
                    <span key={cid} className="font-mono text-[10px] px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/35 text-cyan-200">
                      👤 {cid}
                    </span>
                  ))}
                  {(ev.linkedOrganizations || []).map((org) => (
                    <span key={org} className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/35 text-purple-200">
                      🏛 {org}
                    </span>
                  ))}
                </div>

                {/* Expanded Historical Analysis & Sources */}
                {expanded && hasDeepDetails && (
                  <div className="mt-2 pt-3 border-t border-[var(--border-subtle)] grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {ev.causes && (
                      <div className="rounded-xl bg-[var(--bg-base)]/60 border border-[var(--border-subtle)] p-2.5">
                        <div className="text-[10px] font-bold uppercase text-amber-300 mb-1">Nguyên nhân</div>
                        <p className="text-[11px] text-[var(--text-secondary)]">{ev.causes}</p>
                      </div>
                    )}
                    {ev.developments && (
                      <div className="rounded-xl bg-[var(--bg-base)]/60 border border-[var(--border-subtle)] p-2.5">
                        <div className="text-[10px] font-bold uppercase text-cyan-300 mb-1">Diễn biến</div>
                        <p className="text-[11px] text-[var(--text-secondary)]">{ev.developments}</p>
                      </div>
                    )}
                    {ev.outcomes && (
                      <div className="rounded-xl bg-[var(--bg-base)]/60 border border-[var(--border-subtle)] p-2.5">
                        <div className="text-[10px] font-bold uppercase text-emerald-300 mb-1">Kết quả</div>
                        <p className="text-[11px] text-[var(--text-secondary)]">{ev.outcomes}</p>
                      </div>
                    )}
                    {ev.impacts && (
                      <div className="rounded-xl bg-[var(--bg-base)]/60 border border-purple-500/30 p-2.5">
                        <div className="text-[10px] font-bold uppercase text-purple-300 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Ảnh hưởng Lịch sử (Historical Impact)
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)]">{ev.impacts}</p>
                      </div>
                    )}
                    {ev.sources && ev.sources.length > 0 && (
                      <div className="md:col-span-2 rounded-xl bg-white/5 px-3 py-2 text-[11px] text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
                        <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <strong>Nguồn tham khảo:</strong> {ev.sources.join(" · ")}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Full 15-Field Create / Edit Event Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setModalOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
            className="w-full max-w-3xl max-h-[94vh] rounded-t-2xl sm:rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl flex flex-col overflow-hidden text-xs"
          >
            <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[var(--accent)]">
                {editing ? "Chỉnh sửa Sự kiện Lịch sử" : "Ghi nhận Sự kiện Lịch sử Mới (15 Trường)"}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 codex-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên sự kiện *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
                <select value={eventType} onChange={(e) => setEventType(e.target.value as NonNullable<TimelineEvent["eventType"]>)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2">
                  {Object.entries(EVENT_TYPE_LABELS).map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
                </select>
                <input required value={dateLabel} onChange={(e) => setDateLabel(e.target.value)} placeholder="Thời điểm bắt đầu * (VD: Năm 412)" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
                <input value={endDateLabel} onChange={(e) => setEndDateLabel(e.target.value)} placeholder="Thời điểm kết thúc (VD: Năm 415)" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
                <input type="number" value={sortYear} onChange={(e) => setSortYear(Number(e.target.value))} placeholder="Năm sắp xếp (số)" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
                <input value={era} onChange={(e) => setEra(e.target.value)} placeholder="Thời đại / Kỷ nguyên" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
                <input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Địa điểm diễn ra" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
                <input value={linkedKingdomsText} onChange={(e) => setLinkedKingdomsText(e.target.value)} placeholder="Quốc gia liên quan (KING-000001, ...)" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
                <input value={linkedCharsText} onChange={(e) => setLinkedCharsText(e.target.value)} placeholder="Nhân vật liên quan (CHAR-000001, ...)" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
                <input value={linkedOrgsText} onChange={(e) => setLinkedOrgsText(e.target.value)} placeholder="Tổ chức liên quan (phân cách dấu phẩy)" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
              </div>

              <textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Mô tả tóm tắt sự kiện..." className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <textarea rows={2} value={causes} onChange={(e) => setCauses(e.target.value)} placeholder="Nguyên nhân dẫn đến sự kiện..." className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
                <textarea rows={2} value={developments} onChange={(e) => setDevelopments(e.target.value)} placeholder="Diễn biến chính..." className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
                <textarea rows={2} value={outcomes} onChange={(e) => setOutcomes(e.target.value)} placeholder="Kết quả trực tiếp..." className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
                <textarea rows={2} value={impacts} onChange={(e) => setImpacts(e.target.value)} placeholder="Ảnh hưởng lịch sử lâu dài (Historical Impact)..." className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
              </div>
              <input value={sourcesText} onChange={(e) => setSourcesText(e.target.value)} placeholder="Nguồn tham khảo (phân cách dấu phẩy)" className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />

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
            </div>

            <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] cursor-pointer">
                Hủy
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold cursor-pointer">
                Lưu Sự kiện
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
