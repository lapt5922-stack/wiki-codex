"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Columns3,
  FileText,
  Landmark,
  Plus,
  Search,
  Shield,
  Trash2,
  X
} from "lucide-react";
import type {
  EventPerspectiveRecord,
  HistoricalDocType,
  HistoricalDocumentRecord,
  PerspectiveKind
} from "@/db/archives-repo";
import type { UniversalRelationRecord } from "@/db/universal-relations-repo";
import { DirectImageUploadField } from "./DirectImageUploadField";
import { ImageLightboxModal } from "./ImageLightboxModal";

interface HistoricalPerspectiveArchiveViewProps {
  workspaceId: string;
  canEdit: boolean;
}

const DOC_TYPE_LABELS: Record<HistoricalDocType, string> = {
  chronicle: "Biên niên sử",
  charter: "Văn kiện / Hiến chương",
  decree: "Sắc lệnh",
  treaty: "Hiệp ước",
  letter: "Thư từ",
  diary: "Nhật ký",
  ancient_map: "Bản đồ cổ",
  manuscript: "Bản thảo",
  report: "Báo cáo",
  archaeology: "Tài liệu khảo cổ",
  historical_work: "Tác phẩm lịch sử"
};

const PERSPECTIVE_LABELS: Record<PerspectiveKind, { label: string; cls: string }> = {
  official: { label: "Tài liệu Chính thức", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" },
  nation_a: { label: "Góc nhìn Quốc gia A", cls: "border-amber-500/40 bg-amber-500/10 text-amber-200" },
  nation_b: { label: "Góc nhìn Quốc gia B", cls: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200" },
  eyewitness: { label: "Ghi chép Nhân chứng", cls: "border-rose-500/40 bg-rose-500/10 text-rose-200" },
  scholar: { label: "Nhận định Học giả", cls: "border-indigo-500/40 bg-indigo-500/10 text-indigo-200" },
  disputed: { label: "Quan điểm Tranh luận", cls: "border-purple-500/40 bg-purple-500/10 text-purple-200" }
};

export function HistoricalPerspectiveArchiveView({
  workspaceId,
  canEdit
}: HistoricalPerspectiveArchiveViewProps) {
  const [tab, setTab] = useState<"documents" | "perspectives" | "political">("documents");
  const [documents, setDocuments] = useState<HistoricalDocumentRecord[]>([]);
  const [perspectives, setPerspectives] = useState<EventPerspectiveRecord[]>([]);
  const [politicalRels, setPoliticalRels] = useState<UniversalRelationRecord[]>([]);
  const [q, setQ] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("");
  const [selectedEventKey, setSelectedEventKey] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Create Document Modal
  const [docModal, setDocModal] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState<HistoricalDocType>("chronicle");
  const [docAuthor, setDocAuthor] = useState("");
  const [docDate, setDocDate] = useState("");
  const [docOrigin, setDocOrigin] = useState("");
  const [docLang, setDocLang] = useState("Thông ngữ");
  const [docArchiveLoc, setDocArchiveLoc] = useState("");
  const [docContent, setDocContent] = useState("");
  const [docLinked, setDocLinked] = useState("");
  const [docAttachment, setDocAttachment] = useState("");

  // Create Perspective Modal
  const [perspModal, setPerspModal] = useState(false);
  const [pEventTitle, setPEventTitle] = useState("Ký kết Hiệp ước Ánh Dương (Năm 765)");
  const [pKind, setPKind] = useState<PerspectiveKind>("scholar");
  const [pHolder, setPHolder] = useState("");
  const [pAuthor, setPAuthor] = useState("");
  const [pSource, setPSource] = useState("");
  const [pSummary, setPSummary] = useState("");
  const [pBody, setPBody] = useState("");

  const loadAll = useCallback(async () => {
    const params = new URLSearchParams({ workspaceId });
    if (q.trim()) params.set("q", q.trim());
    if (docTypeFilter) params.set("docType", docTypeFilter);

    const [aRes, rRes] = await Promise.all([
      fetch(`/api/archives?${params}`).then((r) => r.json()),
      fetch(`/api/universal-relations?workspaceId=${encodeURIComponent(workspaceId)}`).then((r) => r.json())
    ]);
    setDocuments(aRes.documents || []);
    setPerspectives(aRes.perspectives || []);
    setPoliticalRels(
      (rRes.relations || []).filter((r: UniversalRelationRecord) =>
        ["leader_of", "ally_of", "rival_of", "belongs_to", "founder_of", "member_of"].includes(
          r.relationTypeCode
        )
      )
    );
  }, [workspaceId, q, docTypeFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadAll();
    }, 150);
    return () => clearTimeout(t);
  }, [loadAll]);

  const perspectiveGroups = useMemo(() => {
    const map = new Map<string, { title: string; items: EventPerspectiveRecord[] }>();
    for (const p of perspectives) {
      const g = map.get(p.eventKey) || { title: p.eventTitle, items: [] };
      g.items.push(p);
      map.set(p.eventKey, g);
    }
    return Array.from(map.entries());
  }, [perspectives]);

  const activeGroupKey = selectedEventKey || perspectiveGroups[0]?.[0] || "";
  const activePerspectives =
    perspectiveGroups.find(([k]) => k === activeGroupKey)?.[1]?.items || [];

  async function handleCreateDoc(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/archives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "document",
        workspaceId,
        title: docTitle,
        docType,
        author: docAuthor,
        createdDateLabel: docDate,
        originPlace: docOrigin,
        language: docLang,
        archiveLocation: docArchiveLoc,
        content: docContent,
        linkedEntityIds: docLinked.split(",").map((s) => s.trim()).filter(Boolean),
        attachmentUrl: docAttachment
      })
    });
    setDocModal(false);
    setDocTitle("");
    setDocContent("");
    setDocAttachment("");
    await loadAll();
  }

  async function handleCreatePerspective(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/archives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "perspective",
        workspaceId,
        eventTitle: pEventTitle,
        perspectiveKind: pKind,
        holderName: pHolder,
        author: pAuthor,
        sourceTitle: pSource,
        summary: pSummary,
        body: pBody
      })
    });
    setPerspModal(false);
    setPHolder("");
    setPSummary("");
    setPBody("");
    await loadAll();
  }

  return (
    <div className="space-y-4 text-xs animate-codex-fade-up">
      {/* Header & 3 Sub-Tabs */}
      <div className="codex-card rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold text-[var(--accent)] flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Kho Tư liệu Lịch sử, Góc nhìn Đa chiều &amp; Bản đồ Chính trị
            </h1>
            <p className="text-[11px] text-[var(--text-muted)]">
              Lưu trữ 11 loại văn kiện cổ (`DOC-XXXXXX`), đối chiếu song song nhiều quan điểm lịch sử và khảo sát mạng lưới quyền lực chính trị.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["documents", FileText, `Kho Tư liệu (${documents.length})`],
                ["perspectives", Columns3, `Góc nhìn Lịch sử (${perspectives.length})`],
                ["political", Landmark, `Bản đồ Chính trị (${politicalRels.length})`]
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl border font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                  tab === id
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c]"
                    : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {tab === "documents" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo mã DOC-XXXXXX, tên văn kiện, tác giả, xuất xứ..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]"
              />
            </div>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
            >
              <option value="">Tất cả 11 loại tư liệu</option>
              {Object.entries(DOC_TYPE_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
            {canEdit && (
              <button
                type="button"
                onClick={() => setDocModal(true)}
                className="min-h-[34px] px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Tư liệu
              </button>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: HISTORICAL ARCHIVE */}
      {tab === "documents" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {documents.map((doc) => (
            <article key={doc.id} className="codex-card rounded-2xl p-4 space-y-2.5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="font-mono font-bold text-[var(--accent)]">{doc.id}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-500/35">
                      {DOC_TYPE_LABELS[doc.docType]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                      Độ tin cậy: {doc.reliabilityScore}%
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[var(--text-primary)] mt-1">
                    {doc.title}
                  </h3>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm("Xóa tư liệu này?")) return;
                      await fetch(`/api/archives?kind=document&id=${encodeURIComponent(doc.id)}`, { method: "DELETE" });
                      await loadAll();
                    }}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[var(--text-muted)] rounded-xl bg-[var(--bg-base)]/60 p-2.5 border border-[var(--border-subtle)]">
                <div>Tác giả: <strong className="text-[var(--text-primary)]">{doc.author}</strong></div>
                <div>Niên đại: <strong className="text-[var(--text-primary)]">{doc.createdDateLabel || "—"}</strong></div>
                <div>Xuất xứ: <strong className="text-[var(--text-primary)]">{doc.originPlace || "—"}</strong></div>
                <div>Ngôn ngữ: <strong className="text-[var(--text-primary)]">{doc.language}</strong></div>
              </div>

              <p className="text-[var(--text-secondary)] leading-relaxed">{doc.content}</p>

              {doc.attachmentUrl && (
                <button
                  type="button"
                  onClick={() => setLightboxUrl(doc.attachmentUrl)}
                  className="rounded-xl overflow-hidden border border-[var(--border-subtle)] max-h-40 cursor-zoom-in"
                >
                  <img src={doc.attachmentUrl} alt={doc.title} className="w-full h-36 object-cover" />
                </button>
              )}

              <div className="mt-auto pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--text-muted)]">
                <span>Lưu trữ: {doc.archiveLocation || "Chưa rõ"}</span>
                {doc.linkedEntityIds.length > 0 && (
                  <span className="font-mono text-cyan-300">{doc.linkedEntityIds.join(" · ")}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* TAB 2: PERSPECTIVE ARCHIVE (Parallel Comparison) */}
      {tab === "perspectives" && (
        <div className="space-y-4">
          <div className="codex-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[var(--accent)]">Chọn sự kiện đối chiếu:</span>
              <select
                value={activeGroupKey}
                onChange={(e) => setSelectedEventKey(e.target.value)}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5"
              >
                {perspectiveGroups.map(([key, g]) => (
                  <option key={key} value={key}>
                    {g.title} ({g.items.length} góc nhìn)
                  </option>
                ))}
              </select>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => setPerspModal(true)}
                className="min-h-[34px] px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Góc nhìn Độc lập
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activePerspectives.map((p) => {
              const meta = PERSPECTIVE_LABELS[p.perspectiveKind] || PERSPECTIVE_LABELS.scholar;
              return (
                <article key={p.id} className="codex-card rounded-2xl p-4 space-y-2.5 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">
                      Tin cậy {p.reliability}%
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                    {p.holderName}
                  </h3>
                  {p.summary && (
                    <p className="text-[11px] font-medium text-[var(--accent)] italic">
                      “{p.summary}”
                    </p>
                  )}
                  <p className="text-[var(--text-secondary)] leading-relaxed flex-1">{p.body}</p>
                  <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] space-y-0.5">
                    <div>Tác giả: <strong>{p.author}</strong></div>
                    <div>Nguồn riêng: <strong>{p.sourceTitle || "Chưa ghi nguồn"}</strong></div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: POLITICAL ATLAS */}
      {tab === "political" && (
        <div className="codex-card rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--accent)]">
            <Shield className="w-4 h-4" /> Mạng lưới Quyền lực, Liên minh &amp; Đối địch Chính trị ({politicalRels.length})
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Tổng hợp trực tiếp từ dữ liệu Quan hệ Chuẩn hóa &amp; Kingdom Codex (không nhân bản dữ liệu).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {politicalRels.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 space-y-1"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <strong className="text-[var(--text-primary)]">{r.sourceTitle}</strong>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-500/35 text-[10px] font-semibold">
                    → {r.relationLabel} →
                  </span>
                  <strong className="text-[var(--text-primary)]">{r.targetTitle}</strong>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">{r.description}</p>
                <div className="text-[10px] text-[var(--text-muted)] font-mono">
                  {r.sourceId} ↔ {r.targetId} {r.startDate ? `· ${r.startDate}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Historical Document Modal */}
      {docModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3" onClick={() => setDocModal(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleCreateDoc} className="w-full max-w-2xl max-h-[92vh] overflow-y-auto codex-scrollbar rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[var(--accent)]">Lưu trữ Tư liệu Lịch sử Mới (DOC-XXXXXX)</h3>
              <button type="button" onClick={() => setDocModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input required value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Tên tư liệu *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
              <select value={docType} onChange={(e) => setDocType(e.target.value as HistoricalDocType)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2">
                {Object.entries(DOC_TYPE_LABELS).map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
              </select>
              <input value={docAuthor} onChange={(e) => setDocAuthor(e.target.value)} placeholder="Tác giả / Cơ quan ban hành" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
              <input value={docDate} onChange={(e) => setDocDate(e.target.value)} placeholder="Ngày tạo / Niên đại" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
              <input value={docOrigin} onChange={(e) => setDocOrigin(e.target.value)} placeholder="Nơi xuất xứ" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
              <input value={docLang} onChange={(e) => setDocLang(e.target.value)} placeholder="Ngôn ngữ văn bản" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
              <input value={docArchiveLoc} onChange={(e) => setDocArchiveLoc(e.target.value)} placeholder="Nơi lưu trữ / Bảo tàng" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
              <input value={docLinked} onChange={(e) => setDocLinked(e.target.value)} placeholder="ID liên kết (KING-000001, CHAR-000001)" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
            </div>
            <textarea rows={3} value={docContent} onChange={(e) => setDocContent(e.target.value)} placeholder="Nội dung trích yếu / Toàn văn tư liệu..." className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
            <DirectImageUploadField
              workspaceId={workspaceId}
              label="Ảnh Bản thảo / Bản đồ cổ đính kèm (Upload trực tiếp)"
              value={docAttachment}
              onChange={setDocAttachment}
              preset="free"
              tags="archive,document"
              compact
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDocModal(false)} className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] cursor-pointer">Hủy</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-bold cursor-pointer">Lưu Tư liệu</button>
            </div>
          </form>
        </div>
      )}

      {/* Create Perspective Modal */}
      {perspModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3" onClick={() => setPerspModal(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleCreatePerspective} className="w-full max-w-xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[var(--accent)]">Thêm Góc nhìn Lịch sử Độc lập</h3>
              <button type="button" onClick={() => setPerspModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <input required value={pEventTitle} onChange={(e) => setPEventTitle(e.target.value)} placeholder="Tên sự kiện lịch sử *" className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select value={pKind} onChange={(e) => setPKind(e.target.value as PerspectiveKind)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2">
                {Object.entries(PERSPECTIVE_LABELS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
              </select>
              <input required value={pHolder} onChange={(e) => setPHolder(e.target.value)} placeholder="Chủ thể quan điểm * (VD: Vương quốc B)" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
              <input value={pAuthor} onChange={(e) => setPAuthor(e.target.value)} placeholder="Tác giả / Nhân chứng" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
              <input value={pSource} onChange={(e) => setPSource(e.target.value)} placeholder="Nguồn riêng chứng minh" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
            </div>
            <input value={pSummary} onChange={(e) => setPSummary(e.target.value)} placeholder="Luận điểm cốt lõi (1 câu tóm tắt)" className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
            <textarea required rows={3} value={pBody} onChange={(e) => setPBody(e.target.value)} placeholder="Trình bày đầy đủ góc nhìn lịch sử này..." className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPerspModal(false)} className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] cursor-pointer">Hủy</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-bold cursor-pointer">Lưu Góc nhìn</button>
            </div>
          </form>
        </div>
      )}

      {lightboxUrl && (
        <ImageLightboxModal images={[{ url: lightboxUrl, title: "Tư liệu Lịch sử" }]} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
}
