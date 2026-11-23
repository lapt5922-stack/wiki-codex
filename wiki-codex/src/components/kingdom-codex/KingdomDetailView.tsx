"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  Copy,
  Crown,
  Download,
  Edit3,
  Globe2,
  Handshake,
  History,
  Image as ImageIcon,
  Landmark,
  Map as MapIcon,
  RotateCcw,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  X
} from "lucide-react";
import type { KingdomHydratedDossier } from "@/types/kingdom-codex";
import { EntityEmblemSVG } from "../EntityVisualWidgets";
import { useDeviceUI } from "@/lib/device-ui";
import { DraggableScrollArea } from "../DraggableScrollArea";
import { toggleCodexBookmark } from "../BookmarksDrawer";
import { exportShareableCodexCardPng } from "@/lib/codex-card-exporter";
import {
  filterMeaningfulRows,
  isCustomFieldMeaningful,
  isMeaningfulValue,
  joinMeaningfulParts
} from "@/lib/empty-field-engine";
import {
  CustomProfileBlocksRenderer,
  getPinnedInfoboxRows
} from "../CustomProfileLayoutBuilder";
import { ImageLightboxModal, type LightboxImageItem } from "../ImageLightboxModal";

interface KingdomDetailViewProps {
  kingdomId: string;
  canEdit: boolean;
  onBack: () => void;
  onOpenKingdom: (id: string) => void;
  onEdit: (dossier: KingdomHydratedDossier) => void;
  onClone: (sourceId: string, sourceName: string) => void;
  onDeleted: () => void;
  onViewOnAtlas?: (atlasNationId: string) => void;
  onOpenWikiEntry?: (entryId: string) => void;
  onOpenCharacter?: (charId: string) => void;
  onOpenHeraldry?: (kingdomId: string) => void;
}

type BuiltInKTab =
  | "overview"
  | "geography"
  | "population"
  | "politics"
  | "royalty"
  | "economy"
  | "military"
  | "technology"
  | "culture"
  | "infrastructure"
  | "diplomacy"
  | "history"
  | "achievements"
  | "timeline"
  | "gallery"
  | "sources";

type KTab = BuiltInKTab | string;

const KINGDOM_TABS: Array<{ id: BuiltInKTab; label: string }> = [
  { id: "overview", label: "1. Tổng quan" },
  { id: "geography", label: "2. Địa lý" },
  { id: "population", label: "3. Dân số & Xã hội" },
  { id: "politics", label: "4. Chính trị" },
  { id: "royalty", label: "5. Hoàng gia" },
  { id: "economy", label: "6. Kinh tế" },
  { id: "military", label: "7. Quân sự" },
  { id: "technology", label: "8. Công nghệ & Ma pháp" },
  { id: "culture", label: "9. Văn hóa" },
  { id: "infrastructure", label: "10. Hạ tầng" },
  { id: "diplomacy", label: "11. Ngoại giao" },
  { id: "history", label: "12. Lịch sử" },
  { id: "achievements", label: "13. Thành tựu & Tài nguyên" },
  { id: "timeline", label: "14. Timeline" },
  { id: "gallery", label: "15. Thư viện" },
  { id: "sources", label: "16. Nguồn & Trường động" }
];

