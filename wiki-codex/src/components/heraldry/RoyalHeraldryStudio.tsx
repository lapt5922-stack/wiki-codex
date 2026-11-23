"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  Download,
  Eye,
  EyeOff,
  Flag,
  FlipHorizontal,
  FlipVertical,
  FolderHeart,
  Grid,
  History,
  Layers,
  Lock,
  Magnet,
  Package,
  Palette,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Type,
  Undo2,
  Unlock,
  Upload,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import type {
  FieldDivisionId,
  HeraldryDesignData,
  HeraldryLayer,
  HeraldryPreviewMode,
  HeraldrySavedDesign,
  HeraldryTemplateItem,
  HeraldryVersionRecord,
  OrnamentId,
  ShieldShapeId,
  SymbolCategoryId
} from "@/types/heraldry";
import {
  FIELD_DIVISIONS,
  HERALDIC_COLORS,
  SHIELD_GEOMETRY_PRESETS,
  SHIELD_SHAPES,
  computeContrastRatio
} from "@/lib/heraldry/shapes-and-palettes";
import {
  EXTERNAL_ORNAMENTS,
  HERALDIC_SYMBOLS,
  SYMBOL_CATEGORY_LABELS
} from "@/lib/heraldry/symbols-and-ornaments";
import {
  CATEGORY_LABELS,
  STYLE_LABELS
} from "@/lib/heraldry/template-catalog";
import { exportHeraldryFile } from "@/lib/heraldry/renderer-and-export";
import { uploadImageToVault } from "@/lib/client-image-optimizer";
import { useDeviceUI } from "@/lib/device-ui";
import { DraggableScrollArea } from "../DraggableScrollArea";
import { HeraldrySvgPreview } from "./HeraldrySvgPreview";
import { FlagBannerStudio } from "./FlagBannerStudio";
import { HeraldryExpansionHub, type ExpansionSubMode } from "./HeraldryExpansionHub";

interface RoyalHeraldryStudioProps {
  workspaceId: string;
  canEdit: boolean;
  initialKingdomId?: string | null;
  onAppliedToKingdom?: (kingdomId: string) => void;
}

const DEFAULT_BLANK_DESIGN: HeraldryDesignData = {
  canvasSize: 600,
  backgroundMode: "transparent",
  backgroundColor: "#101522",
  shield: {
    shape: "royal",
    widthScale: 1,
    heightScale: 1,
    topCurve: 0,
    bottomPoint: 0,
    borderWidth: 9,
    innerBorder: true,
    borderColor: "#C6A568",
    fieldDivision: "quarterly",
    primaryColor: "#6D3D49",
    secondaryColor: "#101522",
    tertiaryColor: "#C6A568",
    metallicEffect: true
  },
  layers: [
    {
      id: "lyr-init-1",
      name: "Sư tử Hoàng gia",
      kind: "symbol",
      visible: true,
      locked: false,
      x: 300,
      y: 295,
      scale: 1.9,
      rotation: 0,
      opacity: 1,
      color: "#E9DFC9",
      symbolId: "sym-lion"
    },
    {
      id: "lyr-init-crown",
      name: "Vương miện Đế chế",
      kind: "ornament",
      visible: true,
      locked: false,
      x: 300,
      y: 300,
      scale: 1,
      rotation: 0,
      opacity: 1,
      color: "#C6A568",
      ornamentId: "imperial_crown"
    }
  ],
  motto: {
    enabled: true,
    text: "AETHEL · VINH QUANG TRƯỜNG TỒN",
    ribbonColor: "#1D2636",
    textColor: "#E9DFC9",
    fontFamily: "Cinzel",
    fontSize: 16,
    curved: true
  },
  uploadedMode: "none"
};

type LeftToolTab =
  | "templates"
  | "shapes"
  | "symbols"
  | "ornaments"
  | "text"
  | "upload"
  | "ai"
  | "library";

const PREVIEW_MODES: Array<{ id: HeraldryPreviewMode; label: string }> = [
  { id: "standard", label: "Chuẩn Hoàng gia" },
  { id: "transparent", label: "Nền trong suốt" },
  { id: "dark", label: "Nền tối Midnight" },
  { id: "light", label: "Nền sáng Ivory" },
  { id: "royal_document", label: "Văn kiện Hoàng gia" },
  { id: "kingdom_flag", label: "Quốc kỳ 3:2" },
  { id: "royal_banner", label: "Cờ hiệu Dọc" },
  { id: "official_seal", label: "Đại ấn Sáp đỏ" },
  { id: "profile_card", label: "Thẻ Quốc gia" },
  { id: "archive_card", label: "Tư liệu Lịch sử" }
];

