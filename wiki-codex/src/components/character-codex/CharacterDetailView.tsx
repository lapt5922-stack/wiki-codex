"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Globe2,
  History,
  Image as ImageIcon,
  MapPin,
  Network,
  Pin,
  Quote,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  User,
  Users,
  X
} from "lucide-react";
import type {
  CharacterHydratedDossier,
  CharacterRarity,
  ContentAccessLevel,
  VerificationStatus
} from "@/types/character-codex";
import { RELATION_LABELS_VI } from "@/lib/character-id";
import { useDeviceUI } from "@/lib/device-ui";
import { DraggableScrollArea } from "../DraggableScrollArea";
import { toggleCodexBookmark } from "../BookmarksDrawer";
import { exportShareableCodexCardPng } from "@/lib/codex-card-exporter";

interface CharacterDetailViewProps {
  characterId: string;
  canEdit: boolean;
  onBack: () => void;
  onOpenCharacter: (id: string) => void;
  onEdit: (dossier: CharacterHydratedDossier) => void;
  onDeleted: () => void;
  onOpenNationEntry?: (entryId: string) => void;
}

type DetailTab =
  | "overview"
  | "biography"
  | "appearance"
  | "personality"
  | "abilities"
  | "skills"
  | "equipment"
  | "relationships"
  | "affiliations"
  | "events"
  | "achievements"
  | "assets"
  | "gallery"
  | "lore";

const DETAIL_TABS: Array<{ id: DetailTab; label: string }> = [
  { id: "overview", label: "Tổng quan" },
  { id: "biography", label: "Tiểu sử" },
  { id: "appearance", label: "Ngoại hình" },
  { id: "personality", label: "Tính cách" },
  { id: "abilities", label: "Năng lực" },
  { id: "skills", label: "Kỹ năng" },
  { id: "equipment", label: "Trang bị" },
  { id: "relationships", label: "Quan hệ" },
  { id: "affiliations", label: "Gia tộc & Tổ chức" },
  { id: "events", label: "Sự kiện & Timeline" },
  { id: "achievements", label: "Thành tựu" },
  { id: "assets", label: "Tài sản & Địa vị" },
  { id: "gallery", label: "Thư viện ảnh" },
  { id: "lore", label: "Lời thoại, Nguồn & Bên lề" }
];

