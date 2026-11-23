"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Globe2, Layers, Map as MapIcon, MapPin, Plus, Route, Ruler, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";
import type { AtlasMap, AtlasPin, AtlasRoute, EntryCardProjection } from "@/types/codex";
import { calculateRouteDistanceKm, estimateTravelDays } from "@/lib/v2-engines";
import { computeRouteDistanceKm, computeTravelTimes, DEFAULT_TRAVEL_MODES } from "@/lib/v4-engines";
import { IconSigilPicker } from "./IconSigilPicker";
import { DraggableScrollArea } from "./DraggableScrollArea";

const WORLD_ATLAS_8_LAYERS = [
  { id: "political", label: "Chính trị (Biên giới)" },
  { id: "terrain", label: "Địa hình (Núi & Rừng)" },
  { id: "climate", label: "Khí hậu & Sinh thái" },
  { id: "population", label: "Phân bố Dân cư" },
  { id: "civilization", label: "Phạm vi Văn minh" },
  { id: "historical", label: "Lãnh thổ Lịch sử" },
  { id: "cultural", label: "Khu vực Văn hóa" },
  { id: "location", label: "Địa danh & Kỳ quan" }
] as const;

const PlanetaryAtlasStudio = dynamic(
  () => import("./PlanetaryAtlasStudio").then((m) => m.PlanetaryAtlasStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[74vh] min-h-[660px] items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-300">
        <div className="text-center space-y-2">
          <Globe2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
          <div className="text-sm font-medium">
            Đang tải Bản đồ Đại Hành Tinh 360 Quốc gia & Nền Địa hình 3D…
          </div>
        </div>
      </div>
    ),
  },
);

interface AtlasViewProps {
  workspaceId: string;
  entries: EntryCardProjection[];
  canEdit: boolean;
  initialFocusNationId?: string | null;
  onOpenEntry: (id: string) => void;
  onCreateEntryFromAtlas?: (title: string, summary: string, markdown: string) => void;
  onCreateTaskForNation?: (title: string, description: string) => void;
}