export function RoyalHeraldryStudio({
  workspaceId,
  canEdit,
  initialKingdomId,
  onAppliedToKingdom
}: RoyalHeraldryStudioProps) {
  const { isMobile, isTablet } = useDeviceUI();

  // Design State + Undo / Redo History
  const [design, setDesign] = useState<HeraldryDesignData>(() => structuredClone(DEFAULT_BLANK_DESIGN));
  const [past, setPast] = useState<HeraldryDesignData[]>([]);
  const [future, setFuture] = useState<HeraldryDesignData[]>([]);
  const [designId, setDesignId] = useState<string | undefined>(undefined);
  const [designName, setDesignName] = useState("Quốc huy Hoàng gia Mới");
  const [linkedKingdomId, setLinkedKingdomId] = useState(initialKingdomId || "KING-000001");
  const [eraLabel, setEraLabel] = useState("Thời đại Hiện tại");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>("lyr-init-1");
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [studioModule, setStudioModule] = useState<"composer" | "flags" | ExpansionSubMode>("composer");
  const [leftTab, setLeftTab] = useState<LeftToolTab>("templates");
  const [mobilePanel, setMobilePanel] = useState<"canvas" | "tools" | "layers">("canvas");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Template Library State (2,400+ server-paginated templates)
  const [templates, setTemplates] = useState<HeraldryTemplateItem[]>([]);
  const [tplTotal, setTplTotal] = useState(2400);
  const [tplPage, setTplPage] = useState(1);
  const [tplTotalPages, setTplTotalPages] = useState(200);
  const [tplQuery, setTplQuery] = useState("");
  const [tplStyle, setTplStyle] = useState("");
  const [tplCategory, setTplCategory] = useState("");
  const [tplShape, setTplShape] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [previewTpl, setPreviewTpl] = useState<HeraldryTemplateItem | null>(null);

  // Saved Personal Library & Versions
  const [savedDesigns, setSavedDesigns] = useState<HeraldrySavedDesign[]>([]);
  const [versions, setVersions] = useState<HeraldryVersionRecord[]>([]);
  const [showVersionsModal, setShowVersionsModal] = useState(false);

  // Symbol Library Filter
  const [symCategory, setSymCategory] = useState<SymbolCategoryId | "all">("all");
  const [symSearch, setSymSearch] = useState("");

  // Upload Existing Emblem
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview, Export & Apply Official Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewMode, setPreviewMode] = useState<HeraldryPreviewMode>("standard");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"svg" | "png" | "webp" | "jpg">("png");
  const [exportRes, setExportRes] = useState<number>(1024);
  const [exportTransparent, setExportTransparent] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyReason, setApplyReason] = useState("");
  const [applyConfirm, setApplyConfirm] = useState(false);

  // AI Heraldry Assistant
  const [aiPrompt, setAiPrompt] = useState(
    "Thiết kế quốc huy cho một vương quốc cổ đại, biểu tượng chính là sư tử bạc, nền đỏ thẫm, phía trên có vương miện vàng, phong cách hoàng gia và uy nghi."
  );
  const [aiResult, setAiResult] = useState<{
    conceptName: string;
    symbolismDescription: string;
    variations: Array<{ style: string; styleLabel: string; designData: HeraldryDesignData }>;
  } | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{
    analysis: { overallScore: number; findings: Array<{ level: "ok" | "tip" | "warn"; message: string }> };
    similar: Array<{ id: string; name: string; score: number; summary: string; isOfficial: boolean }>;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Dragging Layer on Live Canvas
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingLayerRef = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const commitDesign = useCallback((updater: (prev: HeraldryDesignData) => HeraldryDesignData) => {
    setDesign((prev) => {
      const next = updater(structuredClone(prev));
      setPast((p) => [...p.slice(-29), prev]);
      setFuture([]);
      return next;
    });
  }, []);

  function undo() {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [design, ...f]);
    setDesign(prev);
  }

  function redo() {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, design]);
    setDesign(next);
  }

  const loadTemplates = useCallback(async () => {
    const params = new URLSearchParams({
      mode: "templates",
      workspaceId,
      page: String(tplPage),
      limit: "12"
    });
    if (tplQuery.trim()) params.set("q", tplQuery.trim());
    if (tplStyle) params.set("style", tplStyle);
    if (tplCategory) params.set("category", tplCategory);
    if (tplShape) params.set("shape", tplShape);
    const res = await fetch(`/api/heraldry?${params}`);
    const data = await res.json();
    setTemplates(data.items || []);
    setTplTotal(data.total || 1200);
    setTplTotalPages(data.totalPages || 1);
    if (Array.isArray(data.favoriteTemplateIds)) setFavoriteIds(data.favoriteTemplateIds);
  }, [workspaceId, tplPage, tplQuery, tplStyle, tplCategory, tplShape]);

  const loadSavedLibrary = useCallback(async () => {
    const res = await fetch(`/api/heraldry?mode=saved&workspaceId=${encodeURIComponent(workspaceId)}`);
    const data = await res.json();
    setSavedDesigns(data.designs || []);
    if (Array.isArray(data.favoriteTemplateIds)) setFavoriteIds(data.favoriteTemplateIds);
  }, [workspaceId]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadTemplates();
    }, 140);
    return () => clearTimeout(t);
  }, [loadTemplates]);

  useEffect(() => {
    void loadSavedLibrary();
  }, [loadSavedLibrary]);

  const selectedLayer = useMemo(
    () => design.layers.find((l) => l.id === selectedLayerId) || null,
    [design.layers, selectedLayerId]
  );

  const contrastRatio = useMemo(() => {
    const symLayer = design.layers.find((l) => l.kind === "symbol" && l.visible);
    return computeContrastRatio(
      design.shield.primaryColor,
      symLayer?.color || design.shield.borderColor
    );
  }, [design]);

  function addSymbolLayer(symId: string, symName: string) {
    const id = `lyr-sym-${Date.now()}`;
    commitDesign((d) => {
      d.layers.push({
        id,
        name: symName,
        kind: "symbol",
        visible: true,
        locked: false,
        x: 300,
        y: 295,
        scale: 1.7,
        rotation: 0,
        opacity: 1,
        color: "#E9DFC9",
        symbolId: symId
      });
      return d;
    });
    setSelectedLayerId(id);
  }

  function addOrnamentLayer(ornId: OrnamentId, label: string) {
    if (ornId === "none") return;
    const id = `lyr-orn-${Date.now()}`;
    commitDesign((d) => {
      d.layers.push({
        id,
        name: label,
        kind: "ornament",
        visible: true,
        locked: false,
        x: 300,
        y: 300,
        scale: 1,
        rotation: 0,
        opacity: 1,
        color: d.shield.borderColor || "#C6A568",
        ornamentId: ornId
      });
      return d;
    });
    setSelectedLayerId(id);
  }

  function addTextLayer() {
    const id = `lyr-txt-${Date.now()}`;
    commitDesign((d) => {
      d.layers.push({
        id,
        name: "Chữ khắc Mới",
        kind: "text",
        visible: true,
        locked: false,
        x: 300,
        y: 190,
        scale: 1,
        rotation: 0,
        opacity: 1,
        color: "#E9DFC9",
        text: "AETHEL",
        fontFamily: "Cinzel",
        fontSize: 28,
        letterSpacing: 3
      });
      return d;
    });
    setSelectedLayerId(id);
  }

  function updateLayer(layerId: string, patch: Partial<HeraldryLayer>) {
    commitDesign((d) => {
      const target = d.layers.find((l) => l.id === layerId);
      if (target && !target.locked) Object.assign(target, patch);
      return d;
    });
  }

  function moveLayerOrder(layerId: string, dir: -1 | 1) {
    commitDesign((d) => {
      const idx = d.layers.findIndex((l) => l.id === layerId);
      const nextIdx = idx + dir;
      if (idx < 0 || nextIdx < 0 || nextIdx >= d.layers.length) return d;
      [d.layers[idx], d.layers[nextIdx]] = [d.layers[nextIdx], d.layers[idx]];
      return d;
    });
  }

  async function handleUploadEmblem(file: File, mode: "use_as_image" | "edit_overlay") {
    setUploading(true);
    setStatusMsg(null);
    try {
      const res = await uploadImageToVault({
        file,
        workspaceId,
        preset: "free",
        title: `Heraldry - ${file.name.replace(/\.[^.]+$/, "")}`,
        tags: "heraldry,emblem"
      });
      commitDesign((d) => {
        d.uploadedMode = mode;
        d.uploadedImageUrl = res.url;
        if (mode === "edit_overlay") {
          const id = `lyr-img-${Date.now()}`;
          d.layers.push({
            id,
            name: `Ảnh tải lên (${file.name.slice(0, 14)})`,
            kind: "uploaded_image",
            visible: true,
            locked: false,
            x: 300,
            y: 295,
            scale: 0.9,
            rotation: 0,
            opacity: 1,
            color: "#ffffff",
            imageUrl: res.url,
            clipToShield: true
          });
          setSelectedLayerId(id);
        }
        return d;
      });
      setStatusMsg(
        mode === "use_as_image"
          ? "✓ Đã áp dụng ảnh gốc làm huy hiệu (Mode A — giữ nguyên chi tiết ảnh)."
          : "✓ Đã đưa ảnh vào Canvas làm Layer để thêm viền, vương miện, dải băng & chữ (Mode B)."
      );
    } catch (e) {
      setStatusMsg(`Lỗi upload: ${(e as Error).message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveDesign(): Promise<string | undefined> {
    if (!canEdit) return undefined;
    const res = await fetch("/api/heraldry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: designId,
        workspaceId,
        name: designName.trim() || "Quốc huy Không tên",
        designData: design,
        linkedKingdomId: linkedKingdomId || null,
        eraLabel,
        mode: design.uploadedMode !== "none" ? "upload" : "template"
      })
    });
    const data = await res.json();
    if (res.ok && data.design) {
      setDesignId(data.design.id);
      setStatusMsg(`✓ Đã lưu thiết kế ${data.design.id} (v${data.design.version})`);
      await loadSavedLibrary();
      return data.design.id as string;
    }
    return undefined;
  }

  async function handleApplyOfficialToKingdom() {
    if (!applyConfirm) return;
    const id = designId || (await handleSaveDesign());
    if (!id) return;
    const res = await fetch("/api/heraldry", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "apply_official",
        designId: id,
        kingdomId: linkedKingdomId,
        confirmReplaceOfficial: true,
        changeReason: applyReason.trim() || "Cập nhật Quốc huy chính thức"
      })
    });
    const data = await res.json();
    if (res.ok) {
      setShowApplyModal(false);
      setApplyConfirm(false);
      setStatusMsg(`✓ Đã gắn làm Quốc huy Chính thức cho ${linkedKingdomId} (bản cũ đã tự động lưu lịch sử)!`);
      await loadSavedLibrary();
      if (onAppliedToKingdom) onAppliedToKingdom(linkedKingdomId);
    } else {
      setStatusMsg(data.error || "Không thể áp dụng Quốc huy.");
    }
  }

  async function handleRunAi() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/heraldry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ai_concept",
          workspaceId,
          prompt: aiPrompt
        })
      });
      const data = await res.json();
      if (data.concept) setAiResult(data.concept);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAnalyzeCanvas() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/heraldry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ai_analyze",
          workspaceId,
          designData: design
        })
      });
      const data = await res.json();
      if (data.analysis) setAiAnalysis({ analysis: data.analysis, similar: data.similar || [] });
    } finally {
      setAiLoading(false);
    }
  }

  async function openVersions() {
    if (!designId) return;
    const res = await fetch(`/api/heraldry?mode=versions&designId=${encodeURIComponent(designId)}`);
    const data = await res.json();
    setVersions(data.versions || []);
    setShowVersionsModal(true);
  }

  // Interactive Canvas Drag for Selected Layer (with optional Snap-to-Grid 10px)
  function onCanvasPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!selectedLayer || selectedLayer.locked || selectedLayer.kind === "ornament") return;
    draggingLayerRef.current = {
      id: selectedLayer.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: selectedLayer.x,
      origY: selectedLayer.y
    };
  }

  function onCanvasPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const st = draggingLayerRef.current;
    const box = canvasRef.current?.getBoundingClientRect();
    if (!st || !box) return;
    const scaleFactor = 600 / box.width;
    const dx = (e.clientX - st.startClientX) * scaleFactor;
    const dy = (e.clientY - st.startClientY) * scaleFactor;
    let nx = Math.round(Math.max(60, Math.min(540, st.origX + dx)));
    let ny = Math.round(Math.max(60, Math.min(540, st.origY + dy)));
    if (snapToGrid) {
      nx = Math.round(nx / 10) * 10;
      ny = Math.round(ny / 10) * 10;
    }
    setDesign((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === st.id ? { ...l, x: nx, y: ny } : l))
    }));
  }

  function onCanvasPointerUp() {
    draggingLayerRef.current = null;
  }

  const filteredSymbols = useMemo(() => {
    return HERALDIC_SYMBOLS.filter((s) => {
      if (symCategory !== "all" && s.category !== symCategory) return false;
      if (symSearch.trim()) {
        const hay = `${s.name} ${s.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(symSearch.toLowerCase())) return false;
      }
      return true;
    });
  }, [symCategory, symSearch]);

  const leftToolsContent = (
    <div className="space-y-3 text-xs">
      <DraggableScrollArea ariaLabel="Công cụ xưởng huy hiệu" innerClassName="flex gap-1">
        {(
          [
            ["templates", Sparkles, `Mẫu (${tplTotal})`],
            ["shapes", Shield, "18 Khiên"],
            ["symbols", Crown, `Biểu tượng (${HERALDIC_SYMBOLS.length})`],
            ["ornaments", Star, "14 Trang trí"],
            ["text", Type, "Khẩu hiệu"],
            ["upload", Upload, "Tải ảnh"],
            ["ai", Bot, "AI Gợi ý"],
            ["library", FolderHeart, `Đã lưu (${savedDesigns.length})`]
          ] as const
        ).map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setLeftTab(id)}
            className={`shrink-0 min-h-[34px] px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 cursor-pointer ${
              leftTab === id
                ? "border-[#C6A568] bg-[#C6A568] text-[#101522] font-bold"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </DraggableScrollArea>

      {/* 1. TEMPLATE LIBRARY (1,200+ Parametric Templates) */}
      {leftTab === "templates" && (
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={tplQuery}
              onChange={(e) => {
                setTplQuery(e.target.value);
                setTplPage(1);
              }}
              placeholder="Tìm trong 2.400+ mẫu chuyên biệt (sư tử, rồng, gothic...)"
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <select value={tplStyle} onChange={(e) => { setTplStyle(e.target.value); setTplPage(1); }} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-[11px]">
              <option value="">Mọi phong cách (14)</option>
              {Object.entries(STYLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={tplCategory} onChange={(e) => { setTplCategory(e.target.value); setTplPage(1); }} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-[11px]">
              <option value="">Mọi loại hình (10 · 240 mẫu/mục)</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={tplShape} onChange={(e) => { setTplShape(e.target.value); setTplPage(1); }} className="col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-[11px]">
              <option value="">Mọi hình dáng khiên (18)</option>
              {SHIELD_SHAPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[460px] overflow-y-auto codex-scrollbar pr-1">
            {templates.map((tpl) => {
              const isFav = favoriteIds.includes(tpl.id);
              return (
                <div
                  key={tpl.id}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[#101522]/75 p-2 space-y-1.5 hover:border-[#C6A568] transition"
                >
                  <div
                    onClick={() => setPreviewTpl(tpl)}
                    className="aspect-square rounded-lg bg-[#1D2636]/70 p-1.5 cursor-zoom-in"
                  >
                    <HeraldrySvgPreview design={tpl.designData} uid={tpl.id} />
                  </div>
                  <div className="text-[11px] font-semibold text-[#E9DFC9] truncate">{tpl.symbolName}</div>
                  <div className="text-[9px] font-mono text-[#8FA2B3] truncate">
                    {tpl.id} · {tpl.styleLabel}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        commitDesign(() => structuredClone(tpl.designData));
                        setDesignName(tpl.name);
                        setSelectedLayerId(tpl.designData.layers[0]?.id || null);
                        if (isMobile) setMobilePanel("canvas");
                      }}
                      className="flex-1 py-1 rounded-lg bg-[#C6A568] text-[#101522] font-bold text-[10px] cursor-pointer"
                    >
                      Dùng mẫu
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const r = await fetch("/api/heraldry", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "toggle_favorite", templateId: tpl.id })
                        });
                        const d = await r.json();
                        if (d.favoriteTemplateIds) setFavoriteIds(d.favoriteTemplateIds);
                      }}
                      className={`p-1 rounded-lg border cursor-pointer ${
                        isFav ? "border-amber-400 text-amber-300" : "border-white/15 text-[var(--text-muted)]"
                      }`}
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <button
              type="button"
              disabled={tplPage <= 1}
              onClick={() => setTplPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded border border-[var(--border-subtle)] disabled:opacity-35 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[#8FA2B3]">
              Trang {tplPage}/{tplTotalPages} ({tplTotal} mẫu)
            </span>
            <button
              type="button"
              disabled={tplPage >= tplTotalPages}
              onClick={() => setTplPage((p) => Math.min(tplTotalPages, p + 1))}
              className="px-2 py-1 rounded border border-[var(--border-subtle)] disabled:opacity-35 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. 15 SHIELD SHAPES & GEOMETRY */}
      {leftTab === "shapes" && (
        <div className="space-y-3 max-h-[520px] overflow-y-auto codex-scrollbar pr-1">
          <div className="grid grid-cols-2 gap-1.5">
            {SHIELD_SHAPES.map((sh) => (
              <button
                key={sh.id}
                type="button"
                onClick={() => commitDesign((d) => { d.shield.shape = sh.id as ShieldShapeId; return d; })}
                className={`px-2.5 py-2 rounded-lg border text-left text-[11px] cursor-pointer ${
                  design.shield.shape === sh.id
                    ? "border-[#C6A568] bg-[#C6A568]/20 text-[#E9DFC9] font-bold"
                    : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
                }`}
              >
                {sh.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            <div className="text-[11px] font-bold text-[#C6A568]">Preset Hình học Nhanh (6 kiểu)</div>
            <div className="grid grid-cols-3 gap-1">
              {SHIELD_GEOMETRY_PRESETS.map((pr) => (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() =>
                    commitDesign((d) => {
                      d.shield.widthScale = pr.widthScale;
                      d.shield.heightScale = pr.heightScale;
                      d.shield.topCurve = pr.topCurve;
                      d.shield.bottomPoint = pr.bottomPoint;
                      return d;
                    })
                  }
                  className="rounded-lg border border-[var(--border-subtle)] bg-[#101522]/75 px-1.5 py-1 text-[10px] text-[#E9DFC9] hover:border-[#C6A568] cursor-pointer"
                >
                  {pr.label}
                </button>
              ))}
            </div>
            <div className="text-[11px] font-bold text-[#C6A568]">Tùy chỉnh Hình học Khiên</div>
            <label className="block space-y-0.5">
              <span>Chiều rộng ({Math.round(design.shield.widthScale * 100)}%)</span>
              <input type="range" min={0.75} max={1.25} step={0.05} value={design.shield.widthScale} onChange={(e) => commitDesign((d) => { d.shield.widthScale = Number(e.target.value); return d; })} className="w-full" />
            </label>
            <label className="block space-y-0.5">
              <span>Chiều cao ({Math.round(design.shield.heightScale * 100)}%)</span>
              <input type="range" min={0.75} max={1.25} step={0.05} value={design.shield.heightScale} onChange={(e) => commitDesign((d) => { d.shield.heightScale = Number(e.target.value); return d; })} className="w-full" />
            </label>
            <label className="block space-y-0.5">
              <span>Độ cong cạnh trên ({design.shield.topCurve})</span>
              <input type="range" min={-20} max={30} step={2} value={design.shield.topCurve} onChange={(e) => commitDesign((d) => { d.shield.topCurve = Number(e.target.value); return d; })} className="w-full" />
            </label>
            <label className="block space-y-0.5">
              <span>Độ dày viền ({design.shield.borderWidth}px)</span>
              <input type="range" min={0} max={16} step={1} value={design.shield.borderWidth} onChange={(e) => commitDesign((d) => { d.shield.borderWidth = Number(e.target.value); return d; })} className="w-full" />
            </label>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#C6A568]">Chia nền & Hoa văn Khiên (18 kiểu)</span>
              <select
                value={design.shield.fieldDivision}
                onChange={(e) => commitDesign((d) => { d.shield.fieldDivision = e.target.value as FieldDivisionId; return d; })}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
              >
                {FIELD_DIVISIONS.map((fd) => <option key={fd.id} value={fd.id}>{fd.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={design.shield.gradientMode || "none"}
                onChange={(e) =>
                  commitDesign((d) => {
                    d.shield.gradientMode = e.target.value as HeraldryDesignData["shield"]["gradientMode"];
                    return d;
                  })
                }
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-[11px]"
              >
                <option value="none">Gradient: Tắt</option>
                <option value="vertical">Gradient Dọc</option>
                <option value="diagonal">Gradient Chéo</option>
                <option value="radial">Gradient Tâm</option>
              </select>
              <select
                value={design.shield.textureMode || "none"}
                onChange={(e) =>
                  commitDesign((d) => {
                    d.shield.textureMode = e.target.value as HeraldryDesignData["shield"]["textureMode"];
                    return d;
                  })
                }
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-[11px]"
              >
                <option value="none">Chất liệu: Phẳng</option>
                <option value="parchment">Giấy da Cổ</option>
                <option value="metal_grain">Ánh Kim xước</option>
                <option value="linen">Vải Lanh Cờ</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <label className="space-y-0.5 text-[10px]">
                <span>Màu nền 1</span>
                <input type="color" value={design.shield.primaryColor} onChange={(e) => commitDesign((d) => { d.shield.primaryColor = e.target.value; return d; })} className="w-full h-8 rounded cursor-pointer" />
              </label>
              <label className="space-y-0.5 text-[10px]">
                <span>Màu nền 2</span>
                <input type="color" value={design.shield.secondaryColor} onChange={(e) => commitDesign((d) => { d.shield.secondaryColor = e.target.value; return d; })} className="w-full h-8 rounded cursor-pointer" />
              </label>
              <label className="space-y-0.5 text-[10px]">
                <span>Màu viền</span>
                <input type="color" value={design.shield.borderColor} onChange={(e) => commitDesign((d) => { d.shield.borderColor = e.target.value; return d; })} className="w-full h-8 rounded cursor-pointer" />
              </label>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={design.shield.innerBorder} onChange={(e) => commitDesign((d) => { d.shield.innerBorder = e.target.checked; return d; })} />
                <span>Viền trong</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={design.shield.metallicEffect} onChange={(e) => commitDesign((d) => { d.shield.metallicEffect = e.target.checked; return d; })} />
                <span>Ánh kim loại</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 3. SYMBOL LIBRARY (5 Categories) */}
      {leftTab === "symbols" && (
        <div className="space-y-2.5">
          <input
            value={symSearch}
            onChange={(e) => setSymSearch(e.target.value)}
            placeholder="Tìm biểu tượng (sư tử, rồng, kiếm, rune...)"
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]"
          />
          <select
            value={symCategory}
            onChange={(e) => setSymCategory(e.target.value as SymbolCategoryId | "all")}
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
          >
            <option value="all">Tất cả 5 nhóm ({HERALDIC_SYMBOLS.length})</option>
            {Object.entries(SYMBOL_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2 max-h-[420px] overflow-y-auto codex-scrollbar pr-1">
            {filteredSymbols.map((sym) => (
              <button
                key={sym.id}
                type="button"
                onClick={() => addSymbolLayer(sym.id, sym.name)}
                className="rounded-xl border border-[var(--border-subtle)] bg-[#101522]/80 hover:border-[#C6A568] p-2 flex flex-col items-center gap-1 cursor-pointer"
              >
                <svg viewBox="-50 -50 100 100" className="w-10 h-10 text-[#C6A568]" dangerouslySetInnerHTML={{ __html: sym.svgInner }} />
                <span className="text-[10px] text-center text-[#E9DFC9] line-clamp-1">{sym.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. EXTERNAL ORNAMENTS */}
      {leftTab === "ornaments" && (
        <div className="space-y-2 max-h-[480px] overflow-y-auto codex-scrollbar pr-1">
          {EXTERNAL_ORNAMENTS.filter((o) => o.id !== "none").map((orn) => (
            <button
              key={orn.id}
              type="button"
              onClick={() => addOrnamentLayer(orn.id, orn.label)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[#101522]/75 hover:border-[#C6A568] p-2.5 text-left flex items-center justify-between gap-2 cursor-pointer"
            >
              <div>
                <div className="font-semibold text-[#E9DFC9]">{orn.label}</div>
                <div className="text-[10px] text-[#8FA2B3]">{orn.description}</div>
              </div>
              <Plus className="w-4 h-4 text-[#C6A568]" />
            </button>
          ))}
        </div>
      )}

      {/* 5. TEXT & CURVED MOTTO EDITOR */}
      {leftTab === "text" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[#101522]/60 p-3 space-y-2">
            <label className="flex items-center justify-between font-bold text-[#C6A568]">
              <span>Dải băng Khẩu hiệu Cong (Unicode Tiếng Việt)</span>
              <input
                type="checkbox"
                checked={design.motto.enabled}
                onChange={(e) => commitDesign((d) => { d.motto.enabled = e.target.checked; return d; })}
              />
            </label>
            <input
              value={design.motto.text}
              onChange={(e) => commitDesign((d) => { d.motto.text = e.target.value; return d; })}
              placeholder="Nhập khẩu hiệu hoàng gia..."
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[10px]">
                Màu dải băng
                <input type="color" value={design.motto.ribbonColor} onChange={(e) => commitDesign((d) => { d.motto.ribbonColor = e.target.value; return d; })} className="w-full h-7 rounded cursor-pointer" />
              </label>
              <label className="text-[10px]">
                Màu chữ
                <input type="color" value={design.motto.textColor} onChange={(e) => commitDesign((d) => { d.motto.textColor = e.target.value; return d; })} className="w-full h-7 rounded cursor-pointer" />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={addTextLayer}
            className="w-full py-2 rounded-xl border border-[#C6A568]/50 bg-[#C6A568]/15 text-[#E9DFC9] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Lớp Chữ Khắc Tự do
          </button>
        </div>
      )}

      {/* 6. UPLOAD EXISTING EMBLEM (Mode A & Mode B) */}
      {leftTab === "upload" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#C6A568]/35 bg-[#101522]/70 p-3 space-y-2.5">
            <div className="font-bold text-[#C6A568]">Tải Huy hiệu có sẵn (PNG, JPG, WebP, SVG)</div>
            <p className="text-[11px] text-[#8FA2B3]">
              Hỗ trợ 2 chế độ: **Chế độ A** giữ nguyên ảnh gốc, hoặc **Chế độ B** đưa ảnh vào Canvas để thêm khung khiên, vương miện &amp; dải băng. File SVG được tự động lọc mã độc (Sanitizer).
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                const mode = (e.currentTarget.dataset.mode as "use_as_image" | "edit_overlay") || "edit_overlay";
                if (f) void handleUploadEmblem(f, mode);
                e.target.value = "";
              }}
            />
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.dataset.mode = "use_as_image";
                    fileInputRef.current.click();
                  }
                }}
                className="py-2 px-3 rounded-xl bg-[#C6A568] text-[#101522] font-bold cursor-pointer disabled:opacity-50"
              >
                Chế độ A — Dùng Ảnh Gốc làm Huy hiệu
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.dataset.mode = "edit_overlay";
                    fileInputRef.current.click();
                  }
                }}
                className="py-2 px-3 rounded-xl border border-[#C6A568]/60 text-[#E9DFC9] font-semibold cursor-pointer disabled:opacity-50"
              >
                Chế độ B — Đưa Ảnh vào Canvas để Trang trí thêm
              </button>
              {design.uploadedMode !== "none" && (
                <button
                  type="button"
                  onClick={() => commitDesign((d) => { d.uploadedMode = "none"; return d; })}
                  className="py-1.5 rounded-lg border border-rose-500/40 text-rose-300 text-[11px] cursor-pointer"
                >
                  Chuyển lại chế độ Vector Thuần
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. HERALDRY AI ASSISTANT */}
      {leftTab === "ai" && (
        <div className="space-y-2.5">
          <div className="font-bold text-[#C6A568] flex items-center gap-1.5">
            <Bot className="w-4 h-4" /> Trợ lý AI Thiết kế &amp; Thuyết minh Huy hiệu
          </div>
          <textarea
            rows={3}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] p-2 text-xs"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={aiLoading}
              onClick={() => void handleRunAi()}
              className="py-2 rounded-xl bg-[#C6A568] text-[#101522] font-bold cursor-pointer disabled:opacity-50"
            >
              {aiLoading ? "Đang xử lý..." : "Sinh 6 Phương án"}
            </button>
            <button
              type="button"
              disabled={aiLoading}
              onClick={() => void handleAnalyzeCanvas()}
              className="py-2 rounded-xl border border-[#C6A568]/50 bg-[#101522] text-[#C6A568] font-bold cursor-pointer disabled:opacity-50"
            >
              Phân tích & Kiểm trùng
            </button>
          </div>

          {aiAnalysis && (
            <div className="rounded-xl border border-[#C6A568]/30 bg-[#101522]/85 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-[#C6A568]">
                <span>Đánh giá Bố cục Canvas</span>
                <span>{aiAnalysis.analysis.overallScore}/100</span>
              </div>
              {aiAnalysis.analysis.findings.map((f, i) => (
                <div key={i} className={`text-[10px] ${f.level === "warn" ? "text-amber-300" : f.level === "tip" ? "text-sky-300" : "text-emerald-300"}`}>
                  • {f.message}
                </div>
              ))}
              {aiAnalysis.similar.length > 0 && (
                <div className="pt-1 border-t border-white/10 space-y-1">
                  <div className="text-[10px] font-bold text-amber-300">Phát hiện thiết kế tương đồng:</div>
                  {aiAnalysis.similar.map((s) => (
                    <div key={s.id} className="text-[10px] text-[#E9DFC9]/80 flex justify-between">
                      <span className="truncate">{s.name}</span>
                      <span className="text-[#C6A568] font-bold">{s.score}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {aiResult && (
            <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)] max-h-[340px] overflow-y-auto codex-scrollbar pr-1">
              <div className="font-bold text-[#E9DFC9]">{aiResult.conceptName}</div>
              <pre className="whitespace-pre-wrap font-sans text-[10px] text-[#C8D0DC] bg-black/25 p-2 rounded-lg">
                {aiResult.symbolismDescription}
              </pre>
              <div className="grid grid-cols-2 gap-2">
                {aiResult.variations.map((v) => (
                  <button
                    key={v.style}
                    type="button"
                    onClick={() => {
                      commitDesign(() => structuredClone(v.designData));
                      setDesignName(`${aiResult.conceptName} (${v.styleLabel})`);
                    }}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[#101522]/80 hover:border-[#C6A568] p-1.5 text-center cursor-pointer"
                  >
                    <div className="aspect-square">
                      <HeraldrySvgPreview design={v.designData} uid={`ai-${v.style}`} />
                    </div>
                    <div className="text-[10px] font-semibold text-[#C6A568] mt-1">{v.styleLabel}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. PERSONAL SAVED LIBRARY */}
      {leftTab === "library" && (
        <div className="space-y-2 max-h-[480px] overflow-y-auto codex-scrollbar pr-1">
          {savedDesigns.length === 0 ? (
            <p className="text-[#8FA2B3] py-6 text-center">Chưa có thiết kế nào được lưu. Bấm "Lưu" trên thanh công cụ để lưu vào thư viện cá nhân.</p>
          ) : (
            savedDesigns.map((sd) => (
              <div key={sd.id} className="rounded-xl border border-[var(--border-subtle)] bg-[#101522]/75 p-2.5 flex items-center gap-2.5">
                <div className="w-12 h-12 shrink-0">
                  <HeraldrySvgPreview design={sd.designData} uid={sd.id} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#E9DFC9] truncate">{sd.name}</div>
                  <div className="text-[10px] font-mono text-[#8FA2B3]">
                    {sd.id} · v{sd.version} {sd.isOfficial ? "· ★ CHÍNH THỨC" : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDesignId(sd.id);
                    setDesignName(sd.name);
                    setLinkedKingdomId(sd.linkedKingdomId || "KING-000001");
                    setEraLabel(sd.eraLabel || "Thời đại Hiện tại");
                    commitDesign(() => structuredClone(sd.designData));
                  }}
                  className="px-2 py-1 rounded-lg bg-[#C6A568]/20 text-[#C6A568] font-semibold cursor-pointer"
                >
                  Mở
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  const rightInspectorContent = (
    <div className="space-y-4 text-xs">
      {/* Layer Stack */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-bold text-[#C6A568]">
          <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Quản lý Lớp ({design.layers.length})</span>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto codex-scrollbar pr-1">
          {[...design.layers].reverse().map((lyr) => {
            const active = lyr.id === selectedLayerId;
            return (
              <div
                key={lyr.id}
                onClick={() => setSelectedLayerId(lyr.id)}
                className={`rounded-lg border px-2 py-1.5 flex items-center justify-between gap-1 cursor-pointer ${
                  active
                    ? "border-[#C6A568] bg-[#C6A568]/15 text-[#E9DFC9]"
                    : "border-[var(--border-subtle)] bg-[#101522]/60 text-[var(--text-secondary)]"
                }`}
              >
                <span className="truncate flex-1 font-medium">{lyr.name}</span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveLayerOrder(lyr.id, 1); }} className="p-1 hover:text-[#C6A568] cursor-pointer" title="Lên trên"><ArrowUp className="w-3 h-3" /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveLayerOrder(lyr.id, -1); }} className="p-1 hover:text-[#C6A568] cursor-pointer" title="Xuống dưới"><ArrowDown className="w-3 h-3" /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); commitDesign((d) => { const x = d.layers.find((i) => i.id === lyr.id); if (x) x.visible = !x.visible; return d; }); }} className="p-1 hover:text-[#C6A568] cursor-pointer" title="Ẩn/Hiện">
                    {lyr.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 opacity-50" />}
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); commitDesign((d) => { const x = d.layers.find((i) => i.id === lyr.id); if (x) x.locked = !x.locked; return d; }); }} className="p-1 hover:text-[#C6A568] cursor-pointer" title="Khóa">
                    {lyr.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 opacity-60" />}
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); commitDesign((d) => { d.layers.push({ ...structuredClone(lyr), id: `lyr-dup-${Date.now()}`, name: `${lyr.name} (Bản sao)`, x: lyr.x + 16, y: lyr.y + 16 }); return d; }); }} className="p-1 hover:text-[#C6A568] cursor-pointer" title="Nhân bản"><Copy className="w-3 h-3" /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); commitDesign((d) => { d.layers = d.layers.filter((i) => i.id !== lyr.id); return d; }); }} className="p-1 text-rose-400 cursor-pointer" title="Xóa"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Layer Properties Inspector */}
      {selectedLayer && (
        <div className="space-y-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <div className="font-bold text-[#C6A568]">Thuộc tính Lớp: {selectedLayer.name}</div>
          {selectedLayer.kind === "text" && (
            <input
              value={selectedLayer.text || ""}
              onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
            />
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-0.5 text-[10px]">
              <div className="flex items-center justify-between">
                <span>Vị trí X</span>
                <input
                  type="number"
                  min={60}
                  max={540}
                  value={selectedLayer.x}
                  onChange={(e) => updateLayer(selectedLayer.id, { x: Number(e.target.value) })}
                  className="w-14 rounded border border-white/15 bg-[#101522] px-1 text-right font-mono text-[10px]"
                />
              </div>
              <input type="range" min={80} max={520} value={selectedLayer.x} onChange={(e) => updateLayer(selectedLayer.id, { x: Number(e.target.value) })} className="w-full" />
            </label>
            <label className="space-y-0.5 text-[10px]">
              <div className="flex items-center justify-between">
                <span>Vị trí Y</span>
                <input
                  type="number"
                  min={60}
                  max={540}
                  value={selectedLayer.y}
                  onChange={(e) => updateLayer(selectedLayer.id, { y: Number(e.target.value) })}
                  className="w-14 rounded border border-white/15 bg-[#101522] px-1 text-right font-mono text-[10px]"
                />
              </div>
              <input type="range" min={80} max={520} value={selectedLayer.y} onChange={(e) => updateLayer(selectedLayer.id, { y: Number(e.target.value) })} className="w-full" />
            </label>
            <label className="space-y-0.5 text-[10px]">
              <span>Tỷ lệ ({Math.round(selectedLayer.scale * 100)}%)</span>
              <input type="range" min={0.3} max={3.2} step={0.05} value={selectedLayer.scale} onChange={(e) => updateLayer(selectedLayer.id, { scale: Number(e.target.value) })} className="w-full" />
            </label>
            <label className="space-y-0.5 text-[10px]">
              <span>Xoay ({selectedLayer.rotation}°)</span>
              <input type="range" min={-180} max={180} value={selectedLayer.rotation} onChange={(e) => updateLayer(selectedLayer.id, { rotation: Number(e.target.value) })} className="w-full" />
            </label>
          </div>

          {/* Smart Alignment & Symmetry Mirror */}
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => updateLayer(selectedLayer.id, { x: 300 })}
              className="py-1 rounded-lg border border-[var(--border-subtle)] hover:border-[#C6A568] inline-flex items-center justify-center gap-1 text-[10px] cursor-pointer"
              title="Căn giữa ngang X=300"
            >
              <AlignCenterHorizontal className="w-3 h-3 text-[#C6A568]" /> Giữa X
            </button>
            <button
              type="button"
              onClick={() => updateLayer(selectedLayer.id, { y: 295 })}
              className="py-1 rounded-lg border border-[var(--border-subtle)] hover:border-[#C6A568] inline-flex items-center justify-center gap-1 text-[10px] cursor-pointer"
              title="Căn giữa dọc Y=295"
            >
              <AlignCenterVertical className="w-3 h-3 text-[#C6A568]" /> Giữa Y
            </button>
            <button
              type="button"
              onClick={() =>
                commitDesign((d) => {
                  const mirrorX = Math.max(60, Math.min(540, 600 - selectedLayer.x));
                  d.layers.push({
                    ...structuredClone(selectedLayer),
                    id: `lyr-sym-mirror-${Date.now()}`,
                    name: `${selectedLayer.name} (Đối xứng)`,
                    x: mirrorX === selectedLayer.x ? Math.min(520, selectedLayer.x + 60) : mirrorX,
                    flipX: !selectedLayer.flipX,
                    groupId: selectedLayer.groupId || `grp-${Date.now()}`
                  });
                  return d;
                })
              }
              className="py-1 rounded-lg border border-[var(--border-subtle)] hover:border-[#C6A568] inline-flex items-center justify-center gap-1 text-[10px] cursor-pointer"
              title="Tạo bản đối xứng gương qua trục giữa"
            >
              <Copy className="w-3 h-3 text-[#C6A568]" /> Đối xứng
            </button>
          </div>

          <label className="block space-y-0.5 text-[10px]">
            <span>Độ mờ (Opacity: {Math.round(selectedLayer.opacity * 100)}%)</span>
            <input type="range" min={0.1} max={1} step={0.05} value={selectedLayer.opacity} onChange={(e) => updateLayer(selectedLayer.id, { opacity: Number(e.target.value) })} className="w-full" />
          </label>

          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => updateLayer(selectedLayer.id, { flipX: !selectedLayer.flipX })} className="flex-1 py-1 rounded-lg border border-[var(--border-subtle)] inline-flex items-center justify-center gap-1 cursor-pointer"><FlipHorizontal className="w-3 h-3" /> Lật ngang</button>
            <button type="button" onClick={() => updateLayer(selectedLayer.id, { flipY: !selectedLayer.flipY })} className="flex-1 py-1 rounded-lg border border-[var(--border-subtle)] inline-flex items-center justify-center gap-1 cursor-pointer"><FlipVertical className="w-3 h-3" /> Lật dọc</button>
          </div>

          {/* Heraldic Palette Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 text-[#C6A568]"><Palette className="w-3 h-3" /> Màu Lớp (HEX)</span>
              <input type="color" value={selectedLayer.color} onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })} className="w-6 h-5 rounded cursor-pointer" />
            </div>
            <div className="grid grid-cols-10 gap-1">
              {HERALDIC_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={`${c.name} (${c.hex})`}
                  onClick={() => updateLayer(selectedLayer.id, { color: c.hex })}
                  className="w-5 h-5 rounded border border-white/25 cursor-pointer hover:scale-110 transition"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contrast Accessibility Check */}
      <div className={`rounded-xl border p-2.5 text-[11px] ${contrastRatio >= 3 ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200" : "border-amber-500/40 bg-amber-500/10 text-amber-200"}`}>
        Độ tương phản Nền ↔ Biểu tượng: <strong>{contrastRatio}:1</strong>{" "}
        {contrastRatio >= 3 ? "(Rõ nét)" : "(Nên tăng tương phản màu)"}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-codex-fade-up">
      {/* Top Studio Command Bar */}
      <div className="imperial-surface rounded-2xl p-3 sm:p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="w-5 h-5 text-[#C6A568] shrink-0" />
            <input
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              className="bg-transparent font-display text-base sm:text-lg font-bold text-[#E9DFC9] outline-none border-b border-transparent focus:border-[#C6A568] min-w-[180px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button type="button" onClick={undo} disabled={past.length === 0} className="p-2 rounded-xl border border-[var(--border-subtle)] disabled:opacity-35 cursor-pointer" title="Hoàn tác (Undo)"><Undo2 className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={redo} disabled={future.length === 0} className="p-2 rounded-xl border border-[var(--border-subtle)] disabled:opacity-35 cursor-pointer" title="Làm lại (Redo)"><Redo2 className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => commitDesign(() => structuredClone(DEFAULT_BLANK_DESIGN))} className="p-2 rounded-xl border border-[var(--border-subtle)] cursor-pointer" title="Đặt lại mẫu mặc định"><RotateCcw className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => setShowPreviewModal(true)} className="px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] hover:border-[#C6A568] inline-flex items-center gap-1 cursor-pointer"><Eye className="w-3.5 h-3.5" /> 10 Chế độ Xem</button>
            <button type="button" onClick={() => setShowExportModal(true)} className="px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] hover:border-[#C6A568] inline-flex items-center gap-1 cursor-pointer"><Download className="w-3.5 h-3.5" /> Xuất File</button>
            {designId && (
              <button type="button" onClick={() => void openVersions()} className="px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] inline-flex items-center gap-1 cursor-pointer"><History className="w-3.5 h-3.5" /> Phiên bản</button>
            )}
            {canEdit && (
              <>
                <button type="button" onClick={() => void handleSaveDesign()} className="px-3 py-1.5 rounded-xl border border-[#C6A568]/60 bg-[#C6A568]/15 text-[#E9DFC9] font-semibold inline-flex items-center gap-1 cursor-pointer"><Save className="w-3.5 h-3.5" /> Lưu</button>
                <button type="button" onClick={() => setShowApplyModal(true)} className="px-3 py-1.5 rounded-xl bg-[#C6A568] text-[#101522] font-bold inline-flex items-center gap-1 cursor-pointer"><Crown className="w-3.5 h-3.5" /> Gắn Vương quốc</button>
              </>
            )}
          </div>
        </div>
        {statusMsg && (
          <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1.5">
            {statusMsg}
          </div>
        )}

        {/* Royal Heraldry Studio V2 Unified Sub-Hub Navigation */}
        <DraggableScrollArea ariaLabel="Các phân hệ Royal Heraldry Studio" innerClassName="flex gap-1.5 pt-1">
          {(
            [
              ["composer", Shield, "Xưởng Quốc huy (2.400+)"],
              ["flags", Flag, "Cờ & Biểu ngữ (450+)"],
              ["evolution", History, "Tiến hóa & Hoàng tộc"],
              ["regalia", Crown, "Bảo vật Hoàng gia"],
              ["meanings", BookOpen, "Ý nghĩa Biểu tượng"],
              ["gallery", ShieldCheck, "Triển lãm & So sánh"],
              ["packs", Package, "Gói Mẫu & Pack"]
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStudioModule(id)}
              className={`shrink-0 min-h-[38px] px-3 py-1.5 rounded-xl border text-xs inline-flex items-center gap-1.5 cursor-pointer transition ${
                studioModule === id
                  ? "border-[#C6A568] bg-[#C6A568] text-[#101522] font-bold shadow-sm"
                  : "border-[#C6A568]/20 bg-[#101522]/70 text-[#E9DFC9]/85 hover:border-[#C6A568]/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </DraggableScrollArea>
      </div>

      {/* Sub-Studio Views */}
      {studioModule === "flags" && (
        <FlagBannerStudio
          workspaceId={workspaceId}
          canEdit={canEdit}
          defaultKingdomId={linkedKingdomId}
        />
      )}

      {studioModule !== "composer" && studioModule !== "flags" && (
        <HeraldryExpansionHub
          mode={studioModule}
          workspaceId={workspaceId}
          canEdit={canEdit}
          savedDesigns={savedDesigns}
          currentDesign={design}
          onRefreshSaved={() => void loadSavedLibrary()}
          onLoadDesignToCanvas={(data, meta) => {
            commitDesign(() => structuredClone(data));
            if (meta?.id) setDesignId(meta.id);
            if (meta?.name) setDesignName(meta.name);
            if (meta?.linkedKingdomId) setLinkedKingdomId(meta.linkedKingdomId);
            setStudioModule("composer");
          }}
        />
      )}

      {studioModule === "composer" && (
        <>
      {/* Mobile Panel Switcher */}
      {(isMobile || isTablet) && (
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {(
            [
              ["canvas", "Canvas Trực tiếp"],
              ["tools", "Mẫu & Công cụ"],
              ["layers", "Lớp & Màu sắc"]
            ] as const
          ).map(([id, lbl]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMobilePanel(id)}
              className={`min-h-[42px] rounded-xl border font-semibold cursor-pointer ${
                mobilePanel === id
                  ? "border-[#C6A568] bg-[#C6A568] text-[#101522]"
                  : "border-[var(--border-subtle)] bg-[#1D2636] text-[#E9DFC9]"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      )}

      {/* Main 3-Pane Studio Workspace (Desktop Pro) / Adaptive Single-Pane (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Asset Library */}
        {(!isMobile && !isTablet) || mobilePanel === "tools" ? (
          <div className="lg:col-span-4 imperial-surface rounded-2xl p-3.5">
            {leftToolsContent}
          </div>
        ) : null}

        {/* Center Live Interactive Canvas */}
        {(!isMobile && !isTablet) || mobilePanel === "canvas" ? (
          <div className="lg:col-span-5 imperial-surface rounded-2xl p-4 space-y-3 flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-[11px] text-[#8FA2B3]">
              <span>Kéo thả trực tiếp lớp đang chọn trên Canvas</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setSnapToGrid((v) => !v)} className={`p-1.5 rounded-lg border cursor-pointer ${snapToGrid ? "border-[#C6A568] text-[#C6A568]" : "border-white/15"}`} title="Bật/tắt Snap-to-Grid (10px)"><Magnet className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => setShowGrid((v) => !v)} className={`p-1.5 rounded-lg border cursor-pointer ${showGrid ? "border-[#C6A568] text-[#C6A568]" : "border-white/15"}`} title="Bật/tắt lưới căn chỉnh"><Grid className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))} className="p-1.5 rounded-lg border border-white/15 cursor-pointer"><ZoomOut className="w-3.5 h-3.5" /></button>
                <span className="font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button type="button" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))} className="p-1.5 rounded-lg border border-white/15 cursor-pointer"><ZoomIn className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div
              ref={canvasRef}
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onPointerLeave={onCanvasPointerUp}
              className="relative w-full max-w-[440px] aspect-square rounded-2xl border border-[#C6A568]/40 overflow-hidden flex items-center justify-center touch-none cursor-move"
              style={{
                backgroundImage: showGrid
                  ? "linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%)"
                  : undefined,
                backgroundSize: "24px 24px",
                backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
                backgroundColor: "#101522"
              }}
            >
              <div style={{ transform: `scale(${zoom})` }} className="w-full h-full transition-transform duration-150">
                <HeraldrySvgPreview design={design} uid="live-canvas" />
              </div>
            </div>
          </div>
        ) : null}

        {/* Right Layer & Properties Inspector */}
        {(!isMobile && !isTablet) || mobilePanel === "layers" ? (
          <div className="lg:col-span-3 imperial-surface rounded-2xl p-3.5">
            {rightInspectorContent}
          </div>
        ) : null}
      </div>
        </>
      )}

      {/* Large Template Preview Modal */}
      {previewTpl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewTpl(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-[#C6A568]/50 bg-[#1D2636] p-5 space-y-3 shadow-2xl text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[#C6A568]">{previewTpl.id}</span>
              <button type="button" onClick={() => setPreviewTpl(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="aspect-square rounded-xl bg-[#101522] p-3">
              <HeraldrySvgPreview design={previewTpl.designData} uid="modal-preview" />
            </div>
            <div className="font-display text-base font-bold text-[#E9DFC9]">{previewTpl.name}</div>
            <p className="text-[#C8D0DC]">{previewTpl.description}</p>
            <button
              type="button"
              onClick={() => {
                commitDesign(() => structuredClone(previewTpl.designData));
                setDesignName(previewTpl.name);
                setPreviewTpl(null);
              }}
              className="w-full py-2 rounded-xl bg-[#C6A568] text-[#101522] font-bold cursor-pointer"
            >
              Sử dụng Mẫu này trong Canvas
            </button>
          </div>
        </div>
      )}

      {/* 10-Mode Heraldry Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3" onClick={() => setShowPreviewModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl max-h-[92vh] overflow-y-auto codex-scrollbar rounded-2xl border border-[#C6A568]/50 bg-[#1D2636] p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#E9DFC9]">Xem trước Huy hiệu (10 Bối cảnh Hiển thị)</h3>
              <button type="button" onClick={() => setShowPreviewModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <DraggableScrollArea ariaLabel="Chế độ xem trước" innerClassName="flex gap-1.5">
              {PREVIEW_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPreviewMode(m.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg border cursor-pointer ${
                    previewMode === m.id ? "border-[#C6A568] bg-[#C6A568] text-[#101522] font-bold" : "border-white/15 text-[#C8D0DC]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </DraggableScrollArea>
            <div
              className={`rounded-2xl p-8 flex flex-col items-center justify-center min-h-[320px] border border-[#C6A568]/35 ${
                previewMode === "light" || previewMode === "royal_document"
                  ? "bg-[#F5EEE0] text-[#271C10]"
                  : previewMode === "official_seal"
                  ? "bg-[#6D3D49]/35"
                  : "bg-[#101522]"
              }`}
            >
              <div className={previewMode === "kingdom_flag" ? "w-72 aspect-[3/2] bg-[#1D2636] border-2 border-[#C6A568] flex items-center justify-center p-4 rounded-lg" : "w-64 h-64"}>
                <HeraldrySvgPreview design={design} uid={`ctx-${previewMode}`} className={previewMode === "kingdom_flag" ? "w-36 h-36" : "w-full h-full"} />
              </div>
              <div className="mt-4 font-display text-base font-bold">{designName}</div>
              <div className="text-[11px] opacity-75">Bối cảnh: {PREVIEW_MODES.find((x) => x.id === previewMode)?.label}</div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Resolution Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowExportModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-[#C6A568]/50 bg-[#1D2636] p-5 space-y-3 shadow-2xl text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#E9DFC9]">Xuất Huy hiệu Chất lượng cao</h3>
              <button type="button" onClick={() => setShowExportModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span>Định dạng</span>
                <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as "svg" | "png" | "webp" | "jpg")} className="w-full rounded-lg border border-white/15 bg-[#101522] px-2.5 py-1.5">
                  <option value="svg">SVG (Vector vô hạn)</option>
                  <option value="png">PNG (Nền trong suốt)</option>
                  <option value="webp">WebP (Tối ưu Web)</option>
                  <option value="jpg">JPG (Tài liệu có nền)</option>
                </select>
              </label>
              <label className="space-y-1">
                <span>Độ phân giải</span>
                <select value={exportRes} onChange={(e) => setExportRes(Number(e.target.value))} className="w-full rounded-lg border border-white/15 bg-[#101522] px-2.5 py-1.5">
                  <option value={256}>256 × 256 px</option>
                  <option value={512}>512 × 512 px</option>
                  <option value={1024}>1024 × 1024 px</option>
                  <option value={2048}>2048 × 2048 px</option>
                </select>
              </label>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={exportTransparent} onChange={(e) => setExportTransparent(e.target.checked)} />
              <span>Giữ nền trong suốt (PNG / WebP / SVG)</span>
            </label>
            <button
              type="button"
              onClick={async () => {
                await exportHeraldryFile(design, {
                  fileName: designName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "royal-emblem",
                  format: exportFormat,
                  resolution: exportRes,
                  transparentBg: exportTransparent
                });
                setShowExportModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[#C6A568] text-[#101522] font-bold cursor-pointer"
            >
              Tải xuống Ngay ({exportFormat.toUpperCase()})
            </button>
          </div>
        </div>
      )}

      {/* Apply Official Emblem to Kingdom Modal (Official Emblem Protection) */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowApplyModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-[#C6A568]/50 bg-[#1D2636] p-5 space-y-3 shadow-2xl text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#E9DFC9] flex items-center gap-1.5"><Crown className="w-4 h-4 text-[#C6A568]" /> Gắn Quốc huy Chính thức</h3>
              <button type="button" onClick={() => setShowApplyModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <input value={linkedKingdomId} onChange={(e) => setLinkedKingdomId(e.target.value)} placeholder="Mã Vương quốc (VD: KING-000001)" className="w-full rounded-lg border border-white/15 bg-[#101522] px-3 py-2 font-mono" />
            <input value={eraLabel} onChange={(e) => setEraLabel(e.target.value)} placeholder="Thời đại áp dụng (VD: Triều đại Solis III)" className="w-full rounded-lg border border-white/15 bg-[#101522] px-3 py-2" />
            <input value={applyReason} onChange={(e) => setApplyReason(e.target.value)} placeholder="Lý do thay đổi / cải cách quốc huy..." className="w-full rounded-lg border border-white/15 bg-[#101522] px-3 py-2" />
            <label className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/35 p-2.5 text-amber-200 cursor-pointer">
              <input type="checkbox" checked={applyConfirm} onChange={(e) => setApplyConfirm(e.target.checked)} className="mt-0.5" />
              <span>Tôi xác nhận thay thế Quốc huy chính thức cho <strong>{linkedKingdomId}</strong> (phiên bản cũ sẽ được tự động bảo tồn trong lịch sử).</span>
            </label>
            <button
              type="button"
              disabled={!applyConfirm}
              onClick={() => void handleApplyOfficialToKingdom()}
              className="w-full py-2.5 rounded-xl bg-[#C6A568] text-[#101522] font-bold disabled:opacity-40 inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Xác nhận Áp dụng Chính thức
            </button>
          </div>
        </div>
      )}

      {/* Version History & Restore Modal */}
      {showVersionsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowVersionsModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-[#C6A568]/50 bg-[#1D2636] p-5 space-y-3 shadow-2xl text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#E9DFC9]">Lịch sử Phiên bản Huy hiệu ({versions.length})</h3>
              <button type="button" onClick={() => setShowVersionsModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto codex-scrollbar">
              {versions.map((v) => (
                <div key={v.id} className="rounded-xl border border-white/15 bg-[#101522]/70 p-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-[#C6A568]">v{v.versionNumber} · {v.editorName}</div>
                    <div className="text-[11px] text-[#C8D0DC]">{v.changeNote}</div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch("/api/heraldry", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "restore_version", designId, versionNumber: v.versionNumber })
                      });
                      const data = await res.json();
                      if (data.design) {
                        commitDesign(() => structuredClone(data.design.designData));
                        setShowVersionsModal(false);
                        setStatusMsg(`✓ Đã khôi phục thiết kế về phiên bản v${v.versionNumber}`);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#C6A568]/20 text-[#C6A568] font-semibold cursor-pointer"
                  >
                    Khôi phục
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
