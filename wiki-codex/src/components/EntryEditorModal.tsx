"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Columns2, Image as ImageIcon, Plus, Sparkles, Trash2, X } from "lucide-react";
import type {
  CanonStatus,
  Category,
  CodexTemplate,
  CustomFieldValue,
  Entry,
  EntryCardProjection,
  EntryCustomProperty,
  EntryStatus,
  EntryType,
  EntryVisibility,
  GalleryItem,
  MediaAsset,
  TableFieldValue
} from "@/types/codex";
import { matchesVietnameseQuery } from "@/lib/vietnamese";
import { computeSchemaCompleteness, entryTypeSupportsPower } from "@/lib/v5-properties";
import { ENTITY_BLUEPRINT_PRESETS } from "@/lib/entity-blueprints";
import { computeEntryCompleteness } from "@/lib/wiki-intelligence";
import { IconSigilPicker } from "./IconSigilPicker";
import { MarkdownCodexRenderer } from "./MarkdownCodexRenderer";
import { DynamicPropertiesEditor } from "./DynamicPropertiesPanel";
import { EntityEmblemSVG } from "./EntityVisualWidgets";
import { WORLD_CURRENCIES, createDefaultEconomyProfile } from "@/lib/economy-engine";
import type { EntityEmblemConfig, EntryEconomyProfile } from "@/types/codex";

interface EntryEditorModalProps {
  workspaceId: string;
  entry: Entry | null;
  initialTitle?: string;
  initialContent?: string;
  entryTypes: EntryType[];
  categories: Category[];
  entriesForAutocomplete?: EntryCardProjection[];
  templates?: CodexTemplate[];
  mediaAssets?: MediaAsset[];
  onClose: () => void;
  onSaved: (entry: Entry) => Promise<void>;
}