export function AtlasView({
  workspaceId,
  entries,
  canEdit,
  initialFocusNationId,
  onOpenEntry,
  onCreateEntryFromAtlas,
  onCreateTaskForNation
}: AtlasViewProps) {
  const [atlasTab, setAtlasTab] = useState<"planetary" | "custom">("planetary");
  const [maps, setMaps] = useState<AtlasMap[]>([]);
  const [pins, setPins] = useState<AtlasPin[]>([]);
  const [routes, setRoutes] = useState<AtlasRoute[]>([]);
  const [activeMapId, setActiveMapId] = useState<string>("");
  const [selectedPin, setSelectedPin] = useState<AtlasPin | null>(null);
  const [zoom, setZoom] = useState(1);

  // V2 Layers & Routes & Distance Ruler
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set());
  const [activeWorldLayers, setActiveWorldLayers] = useState<Set<string>>(
    () => new Set(["political", "terrain", "location"])
  );
  const [showRoutes, setShowRoutes] = useState(true);
  const [mode, setMode] = useState<"view" | "add_pin" | "ruler" | "draw_route">("view");
  const [rulerPoints, setRulerPoints] = useState<Array<{ xPercent: number; yPercent: number }>>([]);
  const [routeName, setRouteName] = useState("");
  const [routeColor, setRouteColor] = useState("#D4AF37");

  // Add Pin modal
  const [draftPinCoords, setDraftPinCoords] = useState<{ x: number; y: number } | null>(null);
  const [pinLabel, setPinLabel] = useState("");
  const [pinDesc, setPinDesc] = useState("");
  const [pinLayer, setPinLayer] = useState("Vương quốc");
  const [pinEntryId, setPinEntryId] = useState("");
  const [pinIcon, setPinIcon] = useState("MapPin");
  const [pinSigil, setPinSigil] = useState("✦");
  const [pinColor, setPinColor] = useState("#D4AF37");

  // Add Map modal
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapName, setMapName] = useState("");
  const [mapDesc, setMapDesc] = useState("");
  const [mapImageUrl, setMapImageUrl] = useState("");

  async function loadAtlas() {
    const res = await fetch(`/api/atlas?workspaceId=${workspaceId}`);
    const data = await res.json();
    const list: AtlasMap[] = data.maps || [];
    setMaps(list);
    setPins(data.pins || []);
    setRoutes(data.routes || []);
    if (!activeMapId && list[0]) setActiveMapId(list[0].id);
  }

  useEffect(() => {
    setActiveMapId("");
    loadAtlas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const activeMap = maps.find((m) => m.id === activeMapId) ?? maps[0];
  const mapPins = pins.filter((p) => p.mapId === activeMap?.id);
  const mapRoutes = routes.filter((r) => r.mapId === activeMap?.id);

  const allLayers = useMemo(
    () => Array.from(new Set(mapPins.map((p) => p.layer || "Chung"))),
    [mapPins]
  );

  const visiblePins = mapPins.filter((p) => !hiddenLayers.has(p.layer || "Chung"));

  const rulerDistKm = calculateRouteDistanceKm(
    rulerPoints,
    activeMap?.scaleKmPerWidth || 2400
  );
  const travelEst = estimateTravelDays(rulerDistKm);

  function toggleLayer(layer: string) {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!activeMap) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;

    if (mode === "add_pin" && canEdit) {
      setDraftPinCoords({ x, y });
      setPinLabel("");
      setPinDesc("");
      setPinEntryId("");
    } else if (mode === "ruler" || mode === "draw_route") {
      setRulerPoints((prev) => [...prev, { xPercent: x, yPercent: y }]);
    }
  }

  async function handleSaveRoute() {
    if (!activeMap || rulerPoints.length < 2 || !routeName.trim()) return;
    await fetch("/api/atlas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "route",
        mapId: activeMap.id,
        workspaceId,
        name: routeName.trim(),
        description: `Tuyến đường dài ~${rulerDistKm.toLocaleString("vi-VN")} km`,
        color: routeColor,
        dashed: true,
        points: rulerPoints
      })
    });
    setRouteName("");
    setRulerPoints([]);
    setMode("view");
    await loadAtlas();
  }

  async function handleDeleteRoute(id: string) {
    await fetch(`/api/atlas?kind=route&id=${id}`, { method: "DELETE" });
    await loadAtlas();
  }

  async function handleSavePin(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMap || !draftPinCoords || !pinLabel.trim()) return;
    await fetch("/api/atlas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "pin",
        mapId: activeMap.id,
        workspaceId,
        label: pinLabel,
        description: pinDesc,
        layer: pinLayer,
        xPercent: draftPinCoords.x,
        yPercent: draftPinCoords.y,
        icon: pinIcon,
        sigil: pinSigil,
        color: pinColor,
        entryId: pinEntryId || null
      })
    });
    setDraftPinCoords(null);
    setMode("view");
    await loadAtlas();
  }

  async function handleDeletePin(pinId: string) {
    await fetch(`/api/atlas?kind=pin&id=${pinId}`, { method: "DELETE" });
    setSelectedPin(null);
    await loadAtlas();
  }

  async function handleCreateMap(e: React.FormEvent) {
    e.preventDefault();
    if (!mapName.trim()) return;
    const res = await fetch("/api/atlas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "map",
        workspaceId,
        name: mapName,
        description: mapDesc,
        imageUrl: mapImageUrl
      })
    });
    const data = await res.json();
    setMapModalOpen(false);
    setMapName("");
    setMapDesc("");
    setMapImageUrl("");
    await loadAtlas();
    if (data.map?.id) setActiveMapId(data.map.id);
  }

  return (
    <div className="space-y-4">
      {/* Atlas Mode Switcher: Mega-Planet 360-Nation Wiki Atlas vs Custom Workspace Maps */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAtlasTab("planetary")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
              atlasTab === "planetary"
                ? "bg-[var(--accent)] text-[#090e1c] shadow"
                : "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
            }`}
          >
            <Globe2 className="h-4 w-4" />
            Bản đồ Đại Hành Tinh (360 Quốc gia · 8 Lục địa)
          </button>
          <button
            type="button"
            onClick={() => setAtlasTab("custom")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
              atlasTab === "custom"
                ? "bg-[var(--accent)] text-[#090e1c] shadow"
                : "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
            }`}
          >
            <MapIcon className="h-4 w-4" />
            Bản đồ Tùy chỉnh Workspace ({maps.length})
          </button>
        </div>
        <span className="text-[11px] text-[var(--text-muted)]">
          {atlasTab === "planetary"
            ? "Bản đồ Địa lý Bách khoa: 360 quốc gia · 8 lớp dữ liệu bật/tắt · Lịch sử theo mốc thời gian."
            : "Tải bản đồ riêng, gắn ghim liên kết bài viết và vẽ hành trình trong Workspace."}
        </span>
      </div>

      {/* 8-Layer World Atlas Toggle Bar (Draggable & Touch-Swipeable) */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 px-3 py-2 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-[var(--accent)] inline-flex items-center gap-1 shrink-0">
          <Layers className="w-3.5 h-3.5" /> 8 Lớp Bản đồ:
        </span>
        <div className="flex-1 min-w-0">
          <DraggableScrollArea ariaLabel="8 lớp bản đồ thế giới" innerClassName="flex items-center gap-1.5">
            {WORLD_ATLAS_8_LAYERS.map((layer) => {
              const on = activeWorldLayers.has(layer.id);
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() =>
                    setActiveWorldLayers((prev) => {
                      const next = new Set(prev);
                      if (next.has(layer.id)) next.delete(layer.id);
                      else next.add(layer.id);
                      return next;
                    })
                  }
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] border cursor-pointer transition ${
                    on
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                      : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {on ? "✓ " : ""}
                  {layer.label}
                </button>
              );
            })}
          </DraggableScrollArea>
        </div>
      </div>

      {atlasTab === "planetary" ? (
        <PlanetaryAtlasStudio
          entries={entries}
          canEdit={canEdit}
          initialFocusNationId={initialFocusNationId}
          onOpenEntry={onOpenEntry}
          onCreateEntryFromAtlas={onCreateEntryFromAtlas}
          onCreateTaskForNation={onCreateTaskForNation}
        />
      ) : (
      <>
      <div className="codex-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
              <MapIcon className="w-5 h-5" />
              Bản đồ & Sơ đồ Không gian V2.0 (Layers · Routes · Distance Ruler)
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Bật/tắt tầng lớp bản đồ, vẽ tuyến đường hành trình, đo khoảng cách địa lý và bấm ghim mở thẳng hồ sơ Codex.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={activeMap?.id || ""}
              onChange={(e) => {
                setActiveMapId(e.target.value);
                setSelectedPin(null);
                setRulerPoints([]);
              }}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5 text-xs"
            >
              {maps.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <button type="button" onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))} className="p-1.5 rounded-lg border border-[var(--border-subtle)] cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
            <button type="button" onClick={() => setZoom((z) => Math.min(2, z + 0.2))} className="p-1.5 rounded-lg border border-[var(--border-subtle)] cursor-pointer"><ZoomIn className="w-4 h-4" /></button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "ruler" ? "view" : "ruler");
                setRulerPoints([]);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer ${
                mode === "ruler"
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c] font-semibold"
                  : "border-[var(--border-subtle)] hover:border-[var(--accent)]"
              }`}
            >
              <Ruler className="w-3.5 h-3.5" /> Thước đo
            </button>

            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => setMode(mode === "add_pin" ? "view" : "add_pin")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer ${
                    mode === "add_pin"
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c] font-semibold"
                      : "border-[var(--border-strong)] text-[var(--accent)]"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> + Ghim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "draw_route" ? "view" : "draw_route");
                    setRulerPoints([]);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer ${
                    mode === "draw_route"
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c] font-semibold"
                      : "border-[var(--border-subtle)] hover:border-[var(--accent)]"
                  }`}
                >
                  <Route className="w-3.5 h-3.5" /> + Tuyến đường
                </button>
                <button type="button" onClick={() => setMapModalOpen(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Bản đồ
                </button>
              </>
            )}
          </div>
        </div>

        {/* Map Layers Bar */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 border-t border-[var(--border-subtle)]">
          <span className="text-[var(--text-muted)] flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-[var(--accent)]" /> Tầng lớp:
          </span>
          {allLayers.map((layer) => {
            const active = !hiddenLayers.has(layer);
            return (
              <button
                key={layer}
                type="button"
                onClick={() => toggleLayer(layer)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border-subtle)] text-[var(--text-muted)] line-through"
                }`}
              >
                {layer}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowRoutes((v) => !v)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer ${
              showRoutes
                ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
                : "border-[var(--border-subtle)] text-[var(--text-muted)] line-through"
            }`}
          >
            Tuyến đường ({mapRoutes.length})
          </button>
        </div>

        {/* Ruler / Draw Route Active Feedback */}
        {(mode === "ruler" || mode === "draw_route") && (
          <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <strong className="text-[var(--accent)]">
                {mode === "ruler" ? "Thước đo Khoảng cách Địa lý:" : "Vẽ Tuyến đường mới:"}
              </strong>{" "}
              Đã chọn {rulerPoints.length} điểm · Quãng đường: <strong>{rulerDistKm.toLocaleString("vi-VN")} km</strong>
              {rulerDistKm > 0 && (
                <span className="ml-2 text-[var(--text-muted)]">
                  (Đi bộ ~{travelEst.onFootDays} ngày · Ngựa ~{travelEst.horseCarriageDays} ngày · Thuyền buồm ~{travelEst.sailingShipDays} ngày)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {mode === "draw_route" && rulerPoints.length >= 2 && (
                <>
                  <input type="text" value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="Tên tuyến đường..." className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1" />
                  <input type="color" value={routeColor} onChange={(e) => setRouteColor(e.target.value)} className="w-7 h-7 rounded bg-transparent cursor-pointer" />
                  <button type="button" onClick={handleSaveRoute} className="px-3 py-1 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer">
                    Lưu tuyến
                  </button>
                </>
              )}
              <button type="button" onClick={() => setRulerPoints([])} className="px-2 py-1 rounded border border-[var(--border-subtle)] cursor-pointer">
                Xóa điểm
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Atlas Canvas */}
      {activeMap && (
        <div className="codex-card rounded-2xl p-3 overflow-hidden">
          <div className="overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[#070b16]">
            <div
              onClick={handleCanvasClick}
              style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
              className={`relative w-full aspect-[16/9] min-w-[600px] select-none transition-transform duration-200 ${
                mode !== "view" ? "cursor-crosshair" : "cursor-default"
              }`}
            >
              {activeMap.imageUrl ? (
                <img src={activeMap.imageUrl} alt={activeMap.name} className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 1200 675" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="oceanGlowV2" cx="50%" cy="50%" r="70%">
                      <stop offset="0%" stopColor="#142342" />
                      <stop offset="100%" stopColor="#070c1a" />
                    </radialGradient>
                    <linearGradient id="landGradV2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e2d48" />
                      <stop offset="50%" stopColor="#253652" />
                      <stop offset="100%" stopColor="#1a273f" />
                    </linearGradient>
                  </defs>
                  <rect width="1200" height="675" fill="url(#oceanGlowV2)" />
                  <g stroke="rgba(212,175,55,0.12)" strokeWidth="1" fill="none">
                    <circle cx="600" cy="337" r="240" strokeDasharray="6 6" />
                    <circle cx="600" cy="337" r="380" strokeDasharray="3 9" />
                    <line x1="0" y1="337" x2="1200" y2="337" />
                    <line x1="600" y1="0" x2="600" y2="675" />
                  </g>
                  <path
                    d="M 240 240 C 310 120, 490 85, 650 110 C 810 135, 920 220, 940 340 C 960 460, 860 570, 720 580 C 580 590, 510 510, 400 520 C 270 530, 190 420, 210 310 Z"
                    fill="url(#landGradV2)"
                    stroke="#D4AF37"
                    strokeOpacity="0.45"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M 460 110 C 520 60, 620 65, 670 115 C 620 140, 530 145, 460 110 Z"
                    fill="#264060"
                    stroke="#38BDF8"
                    strokeOpacity="0.55"
                    strokeWidth="2"
                  />
                  <g transform="translate(1060, 110)" fill="#D4AF37" opacity="0.55">
                    <text textAnchor="middle" fontSize="26">✦</text>
                    <text y="34" textAnchor="middle" fontSize="11" fontFamily="monospace">BẮC · AETHELGARD</text>
                  </g>
                </svg>
              )}

              {/* SVG Overlay for Routes & Active Ruler */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                {showRoutes &&
                  mapRoutes.map((r) => (
                    <polyline
                      key={r.id}
                      points={r.points.map((pt) => `${pt.xPercent},${pt.yPercent}`).join(" ")}
                      fill="none"
                      stroke={r.color}
                      strokeWidth={0.55}
                      strokeDasharray={r.dashed ? "1.5 1.2" : undefined}
                      opacity={0.85}
                    />
                  ))}
                {rulerPoints.length >= 2 && (
                  <polyline
                    points={rulerPoints.map((pt) => `${pt.xPercent},${pt.yPercent}`).join(" ")}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth={0.7}
                    strokeDasharray="1 1"
                  />
                )}
              </svg>

              {/* Visible Pins */}
              {visiblePins.map((pin) => (
                <button
                  key={pin.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPin(pin);
                  }}
                  style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%`, borderColor: pin.color, color: pin.color }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center cursor-pointer"
                >
                  <span
                    className="w-8 h-8 rounded-full border-2 bg-[#090e1c]/90 flex items-center justify-center text-sm shadow-lg group-hover:scale-115 transition"
                    style={{ borderColor: pin.color, boxShadow: `0 0 14px ${pin.color}66` }}
                  >
                    {pin.sigil}
                  </span>
                  <span className="mt-1 px-2 py-0.5 rounded bg-black/75 text-[11px] text-white whitespace-nowrap border border-white/10">
                    {pin.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Route Legend */}
          {showRoutes && mapRoutes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {mapRoutes.map((r) => (
                <div key={r.id} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 px-2.5 py-1">
                  <span className="w-3 h-0.5" style={{ backgroundColor: r.color }} />
                  <span className="font-medium">{r.name}</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    (~{calculateRouteDistanceKm(r.points, activeMap.scaleKmPerWidth || 2400)} km)
                  </span>
                  {canEdit && (
                    <button type="button" onClick={() => handleDeleteRoute(r.id)} className="text-rose-400 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedPin && (
            <div className="mt-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span style={{ color: selectedPin.color }} className="text-lg">{selectedPin.sigil}</span>
                  <h4 className="font-display font-semibold text-base">{selectedPin.label}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-[var(--border-subtle)]">{selectedPin.layer || "Chung"}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{selectedPin.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedPin.entryId && (
                  <button type="button" onClick={() => onOpenEntry(selectedPin.entryId!)} className="px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer">
                    Mở Hồ sơ Codex →
                  </button>
                )}
                {canEdit && (
                  <button type="button" onClick={() => handleDeletePin(selectedPin.id)} className="px-2.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 text-xs cursor-pointer">
                    Xóa ghim
                  </button>
                )}
              </div>
            </div>
          )}

          {/* V4.0 Saved Routes & Multi-Mode Travel Calculator */}
          {mapRoutes.length > 0 && (
            <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-semibold text-[var(--accent)] flex items-center gap-2">
                  <Route className="w-4 h-4" />
                  Tuyến đường đã lưu & Máy tính Thời gian Hành trình V4.0 ({mapRoutes.length})
                </h4>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Tỷ lệ bản đồ: {(activeMap.scaleKmPerWidth || 2400).toLocaleString("vi-VN")} km / chiều rộng
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mapRoutes.map((route) => {
                  const km = computeRouteDistanceKm(route, activeMap);
                  const times = computeTravelTimes(km, activeMap.travelModes || DEFAULT_TRAVEL_MODES);
                  return (
                    <div
                      key={route.id}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: route.color }}
                          />
                          <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
                            {route.name}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-semibold text-[var(--accent)] shrink-0">
                          {km.toLocaleString("vi-VN")} km
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {times.map((t) => (
                          <div
                            key={t.mode.id}
                            className="rounded-lg bg-[var(--bg-base)]/70 border border-[var(--border-subtle)] px-2 py-1 flex items-center justify-between gap-1"
                          >
                            <span className="text-[var(--text-muted)] truncate">
                              {t.mode.icon} {t.mode.name}
                            </span>
                            <strong className="text-[var(--text-primary)] shrink-0">{t.label}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Pin Modal */}
      {draftPinCoords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form onSubmit={handleSavePin} className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-[var(--accent)]">✦ Gắn ghim ({draftPinCoords.x}%, {draftPinCoords.y}%)</h3>
              <button type="button" onClick={() => setDraftPinCoords(null)}><X className="w-4 h-4" /></button>
            </div>
            <input type="text" required value={pinLabel} onChange={(e) => setPinLabel(e.target.value)} placeholder="Tên địa điểm *" className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm" />
            <input type="text" value={pinLayer} onChange={(e) => setPinLayer(e.target.value)} placeholder="Tầng lớp (VD: Vương quốc, Thư viện, Thiên nhiên)" className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs" />
            <textarea rows={2} value={pinDesc} onChange={(e) => setPinDesc(e.target.value)} placeholder="Mô tả ngắn..." className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-2.5 text-xs" />
            <select value={pinEntryId} onChange={(e) => setPinEntryId(e.target.value)} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs">
              <option value="">— Liên kết tới Hồ sơ Codex —</option>
              {entries.map((e) => <option key={e.id} value={e.id}>{e.sigil} {e.title}</option>)}
            </select>
            <IconSigilPicker icon={pinIcon} sigil={pinSigil} color={pinColor} onChange={(n) => { setPinIcon(n.icon); setPinSigil(n.sigil); setPinColor(n.color); }} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDraftPinCoords(null)} className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs cursor-pointer">Hủy</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer">Lưu ghim</button>
            </div>
          </form>
        </div>
      )}

      {mapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateMap} className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-[var(--accent)]">✦ Thêm Bản đồ mới</h3>
              <button type="button" onClick={() => setMapModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <input type="text" required value={mapName} onChange={(e) => setMapName(e.target.value)} placeholder="Tên bản đồ *" className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm" />
            <input type="text" value={mapDesc} onChange={(e) => setMapDesc(e.target.value)} placeholder="Mô tả..." className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs" />
            <input type="text" value={mapImageUrl} onChange={(e) => setMapImageUrl(e.target.value)} placeholder="URL ảnh bản đồ (hoặc để trống dùng Vector)" className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMapModalOpen(false)} className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs cursor-pointer">Hủy</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer">Tạo bản đồ</button>
            </div>
          </form>
        </div>
      )}
      </>
      )}
    </div>
  );
}