export function KingdomDetailView({
  kingdomId,
  canEdit,
  onBack,
  onOpenKingdom,
  onEdit,
  onClone,
  onDeleted,
  onViewOnAtlas,
  onOpenWikiEntry,
  onOpenCharacter,
  onOpenHeraldry
}: KingdomDetailViewProps) {
  const { isMobile } = useDeviceUI();
  const [dossier, setDossier] = useState<KingdomHydratedDossier | null>(null);
  const [versions, setVersions] = useState<
    Array<{ id: string; versionNumber: number; editorName: string; changeNote: string; createdAt: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<KTab>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [timelineCatFilter, setTimelineCatFilter] = useState("all");
  const [lightboxState, setLightboxState] = useState<{
    items: LightboxImageItem[];
    index: number;
  } | null>(null);

  async function loadDetail() {
    setLoading(true);
    try {
      const res = await fetch(`/api/kingdoms/${encodeURIComponent(kingdomId)}`);
      if (!res.ok) {
        setDossier(null);
        return;
      }
      const data = await res.json();
      setDossier(data.dossier || null);
      setVersions(data.versions || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kingdomId]);

  async function handleDelete() {
    if (!dossier || !canEdit) return;
    if (!window.confirm(`Xóa mềm hồ sơ ${dossier.kingdom.id} (${dossier.kingdom.officialName})?`)) return;
    const res = await fetch(`/api/kingdoms/${encodeURIComponent(dossier.kingdom.id)}`, { method: "DELETE" });
    if (res.ok) onDeleted();
  }

  async function handleRestore(versionNumber: number) {
    if (!dossier || !canEdit) return;
    await fetch(`/api/kingdoms/${encodeURIComponent(dossier.kingdom.id)}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionNumber })
    });
    setShowVersions(false);
    await loadDetail();
  }

  if (loading) {
    return (
      <div className="codex-card rounded-2xl p-10 text-center text-xs text-[var(--text-muted)]">
        Đang tải hồ sơ 18 nhóm địa chính trị của quốc gia...
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="codex-card rounded-2xl p-8 text-center space-y-3">
        <p className="text-sm text-[var(--text-muted)]">Không tìm thấy hồ sơ quốc gia này.</p>
        <button type="button" onClick={onBack} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-xs cursor-pointer">
          ← Quay lại Kingdom Codex
        </button>
      </div>
    );
  }

  const k = dossier.kingdom;
  const kLayout = k.profileLayout;
  const accent = dossier.symbols.representativeColors[0] || "#D4AF37";
  const latestPop = dossier.populationHistory[dossier.populationHistory.length - 1];
  const latestEcon = dossier.economyHistory[dossier.economyHistory.length - 1];
  const primaryRuler = dossier.rulers[0];

  const allKingdomImages: LightboxImageItem[] = [
    ...(isMeaningfulValue(dossier.symbols.flagUrl)
      ? [{ url: dossier.symbols.flagUrl, title: `${k.officialName} — Quốc kỳ`, category: "Quốc kỳ" }]
      : []),
    ...(isMeaningfulValue(dossier.symbols.coatOfArmsUrl)
      ? [{ url: dossier.symbols.coatOfArmsUrl, title: `${k.officialName} — Quốc huy`, category: "Quốc huy" }]
      : []),
    ...(isMeaningfulValue(dossier.symbols.coverImageUrl)
      ? [{ url: dossier.symbols.coverImageUrl, title: `${k.officialName} — Ảnh bìa`, category: "Ảnh bìa" }]
      : []),
    ...(isMeaningfulValue(dossier.symbols.capitalImageUrl)
      ? [{ url: dossier.symbols.capitalImageUrl, title: `Thủ đô ${dossier.territory.capitalName}`, category: "Thủ đô" }]
      : []),
    ...(isMeaningfulValue(dossier.symbols.mapImageUrl)
      ? [{ url: dossier.symbols.mapImageUrl, title: `${k.officialName} — Bản đồ`, category: "Bản đồ" }]
      : []),
    ...((kLayout?.blocks || []).flatMap((b) =>
      b.fields
        .filter((f) => f.kind === "image_card" && isMeaningfulValue(f.imageUrl))
        .map((f) => ({
          url: f.imageUrl!,
          title: f.label,
          caption: f.imageCaption,
          source: f.imageSource,
          category: b.title
        }))
    )),
    ...dossier.images
      .filter((img) => isMeaningfulValue(img.url))
      .map((img) => ({
        url: img.url,
        title: img.caption || k.officialName,
        caption: img.caption,
        source: img.sourceCredit,
        category: img.category
      }))
  ];

  function openKingdomLightbox(url: string, title?: string, caption?: string, source?: string) {
    if (!isMeaningfulValue(url)) return;
    const idx = allKingdomImages.findIndex((x) => x.url === url);
    if (idx >= 0) {
      setLightboxState({ items: allKingdomImages, index: idx });
    } else {
      setLightboxState({
        items: [{ url, title: title || k.officialName, caption, source }, ...allKingdomImages],
        index: 0
      });
    }
  }

  const kingdomInfoboxRows = [
    ...filterMeaningfulRows([
      ["Tên cổ đại", k.ancientName],
      ["Thủ đô", dossier.territory.capitalName],
      ["Lục địa", k.continent],
      ["Khối / Liên minh", k.bloc],
      ["Thể chế", k.governmentType],
      [
        "Diện tích",
        dossier.territory.areaKm2 > 0
          ? `${dossier.territory.areaKm2.toLocaleString("vi-VN")} km²`
          : ""
      ],
      [
        "Dân số mới nhất",
        latestPop && latestPop.totalPopulation > 0
          ? `${latestPop.totalPopulation.toLocaleString("vi-VN")} người`
          : ""
      ],
      ["GDP mới nhất", latestEcon?.gdpLabel],
      [
        "Tiền tệ",
        k.currencyName ? `${k.currencyName}${k.currencyCode ? ` (${k.currencyCode})` : ""}` : ""
      ],
      ["Ngôn ngữ", k.officialLanguages],
      ["Múi giờ", k.timezone],
      ["Quốc ấn", dossier.symbols.nationalSeal],
      ["Linh vật", dossier.symbols.nationalMascot]
    ]),
    ...getPinnedInfoboxRows(kLayout, canEdit)
  ];

  const sidebarContent = (
    <div className="space-y-4">
      <div className="codex-card rounded-2xl p-4 space-y-2 text-xs">
        <div className="font-display font-bold text-sm text-[var(--accent)] border-b border-[var(--border-subtle)] pb-2 flex justify-between">
          <span>⚜ Hồ sơ Địa chính trị</span>
          <span className="font-mono text-[11px]">{k.id}</span>
        </div>

        {/* Clickable Flag & Coat of Arms in Infobox when uploaded */}
        {(isMeaningfulValue(dossier.symbols.flagUrl) || isMeaningfulValue(dossier.symbols.coatOfArmsUrl)) && (
          <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-[var(--border-subtle)]/50">
            {isMeaningfulValue(dossier.symbols.flagUrl) && (
              <button
                type="button"
                onClick={() => openKingdomLightbox(dossier.symbols.flagUrl, `${k.officialName} — Quốc kỳ`)}
                className="rounded-lg overflow-hidden border border-white/15 bg-black/40 p-1 text-center cursor-zoom-in"
                title="Nhấn xem Quốc kỳ kích thước lớn"
              >
                <img src={dossier.symbols.flagUrl} alt="Quốc kỳ" className="h-14 w-full object-contain" />
                <div className="text-[10px] text-[#AEB7C4] mt-0.5">Quốc kỳ</div>
              </button>
            )}
            {isMeaningfulValue(dossier.symbols.coatOfArmsUrl) && (
              <button
                type="button"
                onClick={() => openKingdomLightbox(dossier.symbols.coatOfArmsUrl, `${k.officialName} — Quốc huy`)}
                className="rounded-lg overflow-hidden border border-white/15 bg-black/40 p-1 text-center cursor-zoom-in"
                title="Nhấn xem Quốc huy kích thước lớn"
              >
                <img src={dossier.symbols.coatOfArmsUrl} alt="Quốc huy" className="h-14 w-full object-contain" />
                <div className="text-[10px] text-[#AEB7C4] mt-0.5">Quốc huy</div>
              </button>
            )}
          </div>
        )}

        {kingdomInfoboxRows.map(([label, val], idx) => (
          <div key={`${label}-${idx}`} className="flex justify-between gap-2 border-b border-[var(--border-subtle)]/40 pb-1">
            <span className="text-[var(--text-muted)] shrink-0">{label}</span>
            <span className="text-right font-medium text-[var(--text-primary)]">{val}</span>
          </div>
        ))}

        <div className="pt-2 space-y-1.5">
          {k.linkedAtlasNationId && onViewOnAtlas && (
            <button
              type="button"
              onClick={() => onViewOnAtlas(k.linkedAtlasNationId!)}
              className="w-full py-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Globe2 className="w-3.5 h-3.5" /> Bay tới trên Bản đồ 360
            </button>
          )}
          {k.linkedWikiEntryId && onOpenWikiEntry && (
            <button
              type="button"
              onClick={() => onOpenWikiEntry(k.linkedWikiEntryId!)}
              className="w-full py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" /> Mở bài Wiki Đầy đủ
            </button>
          )}
        </div>
      </div>

      {/* Neighbor Kingdoms */}
      {dossier.territory.neighborKingdomIds.length > 0 && (
        <div className="codex-card rounded-2xl p-4 space-y-2 text-xs">
          <div className="font-display font-bold text-sm text-[var(--accent)]">✦ Quốc gia Giáp ranh ({dossier.territory.neighborKingdomIds.length})</div>
          <div className="flex flex-wrap gap-1.5">
            {dossier.territory.neighborKingdomIds.slice(0, 10).map((nid) => (
              <button
                key={nid}
                type="button"
                onClick={() => onOpenKingdom(nid)}
                className="px-2 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 hover:border-[var(--accent)] text-[11px] font-mono cursor-pointer"
              >
                {nid}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const filteredTimeline =
    timelineCatFilter === "all"
      ? dossier.events
      : dossier.events.filter((e) => e.category === timelineCatFilter);

  return (
    <div className="space-y-4 animate-codex-fade-up">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kingdom Codex (360+ Quốc gia)
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowVersions(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[var(--accent)]" /> Phiên bản ({versions.length})
          </button>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${k.id}-${k.commonName.toLowerCase().replace(/\s+/g, "-")}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
          <button
            type="button"
            onClick={() =>
              exportShareableCodexCardPng({
                id: k.id,
                title: k.officialName,
                subtitle: `${k.governmentType} · ${k.continent}`,
                badge: k.polityType.toUpperCase(),
                summary: k.summary,
                accentColor: accent,
                stats: [
                  { label: "Dân số", value: latestPop ? latestPop.totalPopulation.toLocaleString("vi-VN") : "—" },
                  { label: "Diện tích", value: `${dossier.territory.areaKm2.toLocaleString("vi-VN")} km²` },
                  { label: "GDP", value: latestEcon ? `${latestEcon.gdpValue.toLocaleString("vi-VN")}M` : "—" },
                  { label: "Thủ đô", value: dossier.territory.capitalName || "—" }
                ]
              })
            }
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs cursor-pointer"
            title="Xuất thẻ tóm tắt PNG để chia sẻ"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Thẻ PNG
          </button>
          {onOpenHeraldry && (
            <button
              type="button"
              onClick={() => onOpenHeraldry(k.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#C6A568]/50 bg-[#C6A568]/15 text-[#E9DFC9] text-xs font-semibold cursor-pointer hover:brightness-110"
              title="Thiết kế hoặc nâng cấp Quốc huy trong Royal Heraldry Studio"
            >
              <Shield className="w-3.5 h-3.5 text-[#C6A568]" /> Xưởng Huy hiệu
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              toggleCodexBookmark({
                id: k.id,
                kind: "kingdom",
                title: k.officialName,
                subtitle: `${k.continent} · ${k.governmentType}`,
                sigil: "👑"
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
                onClick={() => onClone(k.id, k.officialName)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 text-xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Nhân bản mẫu
              </button>
              <button
                type="button"
                onClick={() => onEdit(dossier)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa 18 nhóm
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

      {/* Grand Strategy Hero Section — Imperial Editorial Banner */}
      <div
        className="relative rounded-2xl border p-5 sm:p-7 overflow-hidden shadow-2xl"
        style={{
          borderColor: `${accent}66`
        }}
      >
        <img
          src={dossier.symbols.coverImageUrl || dossier.symbols.capitalImageUrl || "/art/kingdom-editorial-cover.svg"}
          alt={k.officialName}
          onClick={() => {
            const heroUrl = dossier.symbols.coverImageUrl || dossier.symbols.capitalImageUrl;
            if (isMeaningfulValue(heroUrl)) {
              openKingdomLightbox(heroUrl!, `${k.officialName} — Ảnh bìa`, k.summary);
            }
          }}
          className={`absolute inset-0 w-full h-full object-cover opacity-45 ${
            isMeaningfulValue(dossier.symbols.coverImageUrl || dossier.symbols.capitalImageUrl)
              ? "cursor-zoom-in"
              : ""
          }`}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(125deg, rgba(16,21,34,0.92) 0%, rgba(29,38,54,0.78) 55%, rgba(16,21,34,0.88) 100%)`
          }}
        />
        {isMeaningfulValue(dossier.symbols.coverImageUrl || dossier.symbols.capitalImageUrl) && (
          <button
            type="button"
            onClick={() => {
              const heroUrl = (dossier.symbols.coverImageUrl || dossier.symbols.capitalImageUrl)!;
              openKingdomLightbox(heroUrl, `${k.officialName} — Ảnh bìa`, k.summary);
            }}
            className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-black/65 border border-white/15 text-[10px] text-amber-200 hover:border-amber-400/50 cursor-pointer"
          >
            Xem ảnh bìa lớn
          </button>
        )}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {isMeaningfulValue(dossier.symbols.coatOfArmsUrl) ? (
            <button
              type="button"
              onClick={() => openKingdomLightbox(dossier.symbols.coatOfArmsUrl, `${k.officialName} — Quốc huy`, dossier.symbols.royalSymbol)}
              className="shrink-0 rounded-2xl overflow-hidden border border-amber-400/40 bg-black/40 p-1.5 cursor-zoom-in"
              title="Nhấn để phóng to Quốc huy"
            >
              <img
                src={dossier.symbols.coatOfArmsUrl}
                alt={`Quốc huy ${k.officialName}`}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />
            </button>
          ) : (
            <EntityEmblemSVG config={dossier.symbols.emblemConfig} sigil="⚜" size={isMobile ? 62 : 76} />
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-mono px-2 py-0.5 rounded-full bg-black/45 border border-white/15 text-[var(--accent)] font-bold">
                {k.id}
              </span>
              <span className="px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
                {k.workflowStatus.toUpperCase()}
              </span>
              {isMeaningfulValue(joinMeaningfulParts([k.continent, k.bloc])) && (
                <span className="px-2 py-0.5 rounded-full border border-amber-400/40 bg-amber-500/15 text-amber-200">
                  {joinMeaningfulParts([k.continent, k.bloc])}
                </span>
              )}
              {isMeaningfulValue(dossier.territory.capitalName) && (
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[var(--text-secondary)]">
                  Thủ đô: <strong>{dossier.territory.capitalName}</strong>
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {k.officialName}
            </h1>
            {isMeaningfulValue(k.motto) && (
              <div className="text-xs italic text-[var(--accent)]">“{k.motto}”</div>
            )}
            {isMeaningfulValue(k.summary) && (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">
                {k.summary}
              </p>
            )}

            {primaryRuler && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[var(--text-muted)]">Đứng đầu:</span>
                {primaryRuler.linkedCharacter && onOpenCharacter ? (
                  <button
                    type="button"
                    onClick={() => onOpenCharacter(primaryRuler.linkedCharacter!.id)}
                    className="font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    {primaryRuler.linkedCharacter.symbol} {primaryRuler.linkedCharacter.fullName} ({primaryRuler.linkedCharacter.id})
                  </button>
                ) : (
                  <strong className="text-[var(--text-primary)]">{primaryRuler.fallbackName}</strong>
                )}
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
            <span className="flex items-center gap-2"><Landmark className="w-4 h-4" /> Hồ sơ Địa chính trị &amp; Láng giềng</span>
            {mobileSidebarOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {mobileSidebarOpen && <div className="mt-2">{sidebarContent}</div>}
        </div>
      )}

      {/* Main Content + Sticky Sidebar */}
      <div className={`grid grid-cols-1 ${isMobile ? "" : "lg:grid-cols-12"} gap-5 items-start`}>
        <div className={isMobile ? "space-y-4" : "lg:col-span-8 space-y-4"}>
          {/* Navigation Tabs (Supports Renamed/Hidden Built-in Tabs + Custom Tabs) */}
          <DraggableScrollArea ariaLabel="Các mục hồ sơ vương quốc" innerClassName="flex gap-1.5 px-1">
            {[
              ...KINGDOM_TABS.filter((t) => !(kLayout?.hiddenBuiltInTabs || []).includes(t.id)).map((t) => ({
                id: t.id,
                label: kLayout?.renamedBuiltInTabs?.[t.id] || t.label
              })),
              ...(kLayout?.customTabs || []).map((ct) => ({
                id: ct.id,
                label: ct.sigil ? `${ct.sigil} ${ct.label}` : ct.label
              }))
            ].map((t) => (
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

          {/* Tab Panel */}
          <div className="codex-card rounded-2xl p-4 sm:p-5 space-y-4 text-xs">
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> 14 Chỉ số Quốc gia Độc lập (Kèm Thời điểm &amp; Nguồn)
                  </h3>
                  <span className="text-[11px] text-[var(--text-muted)]">Không gộp thành 1 điểm đơn lẻ</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dossier.statistics.map((st) => (
                    <div key={st.key} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">{st.label}</span>
                        <span className="font-mono font-bold text-[var(--accent)]">{st.score}/100</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full economy-bar-fill bg-gradient-to-r from-amber-500 to-cyan-400" style={{ width: `${st.score}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                        <span>{st.rawValue || st.tierLabel}</span>
                        <span>{joinMeaningfulParts([st.evaluatedAt, st.sourceNote])}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="overview"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "geography" && (
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <MapIcon className="w-4 h-4" /> Địa lý, Biên giới Thực tế &amp; Hành chính
                </h3>
                {/* Real Atlas Territory Polygon Preview (only rendered when real polygon exists!) */}
                {dossier.territory.atlasSvgPath && dossier.territory.atlasBbox && (
                  <div className="rounded-xl border border-cyan-500/35 bg-[#061326] p-3 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-cyan-300">
                      <span>Bản đồ Lãnh thổ Thực tế (Dữ liệu Polygon từ Đại Bản Đồ 360)</span>
                      <span className="font-mono">{dossier.territory.areaKm2.toLocaleString("vi-VN")} km²</span>
                    </div>
                    <svg
                      viewBox={`${Math.max(0, dossier.territory.atlasBbox.minX * 1600 - 25)} ${Math.max(0, dossier.territory.atlasBbox.minY * 900 - 25)} ${Math.max(60, (dossier.territory.atlasBbox.maxX - dossier.territory.atlasBbox.minX) * 1600 + 50)} ${Math.max(60, (dossier.territory.atlasBbox.maxY - dossier.territory.atlasBbox.minY) * 900 + 50)}`}
                      className="w-full h-44 rounded-lg bg-[#081c34]"
                    >
                      <path
                        d={dossier.territory.atlasSvgPath}
                        fill={accent}
                        fillOpacity={0.62}
                        stroke="#fbbf24"
                        strokeWidth={2}
                      />
                    </svg>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filterMeaningfulRows([
                    ["Vị trí", dossier.territory.geoLocation],
                    ["Biên giới", dossier.territory.borderDescription],
                    ["Địa hình", dossier.territory.terrainSummary],
                    ["Khí hậu", dossier.territory.climateSummary]
                  ]).map(([label, value]) => (
                    <div key={label}>
                      <strong>{label}:</strong> {value}
                    </div>
                  ))}
                </div>

                {dossier.regions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                    <div className="font-semibold text-[var(--accent)]">Thành phố &amp; Vùng Hành chính ({dossier.regions.length})</div>
                    {dossier.regions.map((r) => (
                      <div key={r.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-[10px] text-cyan-300 mr-2">{r.id}</span>
                          <strong>{r.name}</strong>
                          {isMeaningfulValue(r.description) && (
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{r.description}</p>
                          )}
                        </div>
                        {r.population ? <span className="font-mono text-[11px] shrink-0">{r.population.toLocaleString("vi-VN")} dân</span> : null}
                      </div>
                    ))}
                  </div>
                )}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="geography"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "population" && (
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <Users className="w-4 h-4" /> Biến động Dân số theo Năm &amp; Xã hội
                </h3>
                {/* Population Growth Bar Chart */}
                {dossier.populationHistory.length > 0 && (
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-4">
                    <div className="text-[11px] text-[var(--text-muted)] mb-3">Tăng trưởng Dân số (người)</div>
                    <div className="grid grid-cols-3 gap-3 items-end h-36">
                      {dossier.populationHistory.map((p) => {
                        const maxP = Math.max(...dossier.populationHistory.map((x) => x.totalPopulation), 1);
                        const hPct = Math.max(15, Math.round((p.totalPopulation / maxP) * 100));
                        return (
                          <div key={p.id} className="flex flex-col items-center gap-1 h-full justify-end">
                            <span className="font-mono text-[10px] text-cyan-300">{(p.totalPopulation / 1_000_000).toFixed(2)}M</span>
                            <div className="w-12 rounded-t-lg bg-gradient-to-t from-sky-600 to-cyan-400" style={{ height: `${hPct}%` }} />
                            <span className="font-mono text-[11px] font-bold">Năm {p.year}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {latestPop && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filterMeaningfulRows([
                      ["Đô thị hóa / Nông thôn", `${latestPop.urbanizationPct}% / ${latestPop.ruralPct}%`],
                      ["Tuổi thọ trung bình", latestPop.avgLifespan ? `${latestPop.avgLifespan} tuổi` : ""],
                      ["Giáo dục", latestPop.educationSummary],
                      ["Y tế & An sinh", joinMeaningfulParts([latestPop.healthcareSummary, latestPop.socialWelfare])]
                    ]).map(([label, value]) => (
                      <div key={label}>
                        <strong>{label}:</strong> {value}
                      </div>
                    ))}
                  </div>
                )}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="population"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "politics" && (
              <div className="space-y-2.5">
                <h3 className="font-display text-base font-bold text-[var(--accent)]">Hệ thống Chính trị &amp; Chính quyền</h3>
                {filterMeaningfulRows([
                  ["Thể chế chính trị", dossier.government.politicalSystem],
                  ["Cấu trúc nhà nước", dossier.government.stateStructure],
                  ["Hiến pháp", dossier.government.constitution],
                  ["Hệ thống pháp luật", dossier.government.lawSystem],
                  ["Lập pháp", dossier.government.legislature],
                  ["Hành pháp", dossier.government.executive],
                  ["Tư pháp", dossier.government.judiciary],
                  ["Cơ chế kế vị / bầu cử", joinMeaningfulParts([dossier.government.successionMechanism, dossier.government.electionMechanism])],
                  ["Ổn định chính trị", dossier.government.politicalStability]
                ]).map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-2.5">
                    <span className="text-[var(--text-muted)]">{label}: </span>
                    <strong className="text-[var(--text-primary)]">{value}</strong>
                  </div>
                ))}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="politics"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "royalty" && (
              <div className="space-y-3">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <Crown className="w-4 h-4" /> Hoàng gia &amp; Nguyên thủ (Liên kết trực tiếp Character Codex)
                </h3>
                {dossier.rulers.map((r) => (
                  <div key={r.id} className="rounded-xl border border-amber-500/35 bg-amber-500/5 p-3.5 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-sm text-amber-200">
                        {r.linkedCharacter ? (
                          <button
                            type="button"
                            onClick={() => onOpenCharacter?.(r.linkedCharacter!.id)}
                            className="hover:underline cursor-pointer"
                          >
                            {r.linkedCharacter.symbol} {r.linkedCharacter.fullName} ({r.linkedCharacter.id}) →
                          </button>
                        ) : (
                          r.fallbackName
                        )}
                      </div>
                      {isMeaningfulValue(r.roleTitle) && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[10px]">{r.roleTitle}</span>
                      )}
                    </div>
                    {isMeaningfulValue(joinMeaningfulParts([r.dynasty, r.reignStart, r.reignEnd])) && (
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {isMeaningfulValue(r.dynasty) ? `Triều đại: ${r.dynasty}` : ""}{" "}
                        {isMeaningfulValue(r.reignStart) ? `· Trị vì: ${r.reignStart}${isMeaningfulValue(r.reignEnd) ? ` → ${r.reignEnd}` : ""}` : ""}
                      </div>
                    )}
                    {isMeaningfulValue(r.note) && <div className="text-[11px] text-[var(--text-muted)]">{r.note}</div>}
                  </div>
                ))}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="royalty"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "economy" && (
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <Coins className="w-4 h-4" /> Kinh tế &amp; Tài chính Quốc gia (Đa năm)
                </h3>
                {/* GDP Growth Chart */}
                {dossier.economyHistory.length > 0 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="text-[11px] text-amber-200 mb-3 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Biểu đồ Tăng trưởng GDP theo Năm ({k.currencyCode})
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-end h-36">
                      {dossier.economyHistory.map((ec) => {
                        const maxG = Math.max(...dossier.economyHistory.map((x) => x.gdpValue), 1);
                        const hPct = Math.max(15, Math.round((ec.gdpValue / maxG) * 100));
                        return (
                          <div key={ec.id} className="flex flex-col items-center gap-1 h-full justify-end">
                            <span className="font-mono text-[10px] text-amber-300">{ec.gdpValue.toLocaleString("vi-VN")}M</span>
                            <div className="w-12 rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-300" style={{ height: `${hPct}%` }} />
                            <span className="font-mono text-[11px] font-bold">Năm {ec.year}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {latestEcon && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filterMeaningfulRows([
                      ["GDP / GDP bình quân", joinMeaningfulParts([latestEcon.gdpLabel, latestEcon.gdpPerCapitaLabel])],
                      ["Ngân sách (Thu / Chi)", joinMeaningfulParts([latestEcon.budgetRevenue, latestEcon.budgetExpenditure], " / ")],
                      ["Lạm phát / Thất nghiệp / Nợ công", joinMeaningfulParts([`${latestEcon.inflationPct}%`, `${latestEcon.unemploymentPct}%`, latestEcon.publicDebt])],
                      ["Cơ cấu 4 ngành", `Nông ${latestEcon.agriculturePct}% · Công ${latestEcon.industryPct}% · Thương ${latestEcon.tradePct}% · Dịch vụ ${latestEcon.servicesPct}%`],
                      ["Xuất khẩu chủ lực", latestEcon.majorExports.join(", ")],
                      ["Ngân hàng Trung ương", joinMeaningfulParts([latestEcon.centralBank, latestEcon.currencyValueNote], " · ")]
                    ]).map(([label, value]) => (
                      <div key={label}>
                        <strong>{label}:</strong> {value}
                      </div>
                    ))}
                  </div>
                )}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="economy"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "military" && (
              <div className="space-y-2.5">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Quân sự &amp; Học thuyết Quốc phòng (Tổng quan Thế giới Giả tưởng)
                </h3>
                {filterMeaningfulRows([
                  ["Quy mô lực lượng", dossier.military.totalForceScale],
                  ["Lục quân", dossier.military.armyOverview],
                  ["Hải quân", dossier.military.navyOverview],
                  ["Không quân / Trinh sát", dossier.military.airForceOverview],
                  ["Vệ binh Hoàng gia", dossier.military.royalGuard],
                  ["Học thuyết Quốc phòng", dossier.military.defenseDoctrine],
                  ["Học viện Quân sự", dossier.military.militaryAcademies.join(", ")]
                ]).map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-2.5">
                    <span className="text-[var(--text-muted)]">{label}: </span>
                    <strong className="text-[var(--text-primary)]">{value}</strong>
                  </div>
                ))}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="military"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "technology" && (
              <div className="space-y-2.5">
                <h3 className="font-display text-base font-bold text-[var(--accent)]">Công nghệ, Khoa học &amp; Ma pháp</h3>
                {filterMeaningfulRows([
                  ["Trình độ văn minh", dossier.technology.civilizationLevel],
                  ["Cấp độ kỹ thuật", dossier.technology.techLevel],
                  ["Khoa học & Y học", joinMeaningfulParts([dossier.technology.naturalSciences, dossier.technology.medicine])],
                  ["Năng lượng & Giao thông", joinMeaningfulParts([dossier.technology.energyTech, dossier.technology.transportationTech])],
                  ["Hệ thống Ma pháp / Siêu nhiên", joinMeaningfulParts([dossier.technology.magicSystem, dossier.technology.supernaturalEnergy])],
                  ["Công nghệ độc quyền", dossier.technology.exclusiveTech.join(", ")],
                  ["Di sản cổ đại", dossier.technology.ancientTechLegacy]
                ]).map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-2.5">
                    <span className="text-[var(--text-muted)]">{label}: </span>
                    <strong className="text-[var(--text-primary)]">{value}</strong>
                  </div>
                ))}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="technology"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "culture" && (
              <div className="space-y-2.5">
                <h3 className="font-display text-base font-bold text-[var(--accent)]">Văn hóa, Giáo dục &amp; Tôn giáo</h3>
                {filterMeaningfulRows([
                  ["Bản sắc văn hóa", dossier.culture.culturalIdentity],
                  ["Nghệ thuật & Kiến trúc", joinMeaningfulParts([dossier.culture.arts, dossier.culture.architecture])],
                  ["Ẩm thực & Trang phục", joinMeaningfulParts([dossier.culture.cuisine, dossier.culture.traditionalDress])],
                  ["Hệ thống Giáo dục", dossier.culture.educationSystem],
                  ["Đại học & Học viện", dossier.culture.universitiesAndAcademies.join(", ")],
                  ["Tôn giáo & Thần thoại", joinMeaningfulParts([dossier.culture.religions.join(", "), dossier.culture.mythology])],
                  ["Ngày lễ Quốc gia", dossier.culture.nationalHolidays.join(", ")]
                ]).map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-2.5">
                    <span className="text-[var(--text-muted)]">{label}: </span>
                    <strong className="text-[var(--text-primary)]">{value}</strong>
                  </div>
                ))}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="culture"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "infrastructure" && (
              <div className="space-y-2.5">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Cơ sở Hạ tầng &amp; Đô thị (Điểm phát triển {dossier.infrastructure.developmentScore}/100)
                </h3>
                {filterMeaningfulRows([
                  ["Giao thông tổng quan", dossier.infrastructure.transportSystem],
                  ["Đường bộ & Đường sắt", joinMeaningfulParts([dossier.infrastructure.roads, dossier.infrastructure.railways])],
                  ["Cảng biển & Khí cầu", joinMeaningfulParts([dossier.infrastructure.seaports, dossier.infrastructure.airports])],
                  ["Năng lượng, Nước & Viễn thông", joinMeaningfulParts([dossier.infrastructure.energyGrid, dossier.infrastructure.waterSupply, dossier.infrastructure.telecom])],
                  ["Công trình biểu tượng", dossier.infrastructure.iconicLandmarks.join(", ")]
                ]).map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-2.5">
                    <span className="text-[var(--text-muted)]">{label}: </span>
                    <strong className="text-[var(--text-primary)]">{value}</strong>
                  </div>
                ))}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="infrastructure"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "diplomacy" && (
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <Handshake className="w-4 h-4" /> Quan hệ Quốc tế &amp; Hiệp ước ({dossier.relations.length} quan hệ)
                </h3>
                {dossier.relations.length > 0 && (
                  <div className="space-y-2">
                    {dossier.relations.map((rel) => (
                      <div key={rel.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <button
                            type="button"
                            onClick={() => onOpenKingdom(rel.kingdomBId)}
                            className="font-bold text-sm text-[var(--accent)] hover:underline cursor-pointer"
                          >
                            {rel.kingdomBName} ({rel.kingdomBId})
                          </button>
                          <div className="text-[11px] text-[var(--text-muted)]">{joinMeaningfulParts([rel.originCause, isMeaningfulValue(rel.startDate) ? `Từ ${rel.startDate}` : ""])}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${rel.intensity >= 50 ? "bg-emerald-500/15 text-emerald-300" : rel.intensity < 0 ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300"}`}>
                          {rel.relationType} ({rel.intensity > 0 ? `+${rel.intensity}` : rel.intensity})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="diplomacy"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-3">
                <h3 className="font-display text-base font-bold text-[var(--accent)]">Lịch sử Hình thành &amp; Phát triển</h3>
                {dossier.events.map((ev) => (
                  <div key={ev.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3.5 space-y-1">
                    <div className="font-bold text-sm text-[var(--accent)]">Năm {ev.year} — {ev.title} {isMeaningfulValue(ev.era) ? `(${ev.era})` : ""}</div>
                    {isMeaningfulValue(ev.summary) && <p className="text-[var(--text-secondary)]">{ev.summary}</p>}
                    {isMeaningfulValue(joinMeaningfulParts([ev.outcome, ev.longTermImpact])) && (
                      <div className="text-[11px] text-emerald-300">
                        {joinMeaningfulParts([
                          isMeaningfulValue(ev.outcome) ? `Kết quả: ${ev.outcome}` : "",
                          isMeaningfulValue(ev.longTermImpact) ? `Tác động: ${ev.longTermImpact}` : ""
                        ])}
                      </div>
                    )}
                  </div>
                ))}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="history"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "achievements" && (
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <Award className="w-4 h-4" /> Thành tựu, Di sản &amp; Tài nguyên Quốc gia
                </h3>
                {dossier.achievements.map((a) => (
                  <div key={a.id} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                    <div className="font-bold text-sm text-amber-200">{a.title} {isMeaningfulValue(a.dateLabel) ? `(${a.dateLabel})` : ""}</div>
                    {isMeaningfulValue(a.description) && <p className="text-[var(--text-secondary)] mt-0.5">{a.description}</p>}
                  </div>
                ))}
                {dossier.resources.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
                    {dossier.resources.map((r) => (
                      <div key={r.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3">
                        <div className="font-bold text-emerald-300">{r.name}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{joinMeaningfulParts([r.regionName, r.description])}</div>
                      </div>
                    ))}
                  </div>
                )}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="achievements"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Dòng Thời gian Quốc gia ({filteredTimeline.length})
                  </h3>
                  <select value={timelineCatFilter} onChange={(e) => setTimelineCatFilter(e.target.value)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1 text-xs">
                    <option value="all">Tất cả lĩnh vực</option>
                    <option value="founding">Thành lập</option>
                    <option value="peace_treaty">Hòa ước</option>
                    <option value="reform">Cải cách</option>
                    <option value="war">Chiến tranh</option>
                    <option value="economic_milestone">Kinh tế</option>
                  </select>
                </div>
                {filteredTimeline.map((ev) => (
                  <div key={ev.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3">
                    <div className="flex justify-between font-bold text-[var(--accent)]">
                      <span>Năm {ev.year}: {ev.title}</span>
                      <span className="font-mono text-[10px]">{ev.id}</span>
                    </div>
                    {isMeaningfulValue(ev.summary) && <div className="text-[var(--text-secondary)] mt-1">{ev.summary}</div>}
                  </div>
                ))}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="timeline"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "gallery" && (
              <div className="space-y-3">
                <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Thư viện Hình ảnh Quốc gia ({dossier.images.length})
                </h3>
                {dossier.images.length === 0 ? (
                  <p className="text-[var(--text-muted)]">Chưa có ảnh bổ sung. Bạn có thể thêm Quốc kỳ, Thủ đô hoặc Kiến trúc trong trình Chỉnh sửa.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {dossier.images.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => openKingdomLightbox(img.url, img.caption || k.officialName, img.caption, img.sourceCredit)}
                        className="group rounded-xl overflow-hidden border border-[var(--border-subtle)] hover:border-amber-400/50 text-left cursor-zoom-in transition"
                      >
                        <img src={img.thumbUrl || img.url} alt={img.caption} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        {isMeaningfulValue(img.caption) && <div className="p-2 text-[11px] truncate">{img.caption}</div>}
                      </button>
                    ))}
                  </div>
                )}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="gallery"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {activeTab === "sources" && (
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-[var(--accent)]">Nguồn Tham khảo, Xác thực &amp; Trường Dữ liệu Động</h3>
                {dossier.sources.map((s) => (
                  <div key={s.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3">
                    <div className="font-bold">{s.title} <span className="font-mono text-[10px] text-emerald-300">[{s.verificationStatus}]</span></div>
                    {isMeaningfulValue(joinMeaningfulParts([s.author, s.editorialNote])) && (
                      <div className="text-[11px] text-[var(--text-muted)]">{joinMeaningfulParts([s.author, s.editorialNote])}</div>
                    )}
                  </div>
                ))}
                {dossier.customFields.filter(({ value }) => isMeaningfulValue(value)).length > 0 && (
                  <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                    <div className="font-semibold text-[var(--accent)]">
                      Trường Dữ liệu Động ({dossier.customFields.filter(({ value }) => isMeaningfulValue(value)).length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dossier.customFields
                        .filter(({ value }) => isMeaningfulValue(value))
                        .map(({ definition, value }) => (
                          <div key={definition.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-2.5">
                            <div className="text-[10px] text-[var(--text-muted)]">[{definition.groupName}] {definition.label}</div>
                            <div className="font-semibold mt-0.5">{String(value)}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId="sources"
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}

            {/* Custom Tab Panel */}
            {(kLayout?.customTabs || []).some((ct) => ct.id === activeTab) && (
              <div className="space-y-4">
                <CustomProfileBlocksRenderer
                  layout={kLayout}
                  tabId={activeTab}
                  onOpenImage={(url, title, cap) => openKingdomLightbox(url, title, cap)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sticky Sidebar */}
        {!isMobile && <aside className="hidden lg:block lg:col-span-4 sticky top-20">{sidebarContent}</aside>}
      </div>

      {/* Versions Modal */}
      {showVersions && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
              <h3 className="font-display font-bold text-base text-[var(--accent)]">Lịch sử Phiên bản ({versions.length})</h3>
              <button type="button" onClick={() => setShowVersions(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {versions.length === 0 ? (
                <p className="text-[var(--text-muted)]">Hồ sơ đang ở bản chuẩn gốc từ Đại Bản Đồ 360.</p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold">v{v.versionNumber} · {v.editorName}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{v.changeNote}</div>
                    </div>
                    {canEdit && (
                      <button type="button" onClick={() => handleRestore(v.versionNumber)} className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 flex items-center gap-1 cursor-pointer">
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

      {lightboxState && (
        <ImageLightboxModal
          images={lightboxState.items}
          initialIndex={lightboxState.index}
          onClose={() => setLightboxState(null)}
        />
      )}
    </div>
  );
}