export function EntryEditorModal({
  workspaceId,
  entry,
  initialTitle = "",
  initialContent = "",
  entryTypes,
  categories,
  entriesForAutocomplete = [],
  templates = [],
  mediaAssets = [],
  onClose,
  onSaved
}: EntryEditorModalProps) {
  const [title, setTitle] = useState(entry?.title || initialTitle);
  const [subtitle, setSubtitle] = useState(entry?.subtitle || "");
  const [summary, setSummary] = useState(entry?.summary || "");
  const [entryTypeId, setEntryTypeId] = useState(
    entry?.entryTypeId || entryTypes[0]?.id || ""
  );
  const [categoryId, setCategoryId] = useState(entry?.categoryId || "");
  const [status, setStatus] = useState<EntryStatus>(entry?.status || "published");
  const [visibility, setVisibility] = useState<EntryVisibility>(
    entry?.visibility || "public"
  );
  const [canonStatus, setCanonStatus] = useState<CanonStatus>(
    entry?.canonStatus || "canon"
  );
  const [featured, setFeatured] = useState(Boolean(entry?.featured));
  const [aliasesInput, setAliasesInput] = useState((entry?.aliases || []).join(", "));
  const [epigraphQuote, setEpigraphQuote] = useState(entry?.epigraph?.quote || "");
  const [epigraphAuthor, setEpigraphAuthor] = useState(entry?.epigraph?.author || "");
  const [epigraphSource, setEpigraphSource] = useState(entry?.epigraph?.source || "");

  const [spoilerGate, setSpoilerGate] = useState(entry?.spoilerGate || false);
  const [spoilerLabel, setSpoilerLabel] = useState(entry?.spoilerLabel || "");
  const [icon, setIcon] = useState(entry?.icon || "ScrollText");
  const [sigil, setSigil] = useState(entry?.sigil || "✦");
  const [accentColor, setAccentColor] = useState("#D4AF37");
  const [coverImage, setCoverImage] = useState(entry?.coverImage || "");
  const [thumbImage, setThumbImage] = useState(entry?.thumbImage || "");
  const [tagsInput, setTagsInput] = useState((entry?.tags || []).join(", "));
  const [contentMarkdown, setContentMarkdown] = useState(
    entry?.contentMarkdown ||
      initialContent ||
      "## Tổng quan\n\nViết nội dung bách khoa tại đây..."
  );
  const [customFields, setCustomFields] = useState<
    Record<string, CustomFieldValue>
  >(entry?.customFields || {});
  const [extraFields, setExtraFields] = useState<EntryCustomProperty[]>(
    entry?.extraFields || []
  );
  const [powerOverride, setPowerOverride] = useState<"default" | "on" | "off">(
    entry?.tabOverrides?.enabled?.includes("power")
      ? "on"
      : entry?.tabOverrides?.disabled?.includes("power")
      ? "off"
      : "default"
  );
  const [sourcesMarkdown, setSourcesMarkdown] = useState(
    entry?.sourcesMarkdown || ""
  );
  const [privateNotes, setPrivateNotes] = useState(entry?.privateNotes || "");
  const [gallery, setGallery] = useState<GalleryItem[]>(entry?.gallery || []);
  const [economyProfile, setEconomyProfile] = useState<EntryEconomyProfile | undefined>(
    entry?.economyProfile
  );
  const [emblemConfig, setEmblemConfig] = useState<EntityEmblemConfig | undefined>(
    entry?.emblemConfig
  );
  const [changeSummary, setChangeSummary] = useState("");
  const [splitPreview, setSplitPreview] = useState(true);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Auto-Save Local Draft (prevents data loss on refresh/mobile)
  const draftKey = `codex_autosave_draft_${workspaceId}_${entry?.id || "new"}`;
  const [savedDraftPrompt, setSavedDraftPrompt] = useState<{
    title: string;
    contentMarkdown: string;
    savedAt: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed.contentMarkdown === "string" &&
          parsed.contentMarkdown !== (entry?.contentMarkdown || initialContent)
        ) {
          setSavedDraftPrompt(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          draftKey,
          JSON.stringify({
            title,
            contentMarkdown,
            savedAt: new Date().toLocaleTimeString("vi-VN"),
          })
        );
      } catch {
        // ignore quota errors
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [draftKey, title, contentMarkdown]);

  // Slash Commands (/) quick encyclopedic block inserter
  const SLASH_COMMANDS = useMemo(
    () => [
      {
        cmd: "callout",
        label: "/callout — Hộp Ghi chú Sử liệu",
        snippet: "> **Trích lục Sử liệu**: Ghi chú chuyên sâu hoặc giả thuyết học giả tại đây."
      },
      {
        cmd: "table",
        label: "/table — Bảng Dữ liệu Chuẩn",
        snippet: "| Thuộc tính | Chi tiết | Ghi chú |\n| --- | --- | --- |\n| Hạng mục 1 | Giá trị | Nguồn |"
      },
      {
        cmd: "footnote",
        label: "/footnote — Chú thích Chân trang [^1]",
        snippet: "Nội dung có dẫn nguồn[^1].\n\n[^1]: Tên tài liệu tham khảo, Viện Lưu trữ Hành tinh."
      },
      {
        cmd: "timeline",
        label: "/timeline — Khối Mốc Lịch sử",
        snippet: "## Mốc Biên niên sử\n\n- **Năm 100**: Sự kiện khởi đầu.\n- **Năm 350**: Ký kết hiệp ước trọng đại."
      },
      {
        cmd: "quote",
        label: "/quote — Trích dẫn Đề từ",
        snippet: "> *\"Tri thức là ngọn hải đăng vượt qua mọi kỷ nguyên.\"* — Hiến chương Lưu trữ"
      },
      {
        cmd: "h2",
        label: "/h2 — Chương Mục Mới",
        snippet: "## Tiêu đề Chương Mới\n\nNội dung chi tiết..."
      }
    ],
    []
  );

  const slashTriggerMatch = useMemo(() => {
    const m = /(?:^|\n)\/([a-z0-9-]*)$/i.exec(contentMarkdown);
    return m ? m[1].toLowerCase() : null;
  }, [contentMarkdown]);

  const slashMatches = useMemo(() => {
    if (slashTriggerMatch === null) return [];
    return SLASH_COMMANDS.filter(
      (c) => !slashTriggerMatch || c.cmd.includes(slashTriggerMatch)
    );
  }, [slashTriggerMatch, SLASH_COMMANDS]);

  function applySlashCommand(snippet: string) {
    setContentMarkdown((prev) =>
      prev.replace(/(?:^|\n)\/[a-z0-9-]*$/i, (match) =>
        match.startsWith("\n") ? `\n${snippet}` : snippet
      )
    );
  }

  // Inline [[Wikilink]] Autocomplete detection
  const wikiTriggerMatch = useMemo(() => {
    const m = /\[\[([^\]|]*)$/.exec(contentMarkdown);
    return m ? m[1] : null;
  }, [contentMarkdown]);

  const autocompleteMatches = useMemo(() => {
    if (wikiTriggerMatch === null) return [];
    return entriesForAutocomplete
      .filter((e) => !wikiTriggerMatch || matchesVietnameseQuery(e.title, wikiTriggerMatch))
      .slice(0, 6);
  }, [wikiTriggerMatch, entriesForAutocomplete]);

  function applyAutocomplete(targetTitle: string) {
    setContentMarkdown((prev) =>
      prev.replace(/\[\[([^\]|]*)$/, `[[${targetTitle}]]`)
    );
  }

  function applyTemplate(tplId: string) {
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    setEntryTypeId(tpl.entryTypeId);
    setSigil(tpl.sigil || "✦");
    setTagsInput(tpl.defaultTags.join(", "));
    setContentMarkdown(tpl.contentMarkdown);
  }

  const activeType = useMemo(
    () => entryTypes.find((t) => t.id === entryTypeId),
    [entryTypes, entryTypeId]
  );

  // #4 Duplicate Title Warning
  const duplicateEntryMatch = useMemo(() => {
    const t = title.trim().toLowerCase();
    if (t.length < 3) return null;
    return (
      entriesForAutocomplete.find(
        (e) => e.id !== entry?.id && e.title.trim().toLowerCase() === t
      ) ?? null
    );
  }, [title, entriesForAutocomplete, entry?.id]);

  // #5 Live Completeness Score while typing
  const liveCompleteness = useMemo(
    () =>
      computeEntryCompleteness({
        summary,
        contentMarkdown,
        customFields,
        extraFields,
        sourcesMarkdown,
        categoryId: categoryId || null,
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
        coverImage
      }),
    [summary, contentMarkdown, customFields, extraFields, sourcesMarkdown, categoryId, tagsInput, coverImage]
  );

  function applyBlueprintPreset(presetId: string) {
    const bp = ENTITY_BLUEPRINT_PRESETS.find((p) => p.id === presetId);
    if (!bp) return;
    const matchedType = entryTypes.find((t) => t.slug === bp.suggestedTypeSlug);
    if (matchedType) setEntryTypeId(matchedType.id);
    setSigil(bp.sigil);
    setIcon(bp.icon);
    if (!summary.trim()) setSummary(bp.summaryTemplate);
    setTagsInput(bp.defaultTags.join(", "));
    setContentMarkdown(bp.contentMarkdown);
  }

  function insertSnippet(snippet: string) {
    setContentMarkdown((prev) => `${prev}\n\n${snippet}`);
  }

  function updateField(key: string, value: CustomFieldValue) {
    setCustomFields((prev) => ({ ...prev, [key]: value }));
  }

  function addGalleryItem() {
    setGallery((prev) => [
      ...prev,
      { id: `gal-${Date.now()}`, thumbUrl: "", fullUrl: "", caption: "", alt: "" }
    ]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề hồ sơ.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        workspaceId,
        entryTypeId,
        categoryId: categoryId || null,
        title: title.trim(),
        subtitle: subtitle.trim(),
        summary: summary.trim(),
        status,
        visibility,
        canonStatus,
        featured,
        aliases: aliasesInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        epigraph: epigraphQuote.trim()
          ? {
              quote: epigraphQuote.trim(),
              author: epigraphAuthor.trim() || title.trim(),
              source: epigraphSource.trim() || undefined
            }
          : undefined,
        spoilerGate,
        spoilerLabel,
        icon,
        sigil,
        coverImage: coverImage.trim(),
        thumbImage: (thumbImage || coverImage).trim(),
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        contentMarkdown,
        customFields,
        extraFields,
        tabOverrides:
          powerOverride === "on"
            ? { enabled: ["power"] }
            : powerOverride === "off"
            ? { disabled: ["power"] }
            : undefined,
        sourcesMarkdown,
        privateNotes,
        gallery: gallery.filter((g) => g.fullUrl || g.thumbUrl),
        economyProfile,
        emblemConfig,
        changeSummary: changeSummary.trim() || undefined
      };

      const res = await fetch(
        entry ? `/api/entries/${entry.id}` : "/api/entries",
        {
          method: entry ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể lưu hồ sơ.");
      } else {
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          // ignore
        }
        await onSaved(data.entry);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-6xl max-h-[94vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-4 sm:p-6 shadow-2xl space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl font-semibold text-[var(--accent)]">
              {entry ? `✦ Biên tập: ${entry.title}` : "✦ Tạo Hồ sơ Thực thể Mới"}
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold border ${
                liveCompleteness.score >= 80
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : "border-amber-500/50 bg-amber-500/15 text-amber-300"
              }`}
              title={liveCompleteness.checks.filter((c) => !c.passed).map((c) => `• ${c.hint}`).join("\n")}
            >
              Hoàn thiện {liveCompleteness.score}% · {liveCompleteness.tierLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!entry && templates.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => applyTemplate(e.target.value)}
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)] px-2.5 py-1.5 text-xs"
              >
                <option value="">Áp dụng Mẫu hồ sơ (Template)...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#090e1c] text-white">
                    {t.sigil} {t.name}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* #2 Instant 12 Blueprint Presets Strip (when creating new entity) */}
        {!entry && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-2.5 space-y-1.5">
            <div className="text-[11px] font-semibold text-cyan-300">
              ✦ Khuôn mẫu Bách khoa 1-Click (Chọn để nạp sẵn dàn ý & thẻ tag):
            </div>
            <div className="codex-ribbon-scroll flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {ENTITY_BLUEPRINT_PRESETS.map((bp) => (
                <button
                  key={bp.id}
                  type="button"
                  onClick={() => applyBlueprintPreset(bp.id)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)] hover:border-cyan-400 hover:text-cyan-200 transition cursor-pointer"
                >
                  <span>{bp.sigil}</span>
                  <span>{bp.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* #4 Live Duplicate Title Warning */}
        {duplicateEntryMatch && (
          <div className="rounded-xl border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-xs text-amber-200">
            ⚠ Cảnh báo trùng tên: Đã có hồ sơ mang tiêu đề <b>{duplicateEntryMatch.title}</b> trong Workspace này. Bạn nên đổi tên phân biệt để tránh xung đột <code>[[Wikilink]]</code>.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* V5.0 Schema Completeness Meter */}
        {(() => {
          const comp = computeSchemaCompleteness(
            { summary, contentMarkdown, coverImage, customFields, extraFields },
            activeType
          );
          const typeHasPower = entryTypeSupportsPower(activeType);
          return (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                <span className="font-mono text-[11px] text-[var(--accent)] font-bold shrink-0">
                  Hoàn thiện: {comp.percent}%
                </span>
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden max-w-xs">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${comp.percent}%`,
                      backgroundColor: comp.percent >= 80 ? "#34D399" : comp.percent >= 50 ? "#F59E0B" : "#FB7185"
                    }}
                  />
                </div>
                {comp.missingLabels.length > 0 && (
                  <span className="text-[11px] text-[var(--text-muted)] truncate hidden md:inline">
                    Gợi ý điền thêm: {comp.missingLabels.slice(0, 3).join(", ")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-[var(--text-muted)]">Mục Chỉ số & Power:</span>
                <select
                  value={powerOverride}
                  onChange={(e) => setPowerOverride(e.target.value as "default" | "on" | "off")}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px]"
                >
                  <option value="default">
                    Mặc định theo loại ({typeHasPower ? "Bật" : "Tắt — Thuần tri thức"})
                  </option>
                  <option value="on">Luôn Bật cho hồ sơ này</option>
                  <option value="off">Luôn Tắt cho hồ sơ này</option>
                </select>
              </div>
            </div>
          );
        })()}

        {/* Core Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Tiêu đề Hồ sơ *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Vương quốc Băng Triều"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Phụ đề / Danh xưng cổ
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Biệt danh / Tên gọi khác (Aliases — cách nhau dấu phẩy)
            </label>
            <input
              type="text"
              value={aliasesInput}
              onChange={(e) => setAliasesInput(e.target.value)}
              placeholder="Valdoria Glacien, Bắc Hải Quốc..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Loại thực thể</label>
            <select
              value={entryTypeId}
              onChange={(e) => setEntryTypeId(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs"
            >
              {entryTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.sigil} {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Danh mục</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs"
            >
              <option value="">— Chưa phân loại —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.sigil} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EntryStatus)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs"
            >
              <option value="published">Đã xuất bản</option>
              <option value="review">Đang rà soát</option>
              <option value="draft">Bản nháp</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Phạm vi</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as EntryVisibility)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs"
            >
              <option value="public">Công khai</option>
              <option value="private">Riêng tư</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Xác thực Sử liệu</label>
            <select
              value={canonStatus}
              onChange={(e) => setCanonStatus(e.target.value as CanonStatus)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs"
            >
              <option value="canon">Chính sử (Canon)</option>
              <option value="apocrypha">Truyền thuyết</option>
              <option value="hypothesis">Giả thuyết học giả</option>
              <option value="unverified">Đang kiểm chứng</option>
            </select>
          </div>
        </div>

        {/* Epigraph Quote */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-3 text-xs font-semibold text-[var(--accent)]">
            ✦ Khung Đề từ / Danh ngôn đầu hồ sơ (Epigraph — Tùy chọn)
          </div>
          <input
            type="text"
            value={epigraphQuote}
            onChange={(e) => setEpigraphQuote(e.target.value)}
            placeholder="Câu trích dẫn biểu tượng..."
            className="sm:col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
          />
          <input
            type="text"
            value={epigraphAuthor}
            onChange={(e) => setEpigraphAuthor(e.target.value)}
            placeholder="Tác giả / Nguồn trích"
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
          />
        </div>

        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Tóm tắt ngắn</label>
          <textarea
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm"
          />
        </div>

        <IconSigilPicker
          icon={icon}
          sigil={sigil}
          color={accentColor}
          onChange={(n) => {
            setIcon(n.icon);
            setSigil(n.sigil);
            setAccentColor(n.color);
          }}
        />

        {/* Images & Media Vault Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[var(--text-muted)]">URL Ảnh bìa (Hero)</label>
              {mediaAssets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowMediaPicker((v) => !v)}
                  className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ImageIcon className="w-3 h-3" /> Chọn từ Media Vault
                </button>
              )}
            </div>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://... hoặc /uploads/..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">URL Ảnh thu nhỏ (Thumb)</label>
            <input
              type="text"
              value={thumbImage}
              onChange={(e) => setThumbImage(e.target.value)}
              placeholder="Để trống sẽ dùng ảnh bìa"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Thẻ phân loại (Tags)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="vương quốc, phương bắc, lịch sử"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
            />
          </div>
        </div>

        {showMediaPicker && (
          <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)] p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto">
            {mediaAssets.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setCoverImage(m.fullUrl);
                  setThumbImage(m.thumbUrl);
                  setShowMediaPicker(false);
                }}
                className="rounded-lg overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--accent)] text-left cursor-pointer"
              >
                <img src={m.thumbUrl} alt={m.title} className="w-full h-16 object-cover" />
                <div className="p-1 text-[10px] truncate">{m.title}</div>
              </button>
            ))}
          </div>
        )}

        {/* Split-Pane Live Markdown Editor with [[Autocomplete]] */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-medium text-[var(--accent)]">
              Soạn thảo Cổ thư (Gõ `[[` để tự động gợi ý liên kết hồ sơ)
            </label>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => insertSnippet("[[Tên hồ sơ]]")}
                className="px-2 py-1 rounded border border-[var(--border-subtle)] hover:border-[var(--accent)] cursor-pointer"
              >
                + [[Link]]
              </button>
              <button
                type="button"
                onClick={() => insertSnippet(":::callout Ghi chú Học thuật\nNội dung chú thích...\n:::")}
                className="px-2 py-1 rounded border border-[var(--border-subtle)] hover:border-[var(--accent)] cursor-pointer"
              >
                + Callout
              </button>
              <button
                type="button"
                onClick={() => insertSnippet(":::conlang\nLời thề dưới ánh tinh tú.\n:::")}
                className="px-2 py-1 rounded border border-[var(--border-subtle)] hover:border-[var(--accent)] cursor-pointer"
              >
                + Văn bia Cổ ngữ
              </button>
              <button
                type="button"
                onClick={() => insertSnippet(":::spoiler Ghi chú tiết lộ\nNội dung ẩn...\n:::")}
                className="px-2 py-1 rounded border border-[var(--border-subtle)] hover:border-[var(--accent)] cursor-pointer"
              >
                + Spoiler
              </button>
              <button
                type="button"
                onClick={() => setSplitPreview((v) => !v)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded border cursor-pointer ${
                  splitPreview
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border-subtle)]"
                }`}
              >
                <Columns2 className="w-3 h-3" />
                {splitPreview ? "Đang chia đôi Xem trước" : "Bật Xem trước"}
              </button>
            </div>
          </div>

          {/* Auto-Save Local Draft Restore Banner */}
          {savedDraftPrompt && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-emerald-200">
                ✦ Phát hiện bản nháp tự động lưu lúc <b>{savedDraftPrompt.savedAt}</b>.
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (savedDraftPrompt.title) setTitle(savedDraftPrompt.title);
                    setContentMarkdown(savedDraftPrompt.contentMarkdown);
                    setSavedDraftPrompt(null);
                  }}
                  className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[#090e1c] font-semibold cursor-pointer"
                >
                  Khôi phục nháp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSavedDraftPrompt(null);
                    try {
                      window.localStorage.removeItem(draftKey);
                    } catch {
                      // ignore
                    }
                  }}
                  className="rounded-lg border border-emerald-500/40 px-2 py-1 text-emerald-200 cursor-pointer"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          )}

          {/* Slash Command (/) Menu */}
          {slashMatches.length > 0 && (
            <div className="rounded-xl border border-cyan-500/50 bg-slate-950/90 p-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-cyan-300 font-semibold mr-1">
                / Lệnh nhanh Wiki:
              </span>
              {slashMatches.map((sc) => (
                <button
                  key={sc.cmd}
                  type="button"
                  onClick={() => applySlashCommand(sc.snippet)}
                  className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-cyan-100 hover:bg-cyan-500/25 cursor-pointer"
                >
                  {sc.label}
                </button>
              ))}
            </div>
          )}

          {/* Autocomplete dropdown when typing [[ */}
          {autocompleteMatches.length > 0 && (
            <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)] p-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-[var(--accent)] flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3" /> Gợi ý liên kết:
              </span>
              {autocompleteMatches.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => applyAutocomplete(m.title)}
                  className="px-2 py-1 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] hover:brightness-110 cursor-pointer"
                >
                  {m.sigil} {m.title}
                </button>
              ))}
            </div>
          )}

          <div className={`grid gap-3 ${splitPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
            <textarea
              rows={11}
              value={contentMarkdown}
              onChange={(e) => setContentMarkdown(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 text-sm font-mono leading-relaxed"
            />
            {splitPreview && (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-4 max-h-[300px] overflow-y-auto">
                <div className="text-[10px] font-mono uppercase text-[var(--accent)] mb-2">
                  Xem trước trực tiếp (Live Preview)
                </div>
                <MarkdownCodexRenderer
                  markdown={contentMarkdown}
                  linkLookup={entriesForAutocomplete.map((e) => ({
                    id: e.id,
                    slug: e.slug,
                    title: e.title,
                    subtitle: e.subtitle,
                    summary: e.summary,
                    sigil: e.sigil,
                    thumbImage: e.thumbImage
                  }))}
                />
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Custom Fields */}
        {activeType && activeType.fieldSchema.length > 0 && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-4 space-y-3">
            <div className="text-xs font-semibold text-[var(--accent)]">
              ✦ Trường dữ liệu tùy biến động ({activeType.name})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeType.fieldSchema.map((field) => {
                const val = customFields[field.key] ?? field.defaultValue;
                if (field.type === "boolean") {
                  const checked = val === true || val === "true";
                  return (
                    <label
                      key={field.key}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs cursor-pointer"
                    >
                      <span className="text-[var(--text-secondary)]">
                        {field.label} {field.required && <span className="text-rose-400">*</span>}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => updateField(field.key, e.target.checked)}
                        className="h-4 w-4 accent-cyan-500"
                      />
                    </label>
                  );
                }
                if (field.type === "color") {
                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="text-xs text-[var(--text-muted)]">
                        {field.label} {field.required && <span className="text-rose-400">*</span>}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={typeof val === "string" && val.startsWith("#") ? val : "#3b82f6"}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          className="h-8 w-12 rounded border border-[var(--border-subtle)] bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={typeof val === "string" ? val : ""}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          placeholder="#3b82f6"
                          className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>
                  );
                }
                if (field.type === "rating") {
                  const num = Number(val) || 0;
                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="text-xs text-[var(--text-muted)]">
                        {field.label} ({num}/5 ★)
                      </label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => updateField(field.key, star)}
                            className={`rounded-lg border px-2.5 py-1 text-sm cursor-pointer ${
                              star <= num
                                ? "border-amber-400 bg-amber-400/20 text-amber-300"
                                : "border-[var(--border-subtle)] text-slate-500"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (field.type === "multi_entity_ref") {
                  const selectedArr = Array.isArray(val) ? (val as string[]) : [];
                  return (
                    <div key={field.key} className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs text-[var(--text-muted)]">
                        {field.label} ({selectedArr.length} đã chọn)
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {selectedArr.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 text-[11px] text-cyan-200"
                          >
                            {t}
                            <button
                              type="button"
                              onClick={() =>
                                updateField(
                                  field.key,
                                  selectedArr.filter((x) => x !== t)
                                )
                              }
                              className="hover:text-rose-300 cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v && !selectedArr.includes(v)) {
                            updateField(field.key, [...selectedArr, v]);
                          }
                          e.target.value = "";
                        }}
                        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
                      >
                        <option value="">+ Thêm thực thể liên kết...</option>
                        {entriesForAutocomplete.slice(0, 60).map((e) => (
                          <option key={e.id} value={e.title}>
                            {e.sigil} {e.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }
                if (field.type === "url" || field.type === "coordinates" || field.type === "quote") {
                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="text-xs text-[var(--text-muted)]">
                        {field.label} {field.required && <span className="text-rose-400">*</span>}
                      </label>
                      <input
                        type={field.type === "url" ? "url" : "text"}
                        required={Boolean(field.required)}
                        value={typeof val === "string" ? val : ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={
                          field.placeholder ||
                          (field.type === "url"
                            ? "https://..."
                            : field.type === "coordinates"
                              ? "VD: 28.1°B, 31.7°Đ"
                              : "Nhập câu trích dẫn...")
                        }
                        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  );
                }
                if (field.type === "table") {
                  const tbl: TableFieldValue =
                    val && typeof val === "object" && "headers" in val
                      ? (val as TableFieldValue)
                      : { headers: field.columns || ["Cột 1", "Cột 2", "Cột 3"], rows: [] };
                  return (
                    <div key={field.key} className="sm:col-span-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-[var(--text-muted)]">{field.label}</label>
                        <button
                          type="button"
                          onClick={() =>
                            updateField(field.key, {
                              ...tbl,
                              rows: [...tbl.rows, tbl.headers.map(() => "")]
                            })
                          }
                          className="text-[11px] px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] cursor-pointer"
                        >
                          + Thêm dòng
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {tbl.rows.map((row, rIdx) => (
                          <div key={rIdx} className="flex gap-1.5">
                            {tbl.headers.map((h, cIdx) => (
                              <input
                                key={cIdx}
                                type="text"
                                value={row[cIdx] || ""}
                                placeholder={h}
                                onChange={(e) => {
                                  const nextRows = tbl.rows.map((r, i) =>
                                    i === rIdx
                                      ? r.map((c, j) => (j === cIdx ? e.target.value : c))
                                      : r
                                  );
                                  updateField(field.key, { ...tbl, rows: nextRows });
                                }}
                                className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-xs"
                              />
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                updateField(field.key, {
                                  ...tbl,
                                  rows: tbl.rows.filter((_, i) => i !== rIdx)
                                })
                              }
                              className="p-1 text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={field.key}
                    className={
                      field.type === "textarea" || field.type === "private_note"
                        ? "sm:col-span-2"
                        : ""
                    }
                  >
                    <label className="block text-xs text-[var(--text-muted)] mb-1">
                      {field.label}
                      {field.type === "private_note" && " (Riêng tư — Ẩn với khách)"}
                    </label>
                    {field.type === "select" ? (
                      <select
                        value={String(val || "")}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs"
                      >
                        <option value="">— Chọn —</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "multiselect" ? (
                      <input
                        type="text"
                        value={Array.isArray(val) ? val.join(", ") : String(val || "")}
                        onChange={(e) =>
                          updateField(
                            field.key,
                            e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          )
                        }
                        placeholder="Ngăn cách bởi dấu phẩy..."
                        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs"
                      />
                    ) : field.type === "textarea" || field.type === "private_note" ? (
                      <textarea
                        rows={2}
                        value={String(val || "")}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs"
                      />
                    ) : (
                      <input
                        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                        value={val !== undefined && val !== null ? String(val) : ""}
                        onChange={(e) =>
                          updateField(
                            field.key,
                            field.type === "number" ? Number(e.target.value) : e.target.value
                          )
                        }
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* V5.0 Per-Entry Freeform Dynamic Properties Builder (CRUD 10 Kinds) */}
        <DynamicPropertiesEditor
          fields={extraFields}
          entryType={activeType}
          onChange={setExtraFields}
        />

        {/* Sources & Private Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Nguồn & Tài liệu tham khảo</label>
            <textarea
              rows={2}
              value={sourcesMarkdown}
              onChange={(e) => setSourcesMarkdown(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-2.5 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs text-amber-300 mb-1">Ghi chú Riêng tư / Nháp (Ẩn khách)</label>
            <textarea
              rows={2}
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs"
            />
          </div>
        </div>

        {/* V7.0 Economy Profile & Heraldry SVG Emblem Setup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Economy Quick-Setup */}
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/5 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-amber-300">
                Ⱥ Hồ sơ Kinh tế &amp; Hạ tầng (5 Cụm Thanh Dữ liệu)
              </span>
              {economyProfile ? (
                <button
                  type="button"
                  onClick={() => setEconomyProfile(undefined)}
                  className="text-[11px] text-rose-300 hover:underline cursor-pointer"
                >
                  Tắt phân hệ Kinh tế
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEconomyProfile(createDefaultEconomyProfile(title || "Thực thể"))}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 font-semibold cursor-pointer"
                >
                  + Khởi tạo Kinh tế
                </button>
              )}
            </div>
            {economyProfile ? (
              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  value={economyProfile.economicTierLabel}
                  onChange={(e) =>
                    setEconomyProfile({ ...economyProfile, economicTierLabel: e.target.value })
                  }
                  placeholder="Phân hạng kinh tế (VD: Trung tâm Thương mại Khu vực)"
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={economyProfile.currencyCode}
                    onChange={(e) => {
                      const cur = WORLD_CURRENCIES.find((c) => c.code === e.target.value);
                      if (cur) {
                        setEconomyProfile({
                          ...economyProfile,
                          currencyCode: cur.code,
                          currencyName: cur.name,
                          exchangeRateToAurel: cur.ratePerAurel
                        });
                      }
                    }}
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5 text-xs"
                  >
                    {WORLD_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                    <span>Xuất khẩu:</span>
                    <strong className="text-emerald-300 font-mono">{economyProfile.tradeBalance.exportsShare}%</strong>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  ✓ Đã sẵn sàng 5 cụm thanh (Ngành 100%, Ngân sách 100%, 6 Chỉ số Phát triển, Cán cân &amp; Thanh tùy biến). Bạn có thể kéo thanh trượt trực tiếp trong tab <strong>Kinh tế &amp; Hạ tầng</strong> sau khi lưu.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-[var(--text-muted)]">
                Bật phân hệ này để hiển thị 5 cụm thanh dữ liệu Kinh tế, Quy đổi Tiền tệ và So sánh Đa quốc gia cho thực thể.
              </p>
            )}
          </div>

          {/* Heraldry SVG Emblem Customizer */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--accent)]">
                ⚜ Huy hiệu / Quốc kỳ SVG
              </span>
              {emblemConfig ? (
                <button
                  type="button"
                  onClick={() => setEmblemConfig(undefined)}
                  className="text-[11px] text-rose-300 hover:underline cursor-pointer"
                >
                  Gỡ huy hiệu
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setEmblemConfig({
                      primaryColor: "#3B82F6",
                      secondaryColor: "#D4AF37",
                      shape: "shield",
                      motif: "crown"
                    })
                  }
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] font-semibold cursor-pointer"
                >
                  + Tạo Huy hiệu SVG
                </button>
              )}
            </div>
            {emblemConfig ? (
              <div className="flex items-center gap-3">
                <EntityEmblemSVG config={emblemConfig} sigil={sigil} size={56} />
                <div className="flex-1 grid grid-cols-2 gap-1.5 text-xs">
                  <select
                    value={emblemConfig.shape}
                    onChange={(e) =>
                      setEmblemConfig({
                        ...emblemConfig,
                        shape: e.target.value as EntityEmblemConfig["shape"]
                      })
                    }
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-xs"
                  >
                    <option value="shield">Khiên cổ điển</option>
                    <option value="crest">Quốc huy</option>
                    <option value="banner">Cờ hiệu</option>
                    <option value="seal">Ấn triện tròn</option>
                  </select>
                  <select
                    value={emblemConfig.motif}
                    onChange={(e) =>
                      setEmblemConfig({
                        ...emblemConfig,
                        motif: e.target.value as EntityEmblemConfig["motif"]
                      })
                    }
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-xs"
                  >
                    <option value="crown">Vương miện</option>
                    <option value="star">Tinh tú</option>
                    <option value="waves">Hải dương</option>
                    <option value="tree">Rừng xanh</option>
                    <option value="mountain">Sơn mạch</option>
                    <option value="sun">Thái dương</option>
                    <option value="scales">Cán cân</option>
                    <option value="compass">La bàn</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <input
                      type="color"
                      value={emblemConfig.primaryColor}
                      onChange={(e) => setEmblemConfig({ ...emblemConfig, primaryColor: e.target.value })}
                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <span>Nền chính</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <input
                      type="color"
                      value={emblemConfig.secondaryColor}
                      onChange={(e) => setEmblemConfig({ ...emblemConfig, secondaryColor: e.target.value })}
                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <span>Viền &amp; Họa tiết</span>
                  </label>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[var(--text-muted)]">
                Sinh huy hiệu vector siêu nhẹ hiển thị cạnh tiêu đề hồ sơ và trong bảng So sánh Kinh tế.
              </p>
            )}
          </div>
        </div>

        {/* Media Gallery & Options */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--accent)]">
              ✦ Thư viện hình ảnh ({gallery.length})
            </span>
            <button
              type="button"
              onClick={addGalleryItem}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm ảnh
            </button>
          </div>
          {gallery.map((g, idx) => (
            <div key={g.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
              <input
                type="text"
                value={g.fullUrl}
                onChange={(e) =>
                  setGallery((prev) =>
                    prev.map((x, i) =>
                      i === idx
                        ? { ...x, fullUrl: e.target.value, thumbUrl: x.thumbUrl || e.target.value }
                        : x
                    )
                  )
                }
                placeholder="URL ảnh..."
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                value={g.caption}
                onChange={(e) =>
                  setGallery((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, caption: e.target.value, alt: e.target.value } : x
                    )
                  )
                }
                placeholder="Chú thích ảnh..."
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => setGallery((prev) => prev.filter((_, i) => i !== idx))}
                className="text-xs text-rose-400 justify-self-start cursor-pointer"
              >
                Xóa ảnh
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span>Ghim nổi bật trên Trang Chủ Grand Hall</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={spoilerGate}
              onChange={(e) => setSpoilerGate(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span>Bật Màng che Spoiler / Draft Gate</span>
          </label>
          {spoilerGate && (
            <input
              type="text"
              value={spoilerLabel}
              onChange={(e) => setSpoilerLabel(e.target.value)}
              placeholder="Nhãn cảnh báo..."
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1 text-xs"
            />
          )}
        </div>

        {entry && (
          <input
            type="text"
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            placeholder="Ghi chú thay đổi cho Lịch sử phiên bản (Visual Diff)..."
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
          />
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs hover:brightness-110 disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Đang lưu..." : entry ? "Lưu thay đổi" : "Tạo Hồ sơ"}
          </button>
        </div>
      </form>
    </div>
  );
}
