"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  Globe2,
  History,
  Image as ImageIcon,
  Languages,
  Link2,
  Lock,
  Maximize2,
  Minimize2,
  Plus,
  Printer,
  Quote,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import type {
  BacklinkItem,
  CanonStatus,
  Category,
  ConlangLanguage,
  EntityCustomSection,
  EntityEraSnapshot,
  Entry,
  EntryRevision,
  EntryTabKey,
  EntryType,
  EntryVariant,
  GlossaryTerm,
  HydratedHolding,
  ProportionalBarItem,
  TableFieldValue,
  TimelineEvent,
  UnlinkedMention
} from "@/types/codex";
import { extractHeadings, linkFirstMention } from "@/lib/wikilinks";
import {
  autoLinkAllUnlinkedMentions,
  computeEntryCompleteness,
  extractFootnotes
} from "@/lib/wiki-intelligence";
import { translateVietnameseToConlang } from "@/lib/conlang";
import { computeLineDiff } from "@/lib/v2-engines";
import { countWords } from "@/lib/vietnamese";
import { DynamicIcon } from "./DynamicIcon";
import {
  MarkdownCodexRenderer,
  type LinkLookupItem
} from "./MarkdownCodexRenderer";
import { EntryPowerPanel, ProfileShareCardModal } from "./EntryPowerPanel";
import { classifyPowerTier, formatUnboundedPower } from "@/lib/v3-engines";
import {
  entrySupportsPower,
  entrySupportsVariants,
  resolveEntryTabs
} from "@/lib/v5-properties";
import {
  DynamicPropertiesEditor,
  RenderDynamicPropertyValue
} from "./DynamicPropertiesPanel";
import { EntryHoldingsPanel, OwnershipHeaderStrip } from "./EntryHoldingsPanel";
import {
  EntryLinguisticDossier,
  EntryRosterPanel,
  EntryRumorsSecretsPanel,
  EntryStatecraftPanel
} from "./EntryDossierModules";

interface RelationViewItem {
  id: string;
  relationType: string;
  note: string;
  direction: "outgoing" | "incoming";
  otherEntry: { id: string; slug: string; title: string; sigil: string };
}

interface RelatedItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  sigil: string;
  thumbImage: string;
}

interface EntryDetailViewProps {
  entryId: string;
  entryTypes: EntryType[];
  categories: Category[];
  conlangs: ConlangLanguage[];
  canEdit: boolean;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onBack: () => void;
  onOpenEntry: (id: string) => void;
  onEditEntry: (entry: Entry) => void;
  onCreateRedLink: (missingTitle: string) => void;
  onViewOnPlanetaryAtlas?: (nationId: string) => void;
  onMutated: () => Promise<void>;
}

const TAB_LABELS: Record<EntryTabKey, string> = {
  overview: "Tổng quan",
  holdings: "Lãnh địa & Trực thuộc",
  roster: "Nhân sự & Chức vụ",
  power: "Chỉ số & Power Level",
  details: "Thông số & Tỷ lệ",
  sections: "Chương bổ sung",
  eras: "Thời kỳ",
  relations: "Quan hệ & Liên kết",
  timeline: "Dòng thời gian",
  sources: "Nguồn & Ghi chú",
  gallery: "Thư viện ảnh"
};