const RARITY_STYLES: Record<CharacterRarity, { label: string; cls: string }> = {
  common: { label: "Thường", cls: "border-slate-500/40 bg-slate-500/15 text-slate-300" },
  uncommon: { label: "Khá hiếm", cls: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" },
  rare: { label: "Hiếm", cls: "border-sky-500/40 bg-sky-500/15 text-sky-300" },
  epic: { label: "Sử thi", cls: "border-purple-500/40 bg-purple-500/15 text-purple-300" },
  legendary: { label: "Huyền thoại", cls: "border-amber-400/60 bg-amber-500/20 text-amber-200" },
  mythic: { label: "Thần thoại", cls: "border-rose-400/60 bg-rose-500/20 text-rose-200" },
  unique: { label: "Độc nhất", cls: "border-cyan-400/60 bg-cyan-500/20 text-cyan-200" }
};

const VERIFY_LABELS: Record<VerificationStatus, { label: string; cls: string }> = {
  official: { label: "✦ Chính thức", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35" },
  verified: { label: "✓ Đã xác minh", cls: "bg-sky-500/15 text-sky-300 border-sky-500/35" },
  unverified: { label: "? Chưa xác minh", cls: "bg-amber-500/15 text-amber-300 border-amber-500/35" },
  inferred: { label: "⚝ Suy luận", cls: "bg-purple-500/15 text-purple-300 border-purple-500/35" },
  creative: { label: "✧ Sáng tạo", cls: "bg-pink-500/15 text-pink-300 border-pink-500/35" },
  updating: { label: "↻ Đang cập nhật", cls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/35" },
  draft: { label: "✎ Bản nháp", cls: "bg-slate-500/20 text-slate-300 border-slate-500/35" },
  outdated: { label: "⧗ Đã lỗi thời", cls: "bg-rose-500/15 text-rose-300 border-rose-500/35" }
};

function SpoilerGateBox({
  accessLevel,
  label,
  children
}: {
  accessLevel: ContentAccessLevel;
  label?: string;
  children: React.ReactNode;
}) {
  const [revealed, setRevealed] = useState(accessLevel !== "spoiler");
  if (accessLevel !== "spoiler" || revealed) {
    return (
      <div className="relative">
        {accessLevel === "spoiler" && (
          <button
            type="button"
            onClick={() => setRevealed(false)}
            className="mb-1.5 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 cursor-pointer"
          >
            <EyeOff className="w-3 h-3" /> Ẩn lại Spoiler
          </button>
        )}
        {children}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-purple-400/40 bg-purple-500/10 p-4 text-center space-y-2">
      <div className="text-xs font-semibold text-purple-200">
        ✦ Cảnh báo Nội dung Tiết lộ (Spoiler)
      </div>
      {label && <div className="text-[11px] text-purple-300/90">{label}</div>}
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/30 border border-purple-400/50 text-xs text-purple-100 hover:bg-purple-500/40 cursor-pointer"
      >
        <Eye className="w-3.5 h-3.5" /> Nhấn để mở nội dung này
      </button>
    </div>
  );
}

export function CharacterDetailView({
  characterId,
  canEdit,
  onBack,
  onOpenCharacter,
  onEdit,
  onDeleted,
  onOpenNationEntry
}: CharacterDetailViewProps) {
  const { isMobile } = useDeviceUI();
  const [dossier, setDossier] = useState<CharacterHydratedDossier | null>(null);
  const [versions, setVersions] = useState<
    Array<{ id: string; versionNumber: number; editorName: string; changeNote: string; createdAt: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [selectedAppearanceIdx, setSelectedAppearanceIdx] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [timelineEraFilter, setTimelineEraFilter] = useState("all");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  async function loadDetail() {
    setLoading(true);
    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(characterId)}`);
      if (!res.ok) {
        setDossier(null);
        return;
      }
      const data = await res.json();
      setDossier(data.dossier || null);
      setVersions(data.versions || []);
      const curIdx = (data.dossier?.appearances || []).findIndex((a: { isCurrent: boolean }) => a.isCurrent);
      setSelectedAppearanceIdx(curIdx >= 0 ? curIdx : 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  async function handleTogglePin() {
    if (!dossier || !canEdit) return;
    await fetch(`/api/characters/${encodeURIComponent(dossier.character.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character: { pinnedToGrandHall: !dossier.character.pinnedToGrandHall },
        changeNote: dossier.character.pinnedToGrandHall ? "Bỏ ghim Grand Hall" : "Ghim lên Grand Hall"
      })
    });
    await loadDetail();
  }

  async function handleDelete() {
    if (!dossier || !canEdit) return;
    if (!window.confirm(`Xóa mềm hồ sơ ${dossier.character.id} (${dossier.character.fullName})?`)) return;
    const res = await fetch(`/api/characters/${encodeURIComponent(dossier.character.id)}`, {
      method: "DELETE"
    });
    if (res.ok) onDeleted();
  }

  async function handleRestoreVersion(versionNumber: number) {
    if (!dossier || !canEdit) return;
    await fetch(`/api/characters/${encodeURIComponent(dossier.character.id)}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionNumber })
    });
    setShowVersionsModal(false);
    await loadDetail();
  }

  function handleExportSingleJson() {
    if (!dossier) return;
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dossier.character.id}-${dossier.character.fullName.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="codex-card rounded-2xl p-10 text-center text-xs text-[var(--text-muted)]">
        Đang tải hồ sơ 17 nhóm dữ liệu của nhân vật...
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="codex-card rounded-2xl p-8 text-center space-y-3">
        <p className="text-sm text-[var(--text-muted)]">Không tìm thấy hồ sơ nhân vật hoặc nội dung đang ở chế độ riêng tư.</p>
        <button type="button" onClick={onBack} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer">
          ← Quay lại Character Codex
        </button>
      </div>
    );
  }

  const c = dossier.character;
  const ab = dossier.ability;
  const rarity = RARITY_STYLES[c.rarity] || RARITY_STYLES.common;
  const verify = VERIFY_LABELS[c.verificationStatus] || VERIFY_LABELS.draft;

  const statRows = [
    { label: "HP (Sinh lực)", val: ab.stats.hp, max: 1000, color: "#ef4444" },
    { label: "MP (Năng lượng)", val: ab.stats.mp, max: 1000, color: "#38bdf8" },
    { label: "Thể lực", val: ab.stats.stamina, max: 1000, color: "#10b981" },
    { label: "Sức mạnh", val: ab.stats.strength, max: 100, color: "#f97316" },
    { label: "Tốc độ", val: ab.stats.speed, max: 100, color: "#eab308" },
    { label: "Sức bền", val: ab.stats.endurance, max: 100, color: "#84cc16" },
    { label: "Phòng thủ", val: ab.stats.defense, max: 100, color: "#60a5fa" },
    { label: "Phản xạ", val: ab.stats.reflex, max: 100, color: "#2dd4bf" },
    { label: "Trí tuệ", val: ab.stats.intelligence, max: 100, color: "#a78bfa" },
    { label: "Nhận thức", val: ab.stats.perception, max: 100, color: "#c084fc" },
    { label: "Ý chí", val: ab.stats.willpower, max: 100, color: "#f472b6" },
    { label: "Kiểm soát NL", val: ab.stats.energyControl, max: 100, color: "#22d3ee" },
    { label: "Thích nghi", val: ab.stats.adaptability, max: 100, color: "#fbbf24" }
  ];

  const sidebarContent = (
    <div className="space-y-4">
      {/* Basic Dossier Card */}
      <div className="codex-card rounded-2xl p-4 space-y-2.5 text-xs">
        <div className="font-display font-bold text-sm text-[var(--accent)] border-b border-[var(--border-subtle)] pb-2 flex items-center justify-between">
          <span>✦ Hồ sơ Nhận diện</span>
          <span className="font-mono text-[11px]">{c.id}</span>
        </div>
        {[
          ["Tên khai sinh", c.birthName],
          ["Tên thật", c.trueName],
          ["Tuổi / Năm sinh", [c.age ? `${c.age} tuổi` : "", c.birthYear ? `Năm ${c.birthYear}` : ""].filter(Boolean).join(" · ")],
          ["Giới tính", c.gender],
          ["Chủng tộc", c.race],
          ["Quốc tịch", c.nationality],
          ["Quê quán", c.hometown],
          ["Nơi cư trú", c.residence],
          ["Nghề nghiệp", c.occupation],
          ["Chức vụ", c.position],
          ["Cấp bậc", c.rank],
          ["Thế giới", c.currentWorld]
        ]
          .filter(([, v]) => Boolean(v))
          .map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2 border-b border-[var(--border-subtle)]/40 pb-1">
              <span className="text-[var(--text-muted)] shrink-0">{k}</span>
              <span className="text-right text-[var(--text-primary)] font-medium">{v}</span>
            </div>
          ))}
        {c.linkedNationEntryId && onOpenNationEntry && (
          <button
            type="button"
            onClick={() => onOpenNationEntry(c.linkedNationEntryId!)}
            className="w-full mt-2 py-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Globe2 className="w-3.5 h-3.5" /> Mở Hồ sơ Quốc gia Liên kết
          </button>
        )}
      </div>

      {/* Notable Relationships */}
      {dossier.relationships.length > 0 && (
        <div className="codex-card rounded-2xl p-4 space-y-2 text-xs">
          <div className="font-display font-bold text-sm text-[var(--accent)]">✦ Quan hệ Nổi bật</div>
          {dossier.relationships.slice(0, 5).map(({ relation, otherCharacter }) => (
            <button
              key={relation.id}
              type="button"
              onClick={() => onOpenCharacter(otherCharacter.id)}
              className="w-full flex items-center justify-between gap-2 p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 hover:border-[var(--accent)] text-left cursor-pointer"
            >
              <span className="truncate font-semibold">
                {otherCharacter.symbol} {otherCharacter.fullName}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] shrink-0">
                {RELATION_LABELS_VI[relation.relationType] || relation.relationType}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Affiliations */}
      {dossier.affiliations.length > 0 && (
        <div className="codex-card rounded-2xl p-4 space-y-2 text-xs">
          <div className="font-display font-bold text-sm text-[var(--accent)]">✦ Gia tộc &amp; Tổ chức</div>
          {dossier.affiliations.map(({ affiliation, organization }) => (
            <div key={affiliation.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-2.5">
              <div className="font-semibold" style={{ color: organization.color }}>
                {organization.sigil} {organization.name}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {affiliation.position} {affiliation.rank ? `· ${affiliation.rank}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const uniqueEras = Array.from(new Set(dossier.events.map((e) => e.event.era).filter(Boolean)));
  const filteredEvents =
    timelineEraFilter === "all"
      ? dossier.events
      : dossier.events.filter((e) => e.event.era === timelineEraFilter);

  return (
    <div className="space-y-4 animate-codex-fade-up">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Character Codex
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          {canEdit && (
            <button
              type="button"
              onClick={handleTogglePin}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer ${
                c.pinnedToGrandHall
                  ? "border-amber-400 bg-amber-500/20 text-amber-200 font-semibold"
                  : "border-[var(--border-subtle)] text-[var(--text-muted)]"
              }`}
              title="Ghim nhân vật nổi bật lên Grand Hall"
            >
              <Pin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{c.pinnedToGrandHall ? "Đã ghim Grand Hall" : "Ghim Grand Hall"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowVersionsModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Phiên bản ({versions.length})</span>
          </button>
          <button
            type="button"
            onClick={handleExportSingleJson}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất JSON</span>
          </button>
          <button
            type="button"
            onClick={() =>
              exportShareableCodexCardPng({
                id: c.id,
                title: c.fullName,
                subtitle: c.titles.join(" · ") || c.race,
                badge: rarity.label,
                summary: c.summary,
                accentColor: c.accentColor,
                stats: [
                  { label: "Cấp độ", value: `Lv.${ab.level}` },
                  { label: "Cảnh giới", value: ab.realm || "—" },
                  { label: "Chủng tộc", value: c.race || "—" },
                  { label: "Quốc tịch", value: c.nationality || "—" }
                ]
              })
            }
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs cursor-pointer"
            title="Xuất thẻ tóm tắt PNG để chia sẻ"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thẻ PNG</span>
          </button>
          <button
            type="button"
            onClick={() =>
              toggleCodexBookmark({
                id: c.id,
                kind: "character",
                title: c.fullName,
                subtitle: `${c.race} · Lv.${ab.level}`,
                sigil: c.symbol || "✦"
              })
            }
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-amber-300 text-xs hover:border-[var(--accent)] cursor-pointer"
            title="Ghim vào danh sách yêu thích"
          >
            ★ Ghim
          </button>
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => onEdit(dossier)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-xs hover:brightness-110 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa 17 nhóm
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 rounded-xl border border-rose-500/35 text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                title="Xóa mềm hồ sơ"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* A. Hero Section */}
      <div
        className="relative rounded-2xl border p-5 sm:p-6 overflow-hidden"
        style={{
          borderColor: `${c.accentColor}55`,
          background: `radial-gradient(circle at 85% 20%, ${c.accentColor}22, transparent 58%), var(--bg-surface)`
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {c.portraitUrl ? (
            <img
              src={c.portraitUrl}
              alt={c.fullName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 shadow-lg shrink-0"
              style={{ borderColor: c.accentColor }}
            />
          ) : (
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center text-4xl font-bold shrink-0 bg-black/30"
              style={{ borderColor: c.accentColor, color: c.accentColor }}
            >
              {c.symbol || "✦"}
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-mono px-2 py-0.5 rounded-full bg-black/40 border border-white/15 text-[var(--accent)] font-bold">
                {c.id}
              </span>
              <span className={`px-2 py-0.5 rounded-full border font-semibold ${rarity.cls}`}>{rarity.label}</span>
              <span className={`px-2 py-0.5 rounded-full border ${verify.cls}`}>{verify.label}</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-500/35 font-mono">
                Lv.{ab.level} {ab.realm ? `· ${ab.realm}` : ""}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {c.fullName}
            </h1>

            {c.titles.length > 0 && (
              <div className="text-xs sm:text-sm text-[var(--accent)] font-medium">
                {c.titles.join(" · ")}
              </div>
            )}

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">
              {c.summary}
            </p>

            {c.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {c.tags.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[var(--text-muted)]">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Sidebar */}
      {isMobile && (
        <div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((v) => !v)}
            className="w-full codex-card rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[var(--accent)]"
          >
            <span className="flex items-center gap-2"><User className="w-4 h-4" /> Hồ sơ Nhận diện, Quan hệ &amp; Tổ chức</span>
            {mobileSidebarOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {mobileSidebarOpen && <div className="mt-2">{sidebarContent}</div>}
        </div>
      )}

      {/* Main Content + Sticky Sidebar */}
      <div className={`grid grid-cols-1 ${isMobile ? "" : "lg:grid-cols-12"} gap-5 items-start`}>
        <div className={isMobile ? "space-y-4" : "lg:col-span-8 space-y-4"}>
          {/* C. 14 Navigation Tabs (Drag with Mouse / Swipe / Scrollbar) */}
          <DraggableScrollArea ariaLabel="Các mục hồ sơ nhân vật" innerClassName="flex gap-1.5 px-1">
            {DETAIL_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`shrink-0 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  activeTab === t.id
                    ? "bg-[var(--accent)] text-[#090e1c] font-bold shadow"
                    : "codex-card text-[var(--text-secondary)] hover:text-[var(--accent)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </DraggableScrollArea>

          {/* Active Tab Body */}
          <div className="codex-card rounded-2xl p-4 sm:p-5 space-y-4">
            {activeTab === "overview" && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-base font-bold text-[var(--accent)] mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> 13 Chỉ số Cơ bản &amp; Năng lực Cốt lõi
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {statRows.map((st) => {
                      const pct = Math.min(100, Math.round((st.val / st.max) * 100));
                      return (
                        <div key={st.label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-[var(--text-secondary)]">{st.label}</span>
                            <span className="font-mono font-bold text-[var(--text-primary)]">{st.val}</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full economy-bar-fill" style={{ width: `${pct}%`, backgroundColor: st.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {ab.worldStatOverrides.length > 0 && (
                  <div className="pt-3 border-t border-[var(--border-subtle)]">
                    <div className="text-xs font-semibold text-cyan-300 mb-2">Chỉ số Đặc thù Thế giới</div>
                    <div className="flex flex-wrap gap-2">
                      {ab.worldStatOverrides.map((ws) => (
                        <span key={ws.key} className="px-2.5 py-1 rounded-lg border border-cyan-500/35 bg-cyan-500/10 text-xs font-mono text-cyan-200">
                          {ws.label}: <strong>{ws.value}{ws.unit || ""}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {dossier.quotes[0] && (
                  <blockquote className="rounded-xl border-l-4 border-[var(--accent)] bg-[var(--accent-soft)] p-4 italic text-sm text-[var(--text-primary)]">
                    “{dossier.quotes[0].quoteText}”
                    <footer className="mt-1 not-italic text-[11px] text-[var(--text-muted)]">
                      — {c.fullName}, {dossier.quotes[0].timeLabel} ({dossier.quotes[0].location})
                    </footer>
                  </blockquote>
                )}
              </div>
            )}

            {activeTab === "biography" && (
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Tiểu sử &amp; Biên niên sử Cá nhân ({dossier.biographies.length} chương)
                </h3>
                {dossier.biographies.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">Chưa có chương tiểu sử nào.</p>
                ) : (
                  dossier.biographies.map((bio) => (
                    <SpoilerGateBox key={bio.id} accessLevel={bio.accessLevel} label={bio.spoilerLabel}>
                      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-4 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-display font-bold text-sm text-[var(--text-primary)]">
                            Chương {bio.chapterOrder}: {bio.title}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${(VERIFY_LABELS[bio.verificationStatus] || VERIFY_LABELS.draft).cls}`}>
                            {(VERIFY_LABELS[bio.verificationStatus] || VERIFY_LABELS.draft).label}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                          {bio.contentMarkdown}
                        </div>
                      </div>
                    </SpoilerGateBox>
                  ))
                )}
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-[var(--accent)]">
                    Ngoại hình &amp; Nhận dạng ({dossier.appearances.length} giai đoạn)
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {dossier.appearances.map((a, idx) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedAppearanceIdx(idx)}
                        className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer ${
                          selectedAppearanceIdx === idx
                            ? "bg-[var(--accent)] text-[#090e1c] font-bold"
                            : "border border-[var(--border-subtle)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {a.stageName}
                      </button>
                    ))}
                  </div>
                </div>
                {dossier.appearances[selectedAppearanceIdx] ? (
                  (() => {
                    const ap = dossier.appearances[selectedAppearanceIdx];
                    return (
                      <SpoilerGateBox accessLevel={ap.accessLevel} label={ap.spoilerLabel}>
                        <div className="space-y-3 text-xs">
                          <p className="text-sm text-[var(--text-secondary)]">{ap.description}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {[
                              ["Tuổi / Thời kỳ", `${ap.ageAtStage} · ${ap.timePeriod}`],
                              ["Chiều cao / Cân nặng", `${ap.height} · ${ap.weight}`],
                              ["Tóc", `${ap.hairColor} (${ap.hairStyle})`],
                              ["Mắt / Da", `${ap.eyeColor} · ${ap.skinTone}`],
                              ["Khuôn mặt / Thể trạng", `${ap.faceFeatures} · ${ap.physique}`],
                              ["Giọng nói / Phong thái", `${ap.voice} · ${ap.demeanor}`],
                              ["Sẹo / Hình xăm", `${ap.scars} · ${ap.tattoos}`],
                              ["Trang phục thường ngày", ap.casualOutfit],
                              ["Trang phục chiến đấu", ap.combatOutfit],
                              ["Trang phục nghi lễ", ap.ceremonialOutfit],
                              ["Phụ kiện", ap.accessories],
                              ["Biểu tượng cá nhân", ap.personalEmblem]
                            ]
                              .filter(([, v]) => Boolean(v && v.replace(/[·()\s]/g, "")))
                              .map(([k, v]) => (
                                <div key={k} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-2.5">
                                  <div className="text-[10px] text-[var(--text-muted)]">{k}</div>
                                  <div className="text-[var(--text-primary)] font-medium mt-0.5">{v}</div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </SpoilerGateBox>
                    );
                  })()
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">Chưa có thông tin ngoại hình.</p>
                )}
              </div>
            )}

            {activeTab === "personality" && (
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-[var(--accent)]">
                  Tính cách &amp; Phát triển Tâm lý ({dossier.personalities.length} giai đoạn)
                </h3>
                {dossier.personalities.map((per) => (
                  <SpoilerGateBox key={per.id} accessLevel={per.accessLevel} label={per.spoilerLabel}>
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-4 space-y-3 text-xs">
                      <div className="font-bold text-sm text-[var(--accent)]">
                        {per.stageName} <span className="text-[var(--text-muted)] font-normal">({per.periodLabel})</span>
                      </div>
                      <p className="text-[var(--text-primary)]">{per.corePersonality}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div><strong className="text-emerald-300">Ưu điểm:</strong> {per.strengths.join(", ") || "—"}</div>
                        <div><strong className="text-rose-300">Khuyết điểm:</strong> {per.weaknesses.join(", ") || "—"}</div>
                        <div><strong className="text-sky-300">Động lực:</strong> {per.motivations || "—"}</div>
                        <div><strong className="text-amber-300">Triết lý sống:</strong> {per.lifePhilosophy || "—"}</div>
                        <div><strong className="text-purple-300">Mâu thuẫn nội tâm:</strong> {per.internalConflict || "—"}</div>
                        <div><strong className="text-cyan-300">Phản ứng nguy hiểm:</strong> {per.dangerReaction || "—"}</div>
                      </div>
                    </div>
                  </SpoilerGateBox>
                ))}
              </div>
            )}

            {activeTab === "abilities" && (
              <div className="space-y-4 text-xs">
                <h3 className="font-display text-base font-bold text-[var(--accent)]">
                  Hệ thống Năng lực, Sức mạnh &amp; Lịch sử Tiến hóa
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3">
                    <div className="text-[var(--text-muted)]">Hệ thống năng lượng &amp; Cảnh giới</div>
                    <div className="font-bold text-sm text-amber-300 mt-0.5">{ab.energySystem || "—"} · {ab.realm || "—"}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-1">{ab.powerTier}</div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3">
                    <div className="text-[var(--text-muted)]">Nguyên tố, Huyết thống &amp; Điểm yếu</div>
                    <div className="mt-0.5"><strong>Nguyên tố:</strong> {ab.elements.join(", ") || "—"}</div>
                    <div><strong>Huyết thống:</strong> {ab.bloodline || "—"}</div>
                    <div className="text-rose-300"><strong>Điểm yếu:</strong> {ab.weaknesses.join(", ") || "—"}</div>
                  </div>
                </div>
                {ab.progressionHistory.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                    <div className="font-semibold text-[var(--accent)]">Lịch sử Phát triển Sức mạnh (Đã biên tập viên xác nhận)</div>
                    {ab.progressionHistory.map((p) => (
                      <div key={p.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-2.5 flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-[var(--text-primary)]">{p.dateLabel} — {p.stageLabel} {p.levelValue ? `(Lv.${p.levelValue})` : ""}</div>
                          <div className="text-[var(--text-secondary)]">{p.summary}</div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${p.confirmedByEditor ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                          {p.confirmedByEditor ? "✓ Đã xác nhận" : "Chờ duyệt"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "skills" && (
              <div className="space-y-3">
                <h3 className="font-display text-base font-bold text-[var(--accent)]">
                  Danh mục Kỹ năng ({dossier.skills.length})
                </h3>
                {dossier.skills.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">Chưa có kỹ năng nào được ghi nhận.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dossier.skills.map(({ skill, relation }) => (
                      <div key={relation.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3.5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-[var(--accent)]">{skill.name}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/10">{skill.id} · Lv.{relation.skillLevel}</span>
                        </div>
                        <p className="text-[var(--text-secondary)]">{skill.description}</p>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]/50">
                          <span>Hồi chiêu: <strong className="text-[var(--text-primary)]">{skill.cooldown || "—"}</strong></span>
                          <span>Chi phí: <strong className="text-[var(--text-primary)]">{skill.energyCost || "—"}</strong></span>
                          <span>Phạm vi: <strong className="text-[var(--text-primary)]">{skill.effectRange || "—"}</strong></span>
                          <span>Thành thạo: <strong className="text-amber-300">{relation.masteryLevel || "—"}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "equipment" && (
              <div className="space-y-3">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Trang bị, Vũ khí &amp; Cổ vật ({dossier.equipment.length})
                </h3>
                {dossier.equipment.map(({ item, relation }) => (
                  <div key={relation.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3.5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-[var(--text-primary)]">{item.name}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">{item.id} · {relation.slotLabel}</span>
                    </div>
                    <div className="text-[var(--text-secondary)]">{item.traits}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Nguồn gốc: {item.origin || "—"} · Cấp độ: {item.levelOrTier || "—"}</div>
                    {item.transferHistory.length > 0 && (
                      <div className="pt-1 text-[11px] text-cyan-300">
                        Lịch sử chuyển nhượng: {item.transferHistory.map((h) => `${h.dateLabel} (${h.from} → ${h.to})`).join(" | ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "relationships" && (
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <Network className="w-4 h-4" /> Quan hệ Nhân vật Hai chiều ({dossier.relationships.length})
                </h3>
                {/* Interactive Mini Relationship Graph SVG */}
                {dossier.relationships.length > 0 && (
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-950/70 p-2">
                    <svg viewBox="0 0 560 220" className="w-full h-48 block">
                      {dossier.relationships.map(({ relation, otherCharacter }, idx) => {
                        const angle = (idx / Math.max(1, dossier.relationships.length)) * Math.PI * 2 - Math.PI / 2;
                        const nx = 280 + Math.cos(angle) * 175;
                        const ny = 110 + Math.sin(angle) * 78;
                        return (
                          <g key={relation.id}>
                            <line x1={280} y1={110} x2={nx} y2={ny} stroke="#d4af37" strokeOpacity={0.55} strokeWidth={1.6} />
                            <text x={(280 + nx) / 2} y={(110 + ny) / 2 - 4} textAnchor="middle" fontSize={9} fill="#cbd5e1">
                              {RELATION_LABELS_VI[relation.relationType]} ({relation.closeness}%)
                            </text>
                            <g onClick={() => onOpenCharacter(otherCharacter.id)} className="cursor-pointer">
                              <circle cx={nx} cy={ny} r={20} fill="#1e293b" stroke="#38bdf8" strokeWidth={1.8} />
                              <text x={nx} y={ny + 4} textAnchor="middle" fontSize={14} fill="#38bdf8">{otherCharacter.symbol}</text>
                              <text x={nx} y={ny + 33} textAnchor="middle" fontSize={10} fontWeight={600} fill="#f8fafc">
                                {otherCharacter.fullName}
                              </text>
                            </g>
                          </g>
                        );
                      })}
                      <circle cx={280} cy={110} r={26} fill="#0f172a" stroke={c.accentColor} strokeWidth={2.5} />
                      <text x={280} y={115} textAnchor="middle" fontSize={18} fill={c.accentColor}>{c.symbol}</text>
                    </svg>
                  </div>
                )}

                <div className="space-y-2">
                  {dossier.relationships.map(({ relation, otherCharacter }) => (
                    <div key={relation.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <button type="button" onClick={() => onOpenCharacter(otherCharacter.id)} className="font-bold text-sm text-[var(--accent)] hover:underline cursor-pointer">
                          {otherCharacter.symbol} {otherCharacter.fullName} ({otherCharacter.id})
                        </button>
                        <span className="px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] font-mono text-[10px]">
                          {RELATION_LABELS_VI[relation.relationType]} · Thân thiết {relation.closeness}%
                        </span>
                      </div>
                      <p className="text-[var(--text-secondary)]">{relation.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "affiliations" && (
              <div className="space-y-3">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <Users className="w-4 h-4" /> Gia tộc, Vương tộc &amp; Tổ chức ({dossier.affiliations.length})
                </h3>
                {dossier.affiliations.map(({ affiliation, organization }) => (
                  <div key={affiliation.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm" style={{ color: organization.color }}>
                        {organization.sigil} {organization.name} ({organization.id})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-[10px]">{affiliation.position}</span>
                    </div>
                    <div className="text-[var(--text-secondary)]">{affiliation.roleDescription}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Gia nhập: {affiliation.joinDate || "—"} {affiliation.leaveDate ? `· Rời đi: ${affiliation.leaveDate}` : "· Đang hoạt động"} · Quyền hạn: {affiliation.authorityScope || "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "events" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Timeline Nhân vật &amp; Bản đồ Hành trình ({filteredEvents.length})
                  </h3>
                  {uniqueEras.length > 0 && (
                    <select value={timelineEraFilter} onChange={(e) => setTimelineEraFilter(e.target.value)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1 text-xs">
                      <option value="all">Tất cả thời đại</option>
                      {uniqueEras.map((era) => <option key={era} value={era}>{era}</option>)}
                    </select>
                  )}
                </div>

                {/* Mini Journey Map if any event has coordinates */}
                {filteredEvents.some((e) => typeof e.event.mapX === "number" && typeof e.event.mapY === "number") && (
                  <div className="rounded-xl border border-cyan-500/35 bg-slate-950/80 p-3 space-y-1.5">
                    <div className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Bản đồ Hành trình Nhân vật trên Aethelgard Prime
                    </div>
                    <svg viewBox="0 0 400 180" className="w-full h-36 rounded-lg bg-[#07162b] border border-slate-800">
                      {filteredEvents
                        .filter((e) => typeof e.event.mapX === "number" && typeof e.event.mapY === "number")
                        .map((e, i, arr) => {
                          const x = (e.event.mapX || 0.5) * 400;
                          const y = (e.event.mapY || 0.5) * 180;
                          const next = arr[i + 1];
                          return (
                            <g key={e.event.id}>
                              {next && (
                                <line
                                  x1={x}
                                  y1={y}
                                  x2={(next.event.mapX || 0.5) * 400}
                                  y2={(next.event.mapY || 0.5) * 180}
                                  stroke="#fbbf24"
                                  strokeDasharray="4 3"
                                  strokeWidth={1.6}
                                />
                              )}
                              <circle cx={x} cy={y} r={5} fill="#38bdf8" stroke="#fff" strokeWidth={1.2} />
                              <text x={x + 7} y={y + 3} fontSize={9} fill="#f8fafc">
                                {e.event.year}: {e.event.location}
                              </text>
                            </g>
                          );
                        })}
                    </svg>
                  </div>
                )}

                <div className="space-y-2.5">
                  {filteredEvents.map(({ event, participation }) => (
                    <div key={event.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3.5 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-[var(--accent)]">
                          Năm {event.year}{event.month ? ` (Th.${event.month})` : ""} — {event.title}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--text-muted)]">{event.id}</span>
                      </div>
                      <div className="text-[11px] text-cyan-300">Địa điểm: {event.location} · Vai trò: {participation.characterRole}</div>
                      <p className="text-[var(--text-secondary)]">{event.content}</p>
                      {event.outcome && <div className="text-[11px] text-emerald-300">Kết quả: {event.outcome}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "achievements" && (
              <div className="space-y-4 text-xs">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <Award className="w-4 h-4" /> Thành tựu, Chiến tích &amp; Kinh nghiệm Chiến đấu
                </h3>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3.5 space-y-1.5">
                  <div className="font-semibold text-[var(--accent)] flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5" /> Hồ sơ Chiến đấu ({c.combat.victoriesCount} thắng / {c.combat.defeatsCount} bại)
                  </div>
                  <div><strong>Phong cách:</strong> {c.combat.combatStyle || "—"} · <strong>Trường phái:</strong> {c.combat.schoolOrDiscipline || "—"}</div>
                  <div><strong>Chỉ huy:</strong> {c.combat.commandRating}% · <strong>Chiến thuật:</strong> {c.combat.tacticsRating}% · <strong>Công/Thủ:</strong> {c.combat.offenseRating}% / {c.combat.defenseRating}%</div>
                </div>
                {dossier.achievements.map((ach) => (
                  <div key={ach.id} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                    <div className="flex justify-between font-bold text-sm text-amber-200">
                      <span>{ach.title}</span>
                      <span className="font-mono text-[10px]">{ach.dateAchieved}</span>
                    </div>
                    <p className="text-[var(--text-secondary)]">{ach.description}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "assets" && (
              <div className="space-y-4 text-xs">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <Coins className="w-4 h-4" /> Tài chính Đa tiền tệ &amp; Đánh giá Xã hội
                </h3>
                {dossier.assets.map((as) => (
                  <div key={as.id} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1.5">
                    <div className="font-bold text-sm text-amber-300">{as.personalWealth} ({as.currencyCode})</div>
                    <div><strong>Thu nhập:</strong> {as.income || "—"}</div>
                    <div><strong>Bất động sản &amp; Đất đai:</strong> {[...as.properties, ...as.landHoldings].join(", ") || "—"}</div>
                    <div><strong>Thừa kế / Nợ:</strong> {as.inheritance || "—"} · Nợ: {as.debts || "Không"}</div>
                  </div>
                ))}
                {c.socialStanding.nationEvaluations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                    <div className="font-semibold text-[var(--accent)]">Đánh giá Riêng của từng Quốc gia</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {c.socialStanding.nationEvaluations.map((ev, i) => (
                        <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-2.5">
                          <div className="flex justify-between font-semibold">
                            <span>{ev.nationName}</span>
                            <span className="text-emerald-300 font-mono">{ev.reputationScore > 0 ? `+${ev.reputationScore}` : ev.reputationScore}</span>
                          </div>
                          <div className="text-[11px] text-[var(--accent)]">{ev.standingLabel}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{ev.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "gallery" && (
              <div className="space-y-3">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Thư viện Hình ảnh ({dossier.images.length})
                </h3>
                {dossier.images.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">Chưa có hình ảnh trong thư viện. Bạn có thể thêm URL ảnh trong trình Chỉnh sửa.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {dossier.images.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setLightboxUrl(img.url)}
                        className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-base)] text-left hover:border-[var(--accent)] cursor-pointer"
                      >
                        <img src={img.thumbUrl || img.url} alt={img.caption} className="w-full h-36 object-cover" loading="lazy" />
                        <div className="p-2 text-[11px] truncate text-[var(--text-secondary)]">{img.caption || img.category}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "lore" && (
              <div className="space-y-4 text-xs">
                {dossier.quotes.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-display text-sm font-bold text-[var(--accent)] flex items-center gap-1.5">
                      <Quote className="w-4 h-4" /> Lời thoại &amp; Trích dẫn ({dossier.quotes.length})
                    </h3>
                    {dossier.quotes.map((q) => (
                      <div key={q.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 italic">
                        “{q.quoteText}”
                        <div className="not-italic text-[10px] text-[var(--text-muted)] mt-1">
                          Người nghe: {q.listener || "—"} · {q.timeLabel} · {q.location}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                  <h3 className="font-display text-sm font-bold text-[var(--accent)]">Thông tin Bên lề &amp; Bí mật</h3>
                  <div><strong>Sở thích:</strong> {c.trivia.hobbies.join(", ") || "—"}</div>
                  <div><strong>Món ăn / Màu yêu thích:</strong> {c.trivia.favoriteFood || "—"} · {c.trivia.favoriteColor || "—"}</div>
                  {c.trivia.personalSecrets.map((sec) => (
                    <SpoilerGateBox key={sec.id} accessLevel={sec.accessLevel} label={sec.spoilerLabel || sec.title}>
                      <div className="rounded-lg border border-purple-500/35 bg-purple-500/10 p-3 mt-2">
                        <div className="font-bold text-purple-200">{sec.title}</div>
                        <p className="text-[var(--text-secondary)] mt-0.5">{sec.content}</p>
                      </div>
                    </SpoilerGateBox>
                  ))}
                </div>

                {dossier.customFields.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                    <h3 className="font-display text-sm font-bold text-[var(--accent)]">Trường Dữ liệu Tùy biến</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dossier.customFields.map(({ definition, value }) => (
                        <div key={definition.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-2.5">
                          <div className="text-[10px] text-[var(--text-muted)]">[{definition.groupName}] {definition.label}</div>
                          <div className="font-semibold text-[var(--text-primary)] mt-0.5">{String(value ?? "—")}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                  <h3 className="font-display text-sm font-bold text-[var(--accent)]">Nguồn &amp; Tài liệu Tham khảo ({dossier.sources.length})</h3>
                  {dossier.sources.map((src) => (
                    <div key={src.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">{src.title}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{src.providerOrAuthor} · Độ tin cậy {src.reliability}%</div>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-300">{src.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* D. Desktop/Tablet Sticky Sidebar */}
        {!isMobile && <aside className="hidden lg:block lg:col-span-4 sticky top-20">{sidebarContent}</aside>}
      </div>

      {/* Version History & Restore Modal */}
      {showVersionsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="font-display font-bold text-base text-[var(--accent)]">Lịch sử Phiên bản ({versions.length})</h3>
              <button type="button" onClick={() => setShowVersionsModal(false)} className="p-1 rounded hover:bg-white/10 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {versions.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">Chưa có bản ghi phiên bản.</p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 text-xs flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold">v{v.versionNumber} · {v.editorName}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{v.changeNote}</div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)]">{new Date(v.createdAt).toLocaleString("vi-VN")}</div>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRestoreVersion(v.versionNumber)}
                        className="px-2.5 py-1.5 rounded-lg border border-amber-400/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" /> Khôi phục
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Xem ảnh toàn màn hình" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}