const CANON_BADGE: Record<CanonStatus, { label: string; cls: string }> = {
  canon: { label: "✦ Chính sử (Canon)", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35" },
  apocrypha: { label: "☽ Truyền thuyết", cls: "bg-purple-500/15 text-purple-300 border-purple-500/35" },
  hypothesis: { label: "⚝ Giả thuyết học giả", cls: "bg-sky-500/15 text-sky-300 border-sky-500/35" },
  unverified: { label: "⧗ Đang kiểm chứng", cls: "bg-amber-500/15 text-amber-300 border-amber-500/35" }
};

export function EntryDetailView({
  entryId,
  entryTypes,
  categories,
  conlangs,
  canEdit,
  isBookmarked,
  onToggleBookmark,
  onBack,
  onOpenEntry,
  onEditEntry,
  onCreateRedLink,
  onViewOnPlanetaryAtlas,
  onMutated
}: EntryDetailViewProps) {
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [revisions, setRevisions] = useState<EntryRevision[]>([]);
  const [backlinks, setBacklinks] = useState<BacklinkItem[]>([]);
  const [mentions, setMentions] = useState<UnlinkedMention[]>([]);
  const [relations, setRelations] = useState<RelationViewItem[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [linkLookup, setLinkLookup] = useState<LinkLookupItem[]>([]);
  const [relatedEntries, setRelatedEntries] = useState<RelatedItem[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [ownedHoldings, setOwnedHoldings] = useState<HydratedHolding[]>([]);
  const [ownedBy, setOwnedBy] = useState<HydratedHolding[]>([]);
  const [ownershipChain, setOwnershipChain] = useState<
    Array<{ id: string; title: string; sigil: string; roleLabel: string }>
  >([]);

  const [activeTab, setActiveTab] = useState<EntryTabKey>("overview");
  const [conlangMode, setConlangMode] = useState<"vi" | "romanized" | "runic" | "bilingual">("vi");
  const [zenMode, setZenMode] = useState(false);
  const [zenFontSize, setZenFontSize] = useState(17);
  const [spoilerUnlocked, setSpoilerUnlocked] = useState(false);
  const [mobileInfoboxOpen, setMobileInfoboxOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  // Audio TTS state
  const [speaking, setSpeaking] = useState(false);
  const [ttsRate, setTtsRate] = useState(1);

  // Citation copy feedback
  const [citationCopied, setCitationCopied] = useState(false);

  // Revisions & Visual Diff modal
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);
  const [diffRevId, setDiffRevId] = useState<string>("");
  const [showShareCard, setShowShareCard] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showCompletenessDetail, setShowCompletenessDetail] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      setReadingProgress(Math.min(100, Math.round((scrollTop / maxScroll) * 100)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // V4.0 Multi-Form / Alternate Canon Variants
  const [activeVariantId, setActiveVariantId] = useState<string>("__base");
  const [addingVariant, setAddingVariant] = useState(false);
  const [varName, setVarName] = useState("");
  const [varBadge, setVarBadge] = useState("Hình thái Đặc biệt");
  const [varEra, setVarEra] = useState("");
  const [varPower, setVarPower] = useState("100000");
  const [varSummary, setVarSummary] = useState("");
  const [editingExtraFields, setEditingExtraFields] = useState(false);

  const [lightboxImg, setLightboxImg] = useState<{ url: string; caption: string } | null>(null);

  // Inline CRUD forms: Relations, Editorial Notes, Custom Sections, Era Snapshots, Breakdown Bars
  const [relTargetId, setRelTargetId] = useState("");
  const [relType, setRelType] = useState("Liên quan mật thiết");
  const [relNote, setRelNote] = useState("");
  const [noteText, setNoteText] = useState("");

  const [secTitle, setSecTitle] = useState("");
  const [secSigil, setSecSigil] = useState("✦");
  const [secContent, setSecContent] = useState("");

  const [eraLabel, setEraLabel] = useState("");
  const [eraYear, setEraYear] = useState("");
  const [eraSummary, setEraSummary] = useState("");
  const [eraChanges, setEraChanges] = useState("");

  const [barGroup, setBarGroup] = useState("Cơ cấu Ngôn ngữ / Văn hóa");
  const [barLabel, setBarLabel] = useState("");
  const [barPct, setBarPct] = useState(25);
  const [barColor, setBarColor] = useState("#D4AF37");

  const [busy, setBusy] = useState(false);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await fetch(`/api/entries/${entryId}`);
      if (!res.ok) {
        setEntry(null);
        return;
      }
      const data = await res.json();
      setEntry(data.entry);
      setRevisions(data.revisions || []);
      setBacklinks(data.backlinks || []);
      setMentions(data.unlinkedMentions || []);
      setRelations(data.relations || []);
      setTimelineEvents(data.timelineEvents || []);
      setLinkLookup(data.linkLookup || []);
      setRelatedEntries(data.relatedEntries || []);
      setGlossaryTerms(data.glossaryTerms || []);
      setOwnedHoldings(data.ownedHoldings || []);
      setOwnedBy(data.ownedBy || []);
      setOwnershipChain(data.ownershipChain || []);
      setSpoilerUnlocked(false);
      setActiveVariantId("__base");
      setEditingExtraFields(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetail();
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  // Reading progress bar listener
  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setReadProgress(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && zenMode) setZenMode(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zenMode]);

  const entryType = useMemo(
    () => entryTypes.find((t) => t.id === entry?.entryTypeId),
    [entryTypes, entry]
  );
  const category = useMemo(
    () => categories.find((c) => c.id === entry?.categoryId),
    [categories, entry]
  );
  const activeConlang = conlangs[0];
  const headings = useMemo(
    () => extractHeadings(entry?.contentMarkdown || ""),
    [entry?.contentMarkdown]
  );

  const supportsPower = entry ? entrySupportsPower(entry, entryType) : false;
  const supportsVariants = entry ? entrySupportsVariants(entry, entryType) : false;
  const enabledTabs: EntryTabKey[] = entry
    ? resolveEntryTabs(entry, entryType)
    : ["overview", "details", "sections", "eras", "relations", "timeline", "sources", "gallery"];

  useEffect(() => {
    if (entry && !enabledTabs.includes(activeTab)) {
      setActiveTab("overview");
    }
  }, [entry, enabledTabs, activeTab]);

  function toggleAudioTts() {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !entry) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const plain = `${entry.title}. ${entry.subtitle || ""}. ${entry.summary || ""}. ${entry.contentMarkdown.replace(/[#>*_`[\]:]+/g, " ")}`;
    const utter = new SpeechSynthesisUtterance(plain);
    utter.lang = "vi-VN";
    utter.rate = ttsRate;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  }

  function copyCitation() {
    if (!entry) return;
    const cite = `${entry.title} — Aethel Codex (${new Date(entry.updatedAt).toLocaleDateString("vi-VN")}). Liên kết nội bộ: [[${entry.title}]]`;
    navigator.clipboard?.writeText(cite);
    setCitationCopied(true);
    setTimeout(() => setCitationCopied(false), 1800);
  }

  async function patchEntryInline(patch: Record<string, unknown>, changeSummary: string) {
    if (!entry) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patch, changeSummary })
      });
      if (res.ok) {
        await fetchDetail();
        await onMutated();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleAddCustomSection(e: React.FormEvent) {
    e.preventDefault();
    if (!entry || !secTitle.trim() || !secContent.trim()) return;
    const next: EntityCustomSection[] = [
      ...(entry.customSections || []),
      { id: `sec-${Date.now()}`, title: secTitle.trim(), sigil: secSigil || "✦", content: secContent.trim() }
    ];
    await patchEntryInline({ customSections: next }, `Thêm chương: ${secTitle}`);
    setSecTitle("");
    setSecContent("");
  }

  async function handleDeleteCustomSection(secId: string) {
    if (!entry) return;
    const next = (entry.customSections || []).filter((s) => s.id !== secId);
    await patchEntryInline({ customSections: next }, "Xóa chương bổ sung");
  }

  async function handleAddEraSnapshot(e: React.FormEvent) {
    e.preventDefault();
    if (!entry || !eraLabel.trim() || !eraYear.trim()) return;
    const next: EntityEraSnapshot[] = [
      ...(entry.eraSnapshots || []),
      {
        id: `era-${Date.now()}`,
        eraLabel: eraLabel.trim(),
        yearLabel: eraYear.trim(),
        summary: eraSummary.trim(),
        keyChanges: eraChanges.trim()
      }
    ];
    await patchEntryInline({ eraSnapshots: next }, `Thêm mốc thời kỳ: ${eraLabel}`);
    setEraLabel("");
    setEraYear("");
    setEraSummary("");
    setEraChanges("");
  }

  async function handleDeleteEra(eraId: string) {
    if (!entry) return;
    const next = (entry.eraSnapshots || []).filter((x) => x.id !== eraId);
    await patchEntryInline({ eraSnapshots: next }, "Xóa mốc thời kỳ");
  }

  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!entry || !varName.trim()) return;
    const pNum = Number(varPower);
    const newVar: EntryVariant = {
      id: `var-${Date.now()}`,
      name: varName.trim(),
      badge: varBadge.trim() || "Biến thể",
      eraLabel: varEra.trim() || "Thời kỳ tùy chỉnh",
      avatarUrl: entry.thumbImage || entry.coverImage || "",
      summary: varSummary.trim() || entry.summary,
      powerLevel: Number.isFinite(pNum) ? pNum : entry.powerLevel ?? 0,
      attributes: (entry.attributes || []).map((a) => ({ ...a }))
    };
    const next = [...(entry.variants || []), newVar];
    await patchEntryInline({ variants: next }, `Thêm hình thái: ${newVar.name}`);
    setActiveVariantId(newVar.id);
    setAddingVariant(false);
    setVarName("");
    setVarEra("");
    setVarSummary("");
  }

  async function handleDeleteVariant(varId: string) {
    if (!entry) return;
    const next = (entry.variants || []).filter((v) => v.id !== varId);
    await patchEntryInline({ variants: next }, "Xóa hình thái biến thể");
    if (activeVariantId === varId) setActiveVariantId("__base");
  }

  async function handleAddBreakdownBar(e: React.FormEvent) {
    e.preventDefault();
    if (!entry || !barLabel.trim()) return;
    const next: ProportionalBarItem[] = [
      ...(entry.breakdownBars || []),
      {
        id: `bar-${Date.now()}`,
        groupTitle: barGroup.trim() || "Cơ cấu Tỷ lệ",
        label: barLabel.trim(),
        percentage: Math.max(1, Math.min(100, barPct)),
        color: barColor
      }
    ];
    await patchEntryInline({ breakdownBars: next }, `Thêm thanh tỷ lệ: ${barLabel}`);
    setBarLabel("");
  }

  async function handleDeleteBar(barId: string) {
    if (!entry) return;
    const next = (entry.breakdownBars || []).filter((b) => b.id !== barId);
    await patchEntryInline({ breakdownBars: next }, "Xóa thanh tỷ lệ");
  }

  async function handleDuplicate() {
    if (!entry) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" })
      });
      if (res.ok) {
        const data = await res.json();
        await onMutated();
        onOpenEntry(data.entry.id);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSoftDelete() {
    if (!entry) return;
    if (!confirm(`Chuyển hồ sơ "${entry.title}" vào Thùng rác?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
      await onMutated();
      onBack();
    } finally {
      setBusy(false);
    }
  }

  async function handleRestoreRevision(revisionId: string) {
    if (!entry) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore_revision", revisionId })
      });
      if (res.ok) {
        setShowRevisionsModal(false);
        await fetchDetail();
        await onMutated();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleConvertMention(mention: UnlinkedMention) {
    if (!entry) return;
    const updatedMd = linkFirstMention(
      entry.contentMarkdown,
      mention.targetTitle,
      mention.matchedText
    );
    await patchEntryInline(
      { contentMarkdown: updatedMd },
      `Liên kết tự động tới [[${mention.targetTitle}]]`
    );
  }

  async function handleAutoLinkAllMentions() {
    if (!entry || mentions.length === 0) return;
    const candidates = mentions.map((m) => ({
      id: m.targetEntryId,
      title: m.targetTitle
    }));
    const { markdown, linkedTitles } = autoLinkAllUnlinkedMentions(
      entry.contentMarkdown,
      candidates,
      entry.id
    );
    if (linkedTitles.length === 0) return;
    await patchEntryInline(
      { contentMarkdown: markdown },
      `Gắn tự động ${linkedTitles.length} liên kết [[Wikilink]]`
    );
  }

  async function handleAddRelation(e: React.FormEvent) {
    e.preventDefault();
    if (!entry || !relTargetId || !relType.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/relations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: entry.workspaceId,
          sourceEntryId: entry.id,
          targetEntryId: relTargetId,
          relationType: relType,
          note: relNote
        })
      });
      setRelTargetId("");
      setRelNote("");
      await fetchDetail();
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteRelation(relId: string) {
    await fetch(`/api/relations?id=${relId}`, { method: "DELETE" });
    await fetchDetail();
  }

  async function handleAddEditorialNote(e: React.FormEvent) {
    e.preventDefault();
    if (!entry || !noteText.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_editorial_note", content: noteText })
      });
      setNoteText("");
      await fetchDetail();
    } finally {
      setBusy(false);
    }
  }

  function cycleConlangMode() {
    const order: Array<"vi" | "romanized" | "runic" | "bilingual"> = [
      "vi",
      "bilingual",
      "romanized",
      "runic"
    ];
    setConlangMode(order[(order.indexOf(conlangMode) + 1) % order.length]);
  }

  if (loading) {
    return (
      <div className="codex-card rounded-2xl p-8 animate-pulse space-y-4">
        <div className="h-36 bg-white/5 rounded-xl" />
        <div className="h-8 w-2/3 bg-white/10 rounded" />
        <div className="h-48 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="codex-card rounded-2xl p-8 text-center space-y-3">
        <p className="font-display text-lg">Không tìm thấy hồ sơ hoặc bạn không có quyền truy cập.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[#090e1c] text-xs font-semibold cursor-pointer"
        >
          Quay lại kho hồ sơ
        </button>
      </div>
    );
  }

  const accent = entryType?.color || "var(--accent)";
  const words = countWords(entry.contentMarkdown);
  const readMinutes = Math.max(1, Math.ceil(words / 200));
  const canon = CANON_BADGE[entry.canonStatus || "canon"];

  const translatedTitle =
    conlangMode === "vi"
      ? entry.title
      : conlangMode === "runic"
      ? translateVietnameseToConlang(entry.title, activeConlang).runic
      : translateVietnameseToConlang(entry.title, activeConlang).romanized;

  const conlangButtonLabel =
    conlangMode === "vi"
      ? `Dịch 1-Click: ${activeConlang?.nativeName || "Aethel'va"}`
      : conlangMode === "bilingual"
      ? "Song ngữ"
      : conlangMode === "romanized"
      ? "Phiên âm Cổ ngữ"
      : "Văn tự Cổ ngữ";

  // Group breakdown bars by groupTitle
  const barGroups = new Map<string, ProportionalBarItem[]>();
  for (const b of entry.breakdownBars || []) {
    const list = barGroups.get(b.groupTitle) ?? [];
    list.push(b);
    barGroups.set(b.groupTitle, list);
  }

  const selectedDiffRev = revisions.find((r) => r.id === diffRevId) ?? revisions[1] ?? revisions[0];
  const visualDiffLines = selectedDiffRev
    ? computeLineDiff(selectedDiffRev.snapshot.contentMarkdown, entry.contentMarkdown)
    : [];
  const completeness = computeEntryCompleteness(entry);
  const footnotes = extractFootnotes(entry.contentMarkdown);

  const contentBody = (
    <div className="space-y-4">
      {entry.spoilerGate && !spoilerUnlocked ? (
        <div className="rounded-2xl border border-purple-400/40 bg-purple-500/10 p-8 text-center space-y-3">
          <EyeOff className="w-8 h-8 mx-auto text-purple-300" />
          <h3 className="font-display text-lg text-purple-200">
            {entry.spoilerLabel || "Hồ sơ đang bật Chế độ Ẩn Nội Dung Tiết Lộ (Spoiler Gate)"}
          </h3>
          <button
            type="button"
            onClick={() => setSpoilerUnlocked(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 cursor-pointer"
          >
            <Eye className="w-4 h-4" /> Hiển thị nội dung hồ sơ
          </button>
        </div>
      ) : (
        <div style={zenMode ? { fontSize: `${zenFontSize}px` } : undefined}>
          {/* Reading Progress Bar + Completeness Score Strip */}
          {!zenMode && (
            <>
              <div className="fixed top-0 left-0 right-0 z-40 h-0.5 bg-transparent pointer-events-none no-print">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent)] to-cyan-400 transition-all duration-150"
                  style={{ width: `${readingProgress}%` }}
                />
              </div>
              <div className="mb-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-2 text-xs no-print">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-[var(--text-primary)]">
                      Độ hoàn thiện hồ sơ: {completeness.score}%
                    </span>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      {completeness.tierLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCompletenessDetail((v) => !v)}
                    className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    {showCompletenessDetail ? "Ẩn tiêu chí" : "Xem tiêu chí bách khoa"}
                  </button>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 transition-all duration-300"
                    style={{ width: `${completeness.score}%` }}
                  />
                </div>
                {showCompletenessDetail && (
                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-[var(--border-subtle)]">
                    {completeness.checks.map((c) => (
                      <div key={c.key} className="flex items-start gap-1.5 text-[11px]">
                        <span className={c.passed ? "text-emerald-400" : "text-amber-400"}>
                          {c.passed ? "✓" : "○"}
                        </span>
                        <div>
                          <div className={c.passed ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)] font-medium"}>
                            {c.label}
                          </div>
                          {!c.passed && (
                            <div className="text-[10px] text-[var(--text-muted)]">{c.hint}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          <MarkdownCodexRenderer
            markdown={entry.contentMarkdown}
            linkLookup={linkLookup}
            glossaryTerms={glossaryTerms}
            conlang={activeConlang}
            conlangDisplayMode={conlangMode}
            onOpenEntry={onOpenEntry}
            onCreateRedLink={onCreateRedLink}
          />
          {footnotes.length > 0 && (
            <section className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-4 space-y-2">
              <h4 className="font-display text-sm font-semibold text-[var(--accent)]">
                Tài liệu tham khảo & Chú thích ({footnotes.length})
              </h4>
              <ol className="space-y-1.5 text-xs text-[var(--text-secondary)] list-decimal pl-5">
                {footnotes.map((fn) => (
                  <li key={fn.id}>
                    <span className="font-mono text-[10px] text-[var(--accent)] mr-1.5">
                      [^{fn.id}]
                    </span>
                    {fn.text}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </div>
  );

  // Zen / Reader Mode
  if (zenMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--bg-base)] overflow-y-auto px-4 py-8">
        <div className="max-w-[68ch] mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)] no-print">
            <span className="text-xs font-mono text-[var(--accent)]">
              ✦ Chế độ Đọc tập trung (Zen — bấm Esc để thoát)
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setZenFontSize((s) => Math.max(14, s - 1))} className="px-2 py-1 rounded border border-[var(--border-subtle)] text-xs cursor-pointer">A-</button>
              <button type="button" onClick={() => setZenFontSize((s) => Math.min(24, s + 1))} className="px-2 py-1 rounded border border-[var(--border-subtle)] text-xs cursor-pointer">A+</button>
              <button type="button" onClick={toggleAudioTts} className="flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--border-subtle)] text-xs cursor-pointer">
                {speaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-[var(--accent)]" />}
                {speaking ? "Dừng đọc" : "Nghe đọc"}
              </button>
              <button type="button" onClick={cycleConlangMode} className="flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--border-strong)] text-xs text-[var(--accent)] cursor-pointer">
                <Languages className="w-3.5 h-3.5" /> {conlangButtonLabel}
              </button>
              <button type="button" onClick={() => setZenMode(false)} className="flex items-center gap-1 px-3 py-1 rounded bg-[var(--accent)] text-[#090e1c] text-xs font-semibold cursor-pointer">
                <Minimize2 className="w-3.5 h-3.5" /> Thoát Zen
              </button>
            </div>
          </div>

          <header className="space-y-2 text-center">
            <div className="text-3xl" style={{ color: accent }}>{entry.sigil}</div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{translatedTitle}</h1>
            {entry.subtitle && <p className="italic text-[var(--text-muted)]">{entry.subtitle}</p>}
          </header>
          <div className="codex-divider text-xs">✧ ✦ ✧</div>
          {contentBody}
        </div>
      </div>
    );
  }

  const infoboxCard = (
    <div className="codex-card arcane-corners rounded-2xl overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
          <span className="font-display font-semibold text-sm text-[var(--accent)]">
            {entry.sigil} Hồ sơ Tóm tắt (Infobox)
          </span>
          <span className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
            ~{readMinutes} phút đọc
          </span>
        </div>

        {supportsPower && (entry.powerLevel !== undefined || entry.powerInfinite) && (() => {
          const t = classifyPowerTier(entry.powerLevel, entry.powerInfinite, entry.powerTierOverride);
          return (
            <button
              type="button"
              onClick={() => setActiveTab("power")}
              className="w-full rounded-xl border p-2.5 flex items-center justify-between text-left cursor-pointer hover:brightness-110 transition"
              style={{ borderColor: `${t.color}66`, backgroundColor: `${t.color}18` }}
            >
              <div>
                <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Power Level</div>
                <div className="font-mono text-lg font-extrabold" style={{ color: t.color }}>
                  {formatUnboundedPower(entry.powerLevel, entry.powerInfinite)}
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border" style={{ borderColor: t.color, color: t.color }}>
                {t.code} · {t.label}
              </span>
            </button>
          );
        })()}

        <dl className="space-y-2 text-xs">
          {(entryType?.fieldSchema ?? [])
            .filter((f) => f.showInInfobox && f.type !== "private_note")
            .map((field) => {
              const val = entry.customFields?.[field.key];
              if (val === undefined || val === null || val === "") return null;
              return (
                <div
                  key={field.key}
                  className="flex justify-between gap-3 border-b border-[var(--border-subtle)]/50 pb-1.5"
                >
                  <dt className="text-[var(--text-muted)] shrink-0">{field.label}</dt>
                  <dd className="text-right text-[var(--text-primary)] font-medium">
                    {Array.isArray(val)
                      ? val.join(", ")
                      : typeof val === "number"
                      ? `${val.toLocaleString("vi-VN")}${field.unit ? ` ${field.unit}` : ""}`
                      : String(val)}
                  </dd>
                </div>
              );
            })}
          {(entry.extraFields ?? [])
            .filter((f) => f.showInInfobox && (canEdit || f.kind !== "private_note"))
            .sort((a, b) => a.order - b.order)
            .map((prop) => (
              <div
                key={prop.id}
                className="flex flex-col gap-1 border-b border-[var(--border-subtle)]/50 pb-1.5"
              >
                <div className="flex justify-between items-center gap-3">
                  <dt className="text-[var(--text-muted)] shrink-0">{prop.label}</dt>
                  {prop.kind !== "progress" && prop.kind !== "tags" && (
                    <dd className="text-right font-medium">
                      <RenderDynamicPropertyValue
                        prop={prop}
                        onOpenByTitle={(t) => {
                          const found = linkLookup.find(
                            (x) => x.title.toLowerCase() === t.trim().toLowerCase()
                          );
                          if (found) onOpenEntry(found.id);
                        }}
                      />
                    </dd>
                  )}
                </div>
                {(prop.kind === "progress" || prop.kind === "tags") && (
                  <dd>
                    <RenderDynamicPropertyValue prop={prop} />
                  </dd>
                )}
              </div>
            ))}
        </dl>

        {/* Mini Proportional Breakdown preview in Infobox */}
        {Array.from(barGroups.entries()).slice(0, 1).map(([groupTitle, bars]) => (
          <div key={groupTitle} className="pt-1 space-y-1.5">
            <div className="text-[11px] font-semibold text-[var(--accent)]">{groupTitle}</div>
            <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-white/10">
              {bars.map((b) => (
                <div
                  key={b.id}
                  style={{ width: `${b.percentage}%`, backgroundColor: b.color }}
                  title={`${b.label}: ${b.percentage}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[var(--text-muted)]">
              {bars.map((b) => (
                <span key={b.id} className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                  {b.label} ({b.percentage}%)
                </span>
              ))}
            </div>
          </div>
        ))}

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)] text-center font-mono">
          <div className="rounded-lg bg-white/5 p-2">
            <div className="text-sm font-semibold">{words}</div>
            <div className="text-[10px] text-[var(--text-muted)]">Số từ</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2">
            <div className="text-sm font-semibold">{backlinks.length}</div>
            <div className="text-[10px] text-[var(--text-muted)]">Backlinks</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2">
            <div className="text-sm font-semibold">v{revisions[0]?.versionNumber || 1}</div>
            <div className="text-[10px] text-[var(--text-muted)]">Phiên bản</div>
          </div>
        </div>

        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 pt-1">
          <Clock className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {new Date(entry.updatedAt).toLocaleString("vi-VN")} · {entry.updatedBy}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Golden Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent pointer-events-none no-print">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-subtle)] text-xs hover:border-[var(--accent)] hover:text-[var(--accent)] transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* 2-Way Jump to Mega-Planet 360 Atlas */}
          {onViewOnPlanetaryAtlas && entry.id.startsWith("ent-nation-") && (
            <button
              type="button"
              onClick={() =>
                onViewOnPlanetaryAtlas(`nation-${entry.id.replace("ent-nation-", "")}`)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/50 bg-cyan-500/15 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25 transition cursor-pointer"
              title="Mở Bản đồ Đại Hành Tinh và bay tới quốc gia này"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Xem trên Bản đồ 360</span>
            </button>
          )}

          {/* Audio TTS */}
          <div className="flex items-center rounded-xl border border-[var(--border-subtle)] overflow-hidden">
            <button
              type="button"
              onClick={toggleAudioTts}
              title="Nghe đọc Cổ thư bằng giọng nói Tiếng Việt"
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs cursor-pointer ${
                speaking
                  ? "bg-rose-500/20 text-rose-300"
                  : "text-[var(--text-secondary)] hover:text-[var(--accent)]"
              }`}
            >
              {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{speaking ? "Dừng" : "Nghe đọc"}</span>
            </button>
            <select
              value={ttsRate}
              onChange={(e) => setTtsRate(Number(e.target.value))}
              className="bg-transparent text-[10px] font-mono px-1.5 py-1.5 border-l border-[var(--border-subtle)] text-[var(--text-muted)]"
              title="Tốc độ đọc"
            >
              <option value={0.85} className="bg-[#090e1c]">0.85x</option>
              <option value={1} className="bg-[#090e1c]">1.0x</option>
              <option value={1.25} className="bg-[#090e1c]">1.25x</option>
              <option value={1.5} className="bg-[#090e1c]">1.5x</option>
            </select>
          </div>

          <button
            type="button"
            onClick={cycleConlangMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition cursor-pointer ${
              conlangMode !== "vi"
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{conlangButtonLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => setZenMode(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zen</span>
          </button>

          <button
            type="button"
            onClick={copyCitation}
            title="Sao chép trích dẫn học thuật"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{citationCopied ? "Đã chép!" : "Trích dẫn"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowShareCard(true)}
            title="Tạo Thẻ Chia Sẻ Hồ Sơ Huyền Ảo"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--accent)] hover:border-[var(--accent)] cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Thẻ Chia Sẻ</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleBookmark(entry.id)}
            className={`p-2 rounded-xl border text-xs cursor-pointer ${
              isBookmarked
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--accent)]"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => setShowRevisionsModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs hover:border-[var(--accent)] cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Diff ({revisions.length})</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleDuplicate}
                title="Nhân bản hồ sơ"
                className="p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onEditEntry(entry)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs hover:brightness-110 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Biên tập
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleSoftDelete}
                className="p-2 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/15 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* NEXT-GEN ENTITY HERO BANNER (#48 Biome Atmospheric Hero for 360 Nations) */}
      <div className="codex-card codex-glass-luminous arcane-corners rounded-2xl overflow-hidden animate-codex-fade-up">
        <div
          className="relative min-h-[155px] sm:min-h-[200px] flex flex-col justify-end p-5 sm:p-7"
          style={{
            background: entry.coverImage
              ? undefined
              : entry.id.startsWith("ent-nation-")
                ? `radial-gradient(65% 85% at 15% 15%, ${accent}48, transparent 62%), radial-gradient(50% 70% at 88% 20%, rgba(56,189,248,0.22), transparent 65%), linear-gradient(135deg, #0a1428 0%, var(--bg-base) 100%)`
                : `radial-gradient(circle at 20% 20%, ${accent}33, transparent 55%), linear-gradient(135deg, var(--bg-elevated), var(--bg-base))`
          }}
        >
          {!entry.coverImage && entry.id.startsWith("ent-nation-") && (
            <svg
              viewBox="0 0 1200 220"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
            >
              <path
                d="M0,185 L140,120 L260,152 L420,76 L580,145 L740,62 L910,136 L1060,92 L1200,155 L1200,220 L0,220 Z"
                fill={accent}
                fillOpacity="0.28"
              />
              <path
                d="M0,200 L210,148 L360,175 L540,118 L700,168 L880,110 L1040,162 L1200,138 L1200,220 L0,220 Z"
                fill="#38bdf8"
                fillOpacity="0.18"
              />
            </svg>
          )}
          {entry.coverImage && (
            <>
              <img
                src={entry.coverImage}
                alt={entry.title}
                className="absolute inset-0 w-full h-full object-cover opacity-45"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/75 to-transparent" />
            </>
          )}

          <div className="relative z-10 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border backdrop-blur"
                style={{ borderColor: `${accent}88`, backgroundColor: `${accent}24`, color: accent }}
              >
                <DynamicIcon name={entryType?.icon || entry.icon} className="w-3 h-3" />
                <span>{entryType?.name || "Hồ sơ Codex"}</span>
              </span>
              {category && (
                <span className="px-2.5 py-0.5 rounded-full border border-[var(--border-subtle)] bg-black/35 text-[var(--text-secondary)]">
                  {category.sigil} {category.name}
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] ${canon.cls}`}>
                {canon.label}
              </span>
              {entry.visibility === "private" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/35">
                  <Lock className="w-3 h-3" /> Riêng tư
                </span>
              )}
            </div>

            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex items-center justify-center text-2xl sm:text-3xl shrink-0 bg-[var(--bg-base)]/80 shadow-lg"
                style={{ borderColor: accent, color: accent, boxShadow: `0 0 24px ${accent}44` }}
              >
                {entry.sigil || "✦"}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-2xl sm:text-4xl font-bold text-[var(--text-primary)] leading-tight">
                  {translatedTitle}
                </h1>
                {entry.subtitle && (
                  <p className="text-sm italic text-[var(--text-secondary)] mt-0.5">
                    {entry.subtitle}
                  </p>
                )}
                {entry.aliases && entry.aliases.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-[var(--text-muted)]">
                    <span className="font-mono uppercase">Còn gọi là:</span>
                    {entry.aliases.map((al) => (
                      <span
                        key={al}
                        className="px-2 py-0.5 rounded-md bg-white/8 border border-[var(--border-subtle)] text-[var(--text-secondary)]"
                      >
                        {al}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Epigraph Quote Banner */}
            {entry.epigraph?.quote && (
              <blockquote className="mt-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)]/65 backdrop-blur px-4 py-3 text-xs sm:text-sm italic text-[var(--text-primary)]">
                “{entry.epigraph.quote}”
                <footer className="not-italic text-[11px] text-[var(--accent)] mt-1 font-medium">
                  — {entry.epigraph.author}
                  {entry.epigraph.source ? `, ${entry.epigraph.source}` : ""}
                </footer>
              </blockquote>
            )}
          </div>
        </div>
      </div>

      {/* V6.0 Ownership Breadcrumb & Current Owner Strip (Bidirectional!) */}
      <OwnershipHeaderStrip
        entry={entry}
        ownedBy={ownedBy}
        ownershipChain={ownershipChain}
        allEntries={linkLookup}
        canEdit={canEdit}
        onOpenEntry={onOpenEntry}
        onMutated={async () => {
          await fetchDetail();
          await onMutated();
        }}
      />

      {/* V4.0 Multi-Form / Alternate Canon Variant Switcher (Only for entity types that support variants!) */}
      {supportsVariants && ((entry.variants && entry.variants.length > 0) || canEdit) && (() => {
        const variants = entry.variants || [];
        const activeVariant = variants.find((v) => v.id === activeVariantId) || null;
        return (
          <div className="codex-card rounded-2xl p-3.5 space-y-3 no-print">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)] shrink-0">
                  ✦ Hình thái / Biến thể:
                </span>
                <button
                  type="button"
                  onClick={() => setActiveVariantId("__base")}
                  className={`px-3 py-1 rounded-full text-xs border transition shrink-0 cursor-pointer ${
                    activeVariantId === "__base"
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                      : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Hồ sơ Gốc
                </button>
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveVariantId(v.id)}
                    className={`px-3 py-1 rounded-full text-xs border transition shrink-0 cursor-pointer ${
                      activeVariantId === v.id
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                        : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)]/60"
                    }`}
                  >
                    {v.name} <span className="opacity-70 text-[10px]">({v.badge})</span>
                  </button>
                ))}
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setAddingVariant((x) => !x)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] text-[11px] text-[var(--accent)] hover:border-[var(--accent)] cursor-pointer shrink-0"
                >
                  <Plus className="w-3 h-3" /> {addingVariant ? "Đóng" : "Thêm biến thể"}
                </button>
              )}
            </div>

            {activeVariant && (
              <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)]/60 p-3.5 flex flex-col sm:flex-row items-start gap-3.5">
                {activeVariant.avatarUrl && (
                  <img
                    src={activeVariant.avatarUrl}
                    alt={activeVariant.name}
                    className="w-16 h-16 rounded-xl object-cover border border-[var(--border-strong)] shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-bold text-base text-[var(--text-primary)]">
                        {activeVariant.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)]">
                        {activeVariant.badge}
                      </span>
                      {activeVariant.eraLabel && (
                        <span className="text-[11px] text-[var(--text-muted)]">· {activeVariant.eraLabel}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-400/35 px-2.5 py-0.5 rounded-lg">
                        ⚡ {formatUnboundedPower(activeVariant.powerLevel, activeVariant.powerInfinite)} ({classifyPowerTier(activeVariant.powerLevel, activeVariant.powerInfinite).label})
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(activeVariant.id)}
                          title="Xóa biến thể này"
                          className="p-1 text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{activeVariant.summary}</p>
                  {activeVariant.attributes && activeVariant.attributes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeVariant.attributes.map((a) => (
                        <span
                          key={a.id}
                          className="text-[11px] px-2 py-0.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)]"
                        >
                          <span className="text-[var(--text-muted)]">{a.label}:</span>{" "}
                          <strong style={{ color: a.color }}>
                            {formatUnboundedPower(a.value, false)}
                          </strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {addingVariant && canEdit && (
              <form onSubmit={handleAddVariant} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <input
                  type="text"
                  required
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  placeholder="Tên hình thái (VD: Thức tỉnh Cổ Thần) *"
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={varBadge}
                  onChange={(e) => setVarBadge(e.target.value)}
                  placeholder="Nhãn (VD: Chính sử / Đa vũ trụ)"
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={varEra}
                  onChange={(e) => setVarEra(e.target.value)}
                  placeholder="Thời kỳ / Giai đoạn"
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
                />
                <input
                  type="number"
                  step="any"
                  value={varPower}
                  onChange={(e) => setVarPower(e.target.value)}
                  placeholder="Power Level không giới hạn"
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs font-mono"
                />
                <input
                  type="text"
                  value={varSummary}
                  onChange={(e) => setVarSummary(e.target.value)}
                  placeholder="Mô tả ngắn về hình thái này..."
                  className="sm:col-span-2 lg:col-span-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs py-1.5 px-3 cursor-pointer"
                >
                  Lưu hình thái
                </button>
              </form>
            )}
          </div>
        );
      })()}

      {/* Mobile Collapsible Infobox (keeps mobile reading instant!) */}
      <div className="lg:hidden no-print">
        <button
          type="button"
          onClick={() => setMobileInfoboxOpen((v) => !v)}
          className="w-full codex-card rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[var(--accent)]"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Xem Hồ sơ Tóm tắt (Infobox) & Thống kê
          </span>
          {mobileInfoboxOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {mobileInfoboxOpen && <div className="mt-2">{infoboxCard}</div>}
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="codex-card rounded-2xl p-4 sm:p-7 space-y-4">
            {entry.summary && (
              <p className="text-sm text-[var(--text-secondary)] bg-[var(--accent-soft)] border-l-2 border-[var(--accent)] px-4 py-2.5 rounded-r-xl">
                {entry.summary}
              </p>
            )}

            {/* 8 Flexible Tabs (Horizontally scrollable on mobile, zero overflow) */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-[var(--border-subtle)] no-print">
              {enabledTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    activeTab === tab
                      ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {TAB_LABELS[tab]}
                  {tab === "holdings" && ownedHoldings.length > 0 && (
                    <span className="ml-1 font-mono opacity-75">({ownedHoldings.length})</span>
                  )}
                  {tab === "roster" && (entry.roster?.length || 0) > 0 && (
                    <span className="ml-1 font-mono opacity-75">({entry.roster?.length})</span>
                  )}
                  {tab === "sections" && (entry.customSections?.length || 0) > 0 && (
                    <span className="ml-1 font-mono opacity-75">({entry.customSections?.length})</span>
                  )}
                  {tab === "eras" && (entry.eraSnapshots?.length || 0) > 0 && (
                    <span className="ml-1 font-mono opacity-75">({entry.eraSnapshots?.length})</span>
                  )}
                  {tab === "relations" && (
                    <span className="ml-1 font-mono opacity-75">({relations.length + backlinks.length})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {contentBody}
                {entryType?.slug === "co-ngu-ngon-ngu" && (
                  <EntryLinguisticDossier conlang={activeConlang} />
                )}
                <EntryRumorsSecretsPanel
                  entry={entry}
                  canEdit={canEdit}
                  onPatch={patchEntryInline}
                />
              </div>
            )}

            {/* Tab V6.0: Bidirectional Holdings & Territories */}
            {activeTab === "holdings" && (
              <EntryHoldingsPanel
                entry={entry}
                ownedHoldings={ownedHoldings}
                allEntries={linkLookup}
                canEdit={canEdit}
                onOpenEntry={onOpenEntry}
                onMutated={async () => {
                  await fetchDetail();
                  await onMutated();
                }}
              />
            )}

            {/* Tab V6.0: Leadership & Roster */}
            {activeTab === "roster" && (
              <EntryRosterPanel
                entry={entry}
                allEntries={linkLookup}
                canEdit={canEdit}
                onOpenEntry={onOpenEntry}
                onPatch={patchEntryInline}
              />
            )}

            {/* Tab 1.5: V3.0 Unbounded Power Level & RPG Attribute Sheet (Entity-Aware) */}
            {activeTab === "power" && supportsPower && (
              <EntryPowerPanel
                entry={entry}
                canEdit={canEdit}
                onPatch={patchEntryInline}
              />
            )}

            {/* Tab 2: Details, Per-Entry Dynamic Properties (CRUD) & Proportional Breakdown Bars */}
            {activeTab === "details" && (
              <div className="space-y-5">
                {/* V5.0 Per-Entry Dynamic Properties Section (Inline CRUD) */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-base text-[var(--accent)]">
                      ✦ Thuộc tính Tùy biến Riêng của Hồ sơ ({(entry.extraFields ?? []).filter((f) => canEdit || f.kind !== "private_note").length})
                    </h3>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setEditingExtraFields((v) => !v)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-medium cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {editingExtraFields ? "Xong chỉnh sửa" : "Thêm / Sửa / Xóa trường"}
                      </button>
                    )}
                  </div>

                  {editingExtraFields && canEdit ? (
                    <DynamicPropertiesEditor
                      fields={entry.extraFields || []}
                      entryType={entryType}
                      onChange={(next) => {
                        patchEntryInline({ extraFields: next }, "Cập nhật trường thuộc tính tùy biến");
                      }}
                    />
                  ) : (entry.extraFields ?? []).filter((f) => canEdit || f.kind !== "private_note").length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(entry.extraFields ?? [])
                        .filter((f) => canEdit || f.kind !== "private_note")
                        .sort((a, b) => a.order - b.order)
                        .map((prop) => (
                          <div
                            key={prop.id}
                            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/45 p-3 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-mono uppercase text-[var(--text-muted)]">
                                {prop.group} · {prop.label}
                              </span>
                              {prop.showInInfobox && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] font-mono">
                                  Infobox
                                </span>
                              )}
                            </div>
                            <div className="text-sm">
                              <RenderDynamicPropertyValue
                                prop={prop}
                                onOpenByTitle={(t) => {
                                  const found = linkLookup.find(
                                    (x) => x.title.toLowerCase() === t.trim().toLowerCase()
                                  );
                                  if (found) onOpenEntry(found.id);
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] italic">
                      Chưa có trường thuộc tính tùy biến riêng. {canEdit ? "Nhấn nút phía trên để tự do thêm bất kỳ trường nào!" : ""}
                    </p>
                  )}
                </div>
                {/* Breakdown Bars */}
                <div className="space-y-3">
                  <h3 className="font-display text-base text-[var(--accent)]">
                    ✦ Biểu đồ Tỷ lệ Bách khoa (Thuần thống kê)
                  </h3>
                  {Array.from(barGroups.entries()).map(([groupTitle, bars]) => (
                    <div
                      key={groupTitle}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-4 space-y-2.5"
                    >
                      <div className="text-xs font-semibold text-[var(--text-primary)]">{groupTitle}</div>
                      <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-white/10">
                        {bars.map((b) => (
                          <div
                            key={b.id}
                            style={{ width: `${b.percentage}%`, backgroundColor: b.color }}
                            title={`${b.label}: ${b.percentage}%`}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                        {bars.map((b) => (
                          <div key={b.id} className="flex items-center justify-between gap-2 bg-white/5 rounded-lg px-2.5 py-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                              <span>{b.label}</span>
                            </span>
                            <span className="flex items-center gap-2 font-mono">
                              <strong>{b.percentage}%</strong>
                              {canEdit && (
                                <button type="button" onClick={() => handleDeleteBar(b.id)} className="text-rose-400 cursor-pointer">
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {canEdit && (
                    <form onSubmit={handleAddBreakdownBar} className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <input type="text" value={barGroup} onChange={(e) => setBarGroup(e.target.value)} placeholder="Tên nhóm tỷ lệ" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
                      <input type="text" required value={barLabel} onChange={(e) => setBarLabel(e.target.value)} placeholder="Nhãn thành phần *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
                      <input type="number" min={1} max={100} value={barPct} onChange={(e) => setBarPct(Number(e.target.value))} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 font-mono" />
                      <input type="color" value={barColor} onChange={(e) => setBarColor(e.target.value)} className="h-8 w-full rounded-lg border border-[var(--border-subtle)] bg-transparent cursor-pointer" />
                      <button type="submit" disabled={busy} className="col-span-2 sm:col-span-1 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold py-1.5 cursor-pointer">
                        + Thêm tỷ lệ
                      </button>
                    </form>
                  )}
                  {/* V6.0 Laws, Customs, Forces & Resources for Kingdoms / Cities / Orgs / Houses / Religions */}
                  {(entryType?.slug === "vuong-quoc" ||
                    entryType?.slug === "thanh-pho-do-thi" ||
                    entryType?.slug === "to-chuc-hoc-phai" ||
                    entryType?.slug === "dong-toc" ||
                    entryType?.slug === "ton-giao-tin-nguong") && (
                    <EntryStatecraftPanel
                      entry={entry}
                      canEdit={canEdit}
                      onPatch={patchEntryInline}
                    />
                  )}
                </div>

                {/* Dynamic Custom Fields */}
                <div className="space-y-3">
                  {(entryType?.fieldSchema ?? []).map((field) => {
                    if (field.type === "private_note" && !canEdit) return null;
                    const val = entry.customFields?.[field.key];
                    return (
                      <div
                        key={field.key}
                        className={`rounded-xl border p-3.5 ${
                          field.type === "private_note"
                            ? "border-amber-500/35 bg-amber-500/10"
                            : "border-[var(--border-subtle)] bg-[var(--bg-base)]/40"
                        }`}
                      >
                        <div className="text-xs font-semibold text-[var(--accent)] mb-1 flex items-center gap-1.5">
                          {field.type === "private_note" && <Lock className="w-3.5 h-3.5 text-amber-300" />}
                          <span>{field.label}</span>
                        </div>
                        {field.type === "table" && val && typeof val === "object" && "headers" in val ? (
                          <div className="overflow-x-auto mt-2">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                                  {(val as TableFieldValue).headers.map((h, i) => (
                                    <th key={i} className="text-left p-2 font-mono">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border-subtle)]">
                                {(val as TableFieldValue).rows.map((row, rIdx) => (
                                  <tr key={rIdx}>
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="p-2 text-[var(--text-secondary)]">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : Array.isArray(val) ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {val.map((v) => (
                              <span key={v} className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-[var(--border-subtle)]">{v}</span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                            {val !== undefined && val !== null && val !== ""
                              ? typeof val === "number"
                                ? `${val.toLocaleString("vi-VN")}${field.unit ? ` ${field.unit}` : ""}`
                                : String(val)
                              : "—"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Custom Sections (Inline CRUD) */}
            {activeTab === "sections" && (
              <div className="space-y-4">
                {(entry.customSections || []).length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    Chưa có chương bổ sung nào (VD: Kiến trúc, Lễ hội, Ẩm thực, Nghệ thuật...).
                  </p>
                ) : (
                  (entry.customSections || []).map((sec) => (
                    <div key={sec.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/45 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold text-[var(--accent)]">
                          {sec.sigil} {sec.title}
                        </h3>
                        {canEdit && (
                          <button type="button" onClick={() => handleDeleteCustomSection(sec.id)} className="text-rose-400 hover:text-rose-300 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                        {sec.content}
                      </p>
                    </div>
                  ))
                )}

                {canEdit && (
                  <form onSubmit={handleAddCustomSection} className="rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] p-4 space-y-2.5">
                    <div className="text-xs font-semibold text-[var(--accent)]">
                      + Thêm Chương Bổ sung trực tiếp ngay tại đây
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={secSigil} onChange={(e) => setSecSigil(e.target.value)} maxLength={2} className="w-12 text-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] py-1.5 text-sm text-[var(--accent)]" />
                      <input type="text" required value={secTitle} onChange={(e) => setSecTitle(e.target.value)} placeholder="Tiêu đề chương (VD: Kiến trúc & Lễ hội) *" className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5 text-xs" />
                    </div>
                    <textarea rows={3} required value={secContent} onChange={(e) => setSecContent(e.target.value)} placeholder="Nội dung chuyên sâu của chương..." className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] p-2.5 text-xs" />
                    <button type="submit" disabled={busy} className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer">
                      Lưu Chương mới
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Tab 4: Era Snapshots (Inline CRUD) */}
            {activeTab === "eras" && (
              <div className="space-y-4">
                {(entry.eraSnapshots || []).length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    Chưa có mốc biến chuyển thời kỳ nào cho thực thể này.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(entry.eraSnapshots || []).map((era) => (
                      <div key={era.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                            {era.yearLabel}
                          </span>
                          {canEdit && (
                            <button type="button" onClick={() => handleDeleteEra(era.id)} className="text-rose-400 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <h4 className="font-display font-semibold text-base">{era.eraLabel}</h4>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{era.summary}</p>
                        {era.keyChanges && (
                          <div className="text-[11px] font-mono text-[var(--accent)] border-t border-[var(--border-subtle)] pt-1.5">
                            ✦ {era.keyChanges}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {canEdit && (
                  <form onSubmit={handleAddEraSnapshot} className="rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] p-4 space-y-2.5 text-xs">
                    <div className="font-semibold text-[var(--accent)]">+ Thêm Mốc Giai đoạn Thời kỳ</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input type="text" required value={eraLabel} onChange={(e) => setEraLabel(e.target.value)} placeholder="Tên giai đoạn (VD: Thời Phục Hưng) *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5" />
                      <input type="text" required value={eraYear} onChange={(e) => setEraYear(e.target.value)} placeholder="Mốc năm (VD: Năm 420 – 500) *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5 font-mono" />
                    </div>
                    <textarea rows={2} value={eraSummary} onChange={(e) => setEraSummary(e.target.value)} placeholder="Tình trạng thực thể trong giai đoạn này..." className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] p-2.5" />
                    <input type="text" value={eraChanges} onChange={(e) => setEraChanges(e.target.value)} placeholder="Điểm thay đổi nổi bật (VD: Dân số · Thể chế · Di sản)" className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5" />
                    <button type="submit" disabled={busy} className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer">
                      Lưu Mốc Thời kỳ
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Tab 5: Relations, Backlinks & Mentions */}
            {activeTab === "relations" && (
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <h3 className="font-display text-base text-[var(--accent)]">✦ Quan hệ Tri thức ({relations.length})</h3>
                  {relations.map((rel) => (
                    <div key={rel.id} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 px-3.5 py-2.5 text-xs">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] font-medium">{rel.relationType}</span>
                        <button type="button" onClick={() => onOpenEntry(rel.otherEntry.id)} className="font-semibold hover:text-[var(--accent)] cursor-pointer">
                          {rel.otherEntry.sigil} {rel.otherEntry.title}
                        </button>
                        {rel.note && <span className="text-[var(--text-muted)]">— {rel.note}</span>}
                      </div>
                      {canEdit && (
                        <button type="button" onClick={() => handleDeleteRelation(rel.id)} className="text-rose-400 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                  {canEdit && (
                    <form onSubmit={handleAddRelation} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <input type="text" value={relType} onChange={(e) => setRelType(e.target.value)} placeholder="Loại quan hệ" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs" />
                      <select value={relTargetId} onChange={(e) => setRelTargetId(e.target.value)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs">
                        <option value="">Chọn hồ sơ đích...</option>
                        {linkLookup.filter((x) => x.id !== entry.id).map((x) => (
                          <option key={x.id} value={x.id}>{x.sigil} {x.title}</option>
                        ))}
                      </select>
                      <div className="flex gap-1.5">
                        <input type="text" value={relNote} onChange={(e) => setRelNote(e.target.value)} placeholder="Ghi chú..." className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs" />
                        <button type="submit" disabled={busy || !relTargetId} className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-display text-base text-[var(--accent)] flex items-center gap-1.5">
                    <Link2 className="w-4 h-4" /> Liên kết ngược — Backlinks ({backlinks.length})
                  </h3>
                  {backlinks.map((b) => (
                    <button key={b.sourceEntryId} type="button" onClick={() => onOpenEntry(b.sourceEntryId)} className="w-full text-left rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-3 hover:border-[var(--accent)] cursor-pointer">
                      <div className="font-medium text-sm text-[var(--accent)]">{b.sourceSigil} {b.sourceTitle}</div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{b.contextSnippet}</p>
                    </button>
                  ))}
                </div>

                {canEdit && mentions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display text-base text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Gợi ý nhắc tới chưa gắn liên kết ({mentions.length})
                      </h3>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleAutoLinkAllMentions}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-400 text-[#090e1c] text-xs font-semibold hover:bg-amber-300 cursor-pointer disabled:opacity-50"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Gắn tất cả ({mentions.length})
                      </button>
                    </div>
                    {mentions.map((m) => (
                      <div key={m.targetEntryId} className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
                        <span>Bài viết nhắc tới <strong>{m.targetTitle}</strong></span>
                        <button type="button" onClick={() => handleConvertMention(m)} className="px-2.5 py-1 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer">
                          Chuyển thành [[Link]]
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 6: Timeline */}
            {activeTab === "timeline" && (
              <div className="space-y-3">
                {timelineEvents.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">Chưa có mốc sự kiện biên niên sử nào gắn với hồ sơ này.</p>
                ) : (
                  timelineEvents.map((ev) => (
                    <div key={ev.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-4 flex gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border" style={{ borderColor: ev.color, color: ev.color }}>{ev.sigil}</div>
                      <div>
                        <div className="font-mono text-xs text-[var(--accent)]">{ev.dateLabel} · {ev.era}</div>
                        <h4 className="font-display font-semibold text-base">{ev.title}</h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{ev.summary}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 7: Sources, Private Notes & Editorial Notes */}
            {activeTab === "sources" && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-base text-[var(--accent)] mb-2">✦ Nguồn & Tài liệu tham khảo</h3>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-4 text-sm whitespace-pre-wrap">
                    {entry.sourcesMarkdown || "Chưa có nguồn tham khảo."}
                  </div>
                </div>
                {canEdit && (
                  <>
                    <div>
                      <h3 className="font-display text-base text-amber-300 mb-2 flex items-center gap-1.5">
                        <Lock className="w-4 h-4" /> Ghi chú Riêng tư / Nháp (Ẩn với khách)
                      </h3>
                      <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 text-sm whitespace-pre-wrap text-amber-100">
                        {entry.privateNotes || "Không có ghi chú riêng tư."}
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <h3 className="font-display text-base text-[var(--accent)]">✦ Thảo luận Biên tập ({entry.editorialNotes.length})</h3>
                      <form onSubmit={handleAddEditorialNote} className="flex gap-2">
                        <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Thêm ghi chú nội bộ..." className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs" />
                        <button type="submit" disabled={busy || !noteText.trim()} className="px-3.5 py-2 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer">Gửi</button>
                      </form>
                      {entry.editorialNotes.map((n) => (
                        <div key={n.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-3 text-xs">
                          <div className="flex justify-between text-[var(--text-muted)] mb-1">
                            <strong className="text-[var(--accent)]">{n.authorName}</strong>
                            <span className="font-mono">{new Date(n.createdAt).toLocaleString("vi-VN")}</span>
                          </div>
                          <p>{n.content}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tab 8: Gallery */}
            {activeTab === "gallery" && (
              <div>
                {entry.gallery.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" /> Chưa có hình ảnh nào.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {entry.gallery.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setLightboxImg({ url: img.fullUrl || img.thumbUrl, caption: img.caption })}
                        className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-base)] text-left hover:border-[var(--accent)] transition cursor-pointer"
                      >
                        <img src={img.thumbUrl || img.fullUrl} alt={img.alt || img.caption} loading="lazy" decoding="async" className="w-full h-44 object-cover" />
                        {img.caption && <div className="p-2.5 text-xs text-[var(--text-secondary)]">{img.caption}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Smart Related Entries */}
          {relatedEntries.length > 0 && (
            <div className="codex-card rounded-2xl p-4 space-y-3 no-print">
              <div className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
                ✦ Hồ sơ Liên quan Gợi ý
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {relatedEntries.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onOpenEntry(r.id)}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-2.5 text-left hover:border-[var(--accent)] transition cursor-pointer"
                  >
                    <span className="text-xl text-[var(--accent)] shrink-0 w-8 text-center">{r.sigil}</span>
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-sm truncate">{r.title}</div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate">{r.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sticky Infobox & Floating TOC */}
        <aside className="hidden lg:block lg:col-span-4 space-y-4 sticky top-20">
          {infoboxCard}
          {headings.length > 0 && (
            <div className="codex-card rounded-2xl p-4 space-y-2 no-print">
              <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Mục lục Bài viết
              </div>
              <nav className="space-y-1 text-xs">
                {headings.map((h) => (
                  <a key={h.id} href={`#${h.id}`} className="block text-[var(--text-secondary)] hover:text-[var(--accent)] truncate" style={{ paddingLeft: `${(h.level - 1) * 10}px` }}>
                    ✧ {h.text}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </aside>
      </div>

      {/* Revisions & Visual Diff Modal */}
      {showRevisionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-[var(--accent)]">
                ✦ Lịch sử Chỉnh sửa & So sánh Khác biệt (Visual Revision Diff)
              </h3>
              <button type="button" onClick={() => setShowRevisionsModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 space-y-2 max-h-96 overflow-y-auto">
                {revisions.map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => setDiffRevId(rev.id)}
                    className={`rounded-xl border p-3 space-y-1 cursor-pointer ${
                      selectedDiffRev?.id === rev.id
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-base)]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-[var(--accent)] font-semibold">
                        v#{rev.versionNumber} — {rev.editorName}
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreRevision(rev.id);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--accent)] text-[#090e1c] font-semibold text-[11px] cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Khôi phục
                      </button>
                    </div>
                    <div className="text-xs">{rev.changeSummary}</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">
                      {new Date(rev.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="md:col-span-7 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 max-h-96 overflow-y-auto font-mono text-xs space-y-0.5">
                <div className="text-[11px] text-[var(--accent)] pb-2 border-b border-[var(--border-subtle)] mb-2">
                  So sánh Phiên bản #{selectedDiffRev?.versionNumber || 1} → Bản hiện tại
                </div>
                {visualDiffLines.map((line, i) => (
                  <div
                    key={i}
                    className={`px-2 py-0.5 rounded whitespace-pre-wrap ${
                      line.type === "added"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : line.type === "removed"
                        ? "bg-rose-500/20 text-rose-300 line-through"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}
                    {line.text || " "}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showShareCard && (
        <ProfileShareCardModal
          entry={entry}
          conlang={activeConlang}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <div className="max-w-4xl max-h-[90vh] space-y-2 text-center">
            <img src={lightboxImg.url} alt={lightboxImg.caption} className="max-h-[80vh] rounded-xl border border-[var(--border-strong)] mx-auto" />
            {lightboxImg.caption && <p className="text-sm text-white/85">{lightboxImg.caption}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
