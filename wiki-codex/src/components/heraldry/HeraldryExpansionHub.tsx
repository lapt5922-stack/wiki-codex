"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Crown,
  Download,
  GitCompare,
  History,
  Layers,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload
} from "lucide-react";
import type {
  HeraldicMeaningEntry,
  HeraldryCustomTemplate,
  HeraldryDesignData,
  HeraldrySavedDesign,
  HeraldryVersionRecord,
  RegaliaCategoryId,
  RoyalRegaliaItem
} from "@/types/heraldry";
import { computeHeraldrySimilarity } from "@/lib/heraldry/renderer-and-export";
import { CATEGORY_LABELS, STYLE_LABELS } from "@/lib/heraldry/template-catalog";
import { DirectImageUploadField } from "../DirectImageUploadField";
import { HeraldrySvgPreview } from "./HeraldrySvgPreview";

export type ExpansionSubMode =
  | "evolution"
  | "regalia"
  | "meanings"
  | "gallery"
  | "packs";

interface HeraldryExpansionHubProps {
  mode: ExpansionSubMode;
  workspaceId: string;
  canEdit: boolean;
  savedDesigns: HeraldrySavedDesign[];
  currentDesign: HeraldryDesignData;
  onLoadDesignToCanvas: (designData: HeraldryDesignData, meta?: Partial<HeraldrySavedDesign>) => void;
  onRefreshSaved: () => void;
}

const REGALIA_CATEGORY_LABELS: Record<RegaliaCategoryId, string> = {
  crown: "Vương miện (Crown)",
  scepter: "Quyền trượng (Scepter)",
  throne: "Ngai vàng (Throne)",
  great_seal: "Đại ấn (Great Seal)",
  ceremonial_sword: "Kiếm Nghi lễ",
  royal_jewelry: "Trang sức Hoàng gia",
  coronation_mantle: "Áo choàng Đăng quang",
  heirloom: "Bảo vật Kế vị",
  coronation_artifact: "Vật phẩm Đăng quang"
};

const DYNASTY_ROLE_LABELS: Record<string, string> = {
  royal_house: "Hoàng tộc Chính thống",
  noble_family: "Gia tộc Quý tộc",
  cadet_branch: "Nhánh Phụ Gia tộc",
  personal_arms: "Huy hiệu Cá nhân",
  heir_apparent: "Huy hiệu Kế thừa (Thái tử)",
  marriage_alliance: "Huy hiệu Liên minh Hôn nhân"
};

export function HeraldryExpansionHub({
  mode,
  workspaceId,
  canEdit,
  savedDesigns,
  currentDesign,
  onLoadDesignToCanvas,
  onRefreshSaved
}: HeraldryExpansionHubProps) {
  // Evolution & Dynasty
  const [selectedEvoId, setSelectedEvoId] = useState<string>(savedDesigns[0]?.id || "");
  const [evoVersions, setEvoVersions] = useState<HeraldryVersionRecord[]>([]);
  const [compareVerA, setCompareVerA] = useState<number>(1);
  const [compareVerB, setCompareVerB] = useState<number>(1);

  // Regalia Archive
  const [regalia, setRegalia] = useState<RoyalRegaliaItem[]>([]);
  const [regForm, setRegForm] = useState({
    name: "",
    category: "crown" as RegaliaCategoryId,
    imageUrl: "",
    origin: "",
    history: "",
    materials: "",
    linkedKingdomId: "KING-000001",
    linkedKingdomName: "",
    linkedCharacterId: "",
    linkedCharacterName: "",
    dynastyName: "",
    eraLabel: "",
    sourceCitation: ""
  });

  // Heraldic Meaning DB
  const [meanings, setMeanings] = useState<HeraldicMeaningEntry[]>([]);
  const [meaningQ, setMeaningQ] = useState("");
  const [meanForm, setMeanForm] = useState({
    entryType: "symbol" as HeraldicMeaningEntry["entryType"],
    refId: "sym-lion",
    title: "",
    civilization: "",
    iconographicMeaning: "",
    colorMeaning: "",
    culturalContext: "",
    politicalMeaning: "",
    religiousMeaning: "",
    legendAndLore: "",
    origin: "",
    sourceCitation: "",
    verificationStatus: "in_world_canon" as HeraldicMeaningEntry["verificationStatus"]
  });

  // Gallery & 2-4 Emblem Comparison
  const [galleryCat, setGalleryCat] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Custom Templates & Asset Packs
  const [customTemplates, setCustomTemplates] = useState<HeraldryCustomTemplate[]>([]);
  const [tplName, setTplName] = useState("");
  const [tplCollection, setTplCollection] = useState("Bộ sưu tập Hoàng gia");
  const [tplLicense, setTplLicense] = useState("Aethel Codex Internal");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadEvolution = useCallback(async (id: string) => {
    if (!id) {
      setEvoVersions([]);
      return;
    }
    const res = await fetch(`/api/heraldry?mode=versions&designId=${encodeURIComponent(id)}`);
    const data = await res.json();
    const list: HeraldryVersionRecord[] = data.versions || [];
    setEvoVersions(list);
    if (list.length > 0) {
      setCompareVerA(list[list.length - 1].versionNumber);
      setCompareVerB(list[0].versionNumber);
    }
  }, []);

  const loadRegalia = useCallback(async () => {
    const res = await fetch(`/api/heraldry?mode=regalia&workspaceId=${encodeURIComponent(workspaceId)}`);
    const data = await res.json();
    setRegalia(data.regalia || []);
  }, [workspaceId]);

  const loadMeanings = useCallback(async () => {
    const res = await fetch(`/api/heraldry?mode=meanings&workspaceId=${encodeURIComponent(workspaceId)}`);
    const data = await res.json();
    setMeanings(data.meanings || []);
  }, [workspaceId]);

  const loadCustomTemplates = useCallback(async () => {
    const res = await fetch(`/api/heraldry?mode=custom_templates&workspaceId=${encodeURIComponent(workspaceId)}`);
    const data = await res.json();
    setCustomTemplates(data.customTemplates || []);
  }, [workspaceId]);

  useEffect(() => {
    if (mode === "evolution") {
      const id = selectedEvoId || savedDesigns[0]?.id || "";
      if (id && id !== selectedEvoId) setSelectedEvoId(id);
      if (id) void loadEvolution(id);
    } else if (mode === "regalia") {
      void loadRegalia();
    } else if (mode === "meanings") {
      void loadMeanings();
    } else if (mode === "packs") {
      void loadCustomTemplates();
    }
  }, [mode, selectedEvoId, savedDesigns, loadEvolution, loadRegalia, loadMeanings, loadCustomTemplates]);

  const verAObj = useMemo(() => evoVersions.find((v) => v.versionNumber === compareVerA) || null, [evoVersions, compareVerA]);
  const verBObj = useMemo(() => evoVersions.find((v) => v.versionNumber === compareVerB) || null, [evoVersions, compareVerB]);

  async function restoreVersion(designId: string, versionNumber: number) {
    if (!canEdit) return;
    const res = await fetch("/api/heraldry", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore_version", designId, versionNumber })
    });
    if (res.ok) {
      setStatusMsg(`Đã khôi phục thiết kế về phiên bản v${versionNumber}.`);
      onRefreshSaved();
      void loadEvolution(designId);
    }
  }

  async function submitRegalia(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit || !regForm.name.trim()) return;
    const res = await fetch("/api/heraldry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_regalia", workspaceId, ...regForm })
    });
    if (res.ok) {
      setRegForm({
        name: "",
        category: "crown",
        imageUrl: "",
        origin: "",
        history: "",
        materials: "",
        linkedKingdomId: "KING-000001",
        linkedKingdomName: "",
        linkedCharacterId: "",
        linkedCharacterName: "",
        dynastyName: "",
        eraLabel: "",
        sourceCitation: ""
      });
      setStatusMsg("Đã lưu bảo vật vào Royal Regalia Archive.");
      void loadRegalia();
    }
  }

  async function submitMeaning(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit || !meanForm.title.trim() || !meanForm.civilization.trim()) return;
    const res = await fetch("/api/heraldry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_meaning", workspaceId, ...meanForm })
    });
    if (res.ok) {
      setMeanForm({
        entryType: "symbol",
        refId: "",
        title: "",
        civilization: "",
        iconographicMeaning: "",
        colorMeaning: "",
        culturalContext: "",
        politicalMeaning: "",
        religiousMeaning: "",
        legendAndLore: "",
        origin: "",
        sourceCitation: "",
        verificationStatus: "in_world_canon"
      });
      setStatusMsg("Đã bổ sung mục tra cứu vào Heraldic Meaning Database.");
      void loadMeanings();
    }
  }

  async function saveCurrentAsTemplate() {
    if (!canEdit || !tplName.trim()) return;
    const res = await fetch("/api/heraldry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_custom_template",
        workspaceId,
        name: tplName.trim(),
        collectionName: tplCollection.trim() || "Bộ sưu tập Chung",
        license: tplLicense.trim() || "Aethel Codex Internal",
        category: "kingdom_emblem",
        style: "imperial",
        designData: currentDesign
      })
    });
    if (res.ok) {
      setTplName("");
      setStatusMsg("Đã lưu thiết kế hiện tại thành Mẫu Tùy chỉnh.");
      void loadCustomTemplates();
    }
  }

  function exportPackJson() {
    const payload = {
      format: "aethel-heraldry-asset-pack-v2",
      exportedAt: new Date().toISOString(),
      templates: customTemplates
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aethel-heraldry-pack-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportPackFile(file: File) {
    if (!canEdit) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : parsed.templates;
      if (!Array.isArray(list)) {
        setStatusMsg("File JSON không đúng định dạng Asset Pack.");
        return;
      }
      const res = await fetch("/api/heraldry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_asset_pack", workspaceId, templates: list })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`Đã nhập thành công ${data.imported} mẫu từ Asset Pack.`);
        void loadCustomTemplates();
      }
    } catch {
      setStatusMsg("Không thể đọc file JSON Asset Pack.");
    }
  }

  // ========================================================
  // 1. HERALDRY EVOLUTION & DYNASTY
  // ========================================================
  if (mode === "evolution") {
    const selectedDesign = savedDesigns.find((d) => d.id === selectedEvoId);
    const verSim =
      verAObj && verBObj
        ? computeHeraldrySimilarity(verAObj.designData, verBObj.designData)
        : null;

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#C6A568]/25 bg-[#1D2636]/75 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-bold text-[#E9DFC9] flex items-center gap-2">
              <History className="w-4 h-4 text-[#C6A568]" />
              Heraldry Evolution & Phả hệ Hoàng tộc / Gia tộc
            </h3>
            <p className="text-xs text-[#E9DFC9]/65">
              Theo dõi tiến hóa huy hiệu qua từng triều đại, so sánh 2 phiên bản song song và khôi phục an toàn.
            </p>
          </div>
          <select
            value={selectedEvoId}
            onChange={(e) => setSelectedEvoId(e.target.value)}
            className="rounded-lg border border-[#C6A568]/30 bg-[#101522] px-3 py-2 text-xs text-[#E9DFC9]"
          >
            {savedDesigns.length === 0 && <option value="">Chưa có thiết kế đã lưu</option>}
            {savedDesigns.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.id} · v{d.version}{d.isOfficial ? " · CHÍNH THỨC" : ""})
              </option>
            ))}
          </select>
        </div>

        {statusMsg && <div className="text-xs text-emerald-300 px-1">{statusMsg}</div>}

        {selectedDesign && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Dynasty & Provenance Summary */}
            <div className="lg:col-span-4 rounded-2xl border border-[#C6A568]/20 bg-[#101522]/80 p-4 space-y-2.5 text-xs">
              <div className="font-serif font-bold text-[#C6A568] uppercase tracking-wider">
                Hồ sơ Hoàng tộc & Liên kết
              </div>
              <div className="flex justify-between"><span className="text-[#E9DFC9]/60">Vương quốc:</span><span>{selectedDesign.linkedKingdomId || "Chưa gắn"}</span></div>
              <div className="flex justify-between"><span className="text-[#E9DFC9]/60">Triều đại / Gia tộc:</span><span>{selectedDesign.dynastyName || "Chưa cập nhật"}</span></div>
              <div className="flex justify-between"><span className="text-[#E9DFC9]/60">Vai trò Phả hệ:</span><span>{selectedDesign.dynastyRole ? DYNASTY_ROLE_LABELS[selectedDesign.dynastyRole] : "Quốc huy Chung"}</span></div>
              <div className="flex justify-between"><span className="text-[#E9DFC9]/60">Nhân vật gắn kết:</span><span>{selectedDesign.linkedCharacterId || "—"}</span></div>
              <div className="flex justify-between"><span className="text-[#E9DFC9]/60">Sự kiện lịch sử:</span><span>{selectedDesign.linkedEventTitle || "—"}</span></div>
              <div className="flex justify-between"><span className="text-[#E9DFC9]/60">Người thiết kế:</span><span>{selectedDesign.createdBy}</span></div>
              <div className="flex justify-between"><span className="text-[#E9DFC9]/60">Người phê duyệt:</span><span>{selectedDesign.approvedBy || "Chờ xác nhận"}</span></div>
            </div>

            {/* Side-by-Side 2-Version Comparison */}
            <div className="lg:col-span-8 rounded-2xl border border-[#C6A568]/25 bg-[#1D2636]/70 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-serif text-sm font-bold text-[#E9DFC9] flex items-center gap-1.5">
                  <GitCompare className="w-4 h-4 text-[#C6A568]" /> So sánh 2 Phiên bản Song song
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={compareVerA}
                    onChange={(e) => setCompareVerA(Number(e.target.value))}
                    className="rounded border border-[#C6A568]/25 bg-[#101522] px-2 py-1"
                  >
                    {evoVersions.map((v) => (
                      <option key={v.id} value={v.versionNumber}>v{v.versionNumber} (Trái)</option>
                    ))}
                  </select>
                  <span className="text-[#C6A568]">vs</span>
                  <select
                    value={compareVerB}
                    onChange={(e) => setCompareVerB(Number(e.target.value))}
                    className="rounded border border-[#C6A568]/25 bg-[#101522] px-2 py-1"
                  >
                    {evoVersions.map((v) => (
                      <option key={v.id} value={v.versionNumber}>v{v.versionNumber} (Phải)</option>
                    ))}
                  </select>
                </div>
              </div>

              {verAObj && verBObj ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[verAObj, verBObj].map((ver, idx) => (
                      <div key={`${ver.id}-${idx}`} className="rounded-xl border border-[#C6A568]/20 bg-[#101522] p-3 flex flex-col items-center">
                        <HeraldrySvgPreview design={ver.designData} uid={`evo-${ver.id}-${idx}`} size={160} />
                        <div className="mt-2 text-xs font-bold text-[#C6A568]">Phiên bản v{ver.versionNumber}</div>
                        <div className="text-[11px] text-[#E9DFC9]/75 text-center">{ver.changeNote}</div>
                        <div className="text-[10px] text-[#E9DFC9]/50 mt-0.5">
                          {ver.editorName} · {new Date(ver.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                      </div>
                    ))}
                  </div>
                  {verSim && (
                    <div className="rounded-xl bg-[#101522]/80 border border-[#C6A568]/20 px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
                      <span>Mức độ tương đồng giữa 2 phiên bản: <strong className="text-[#C6A568]">{verSim.score}%</strong></span>
                      <span className="text-[#E9DFC9]/70">{verSim.summary}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-[#E9DFC9]/60">Hãy lưu ít nhất 1 thiết kế trong Xưởng Quốc huy để xem tiến hóa phiên bản.</p>
              )}
            </div>
          </div>
        )}

        {/* Timeline list */}
        <div className="rounded-2xl border border-[#C6A568]/20 bg-[#1D2636]/60 p-4 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#C6A568]">
            Dòng thời gian Tiến hóa Phiên bản ({evoVersions.length})
          </div>
          <div className="space-y-2">
            {evoVersions.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#C6A568]/15 bg-[#101522]/80 p-3">
                <div className="flex items-center gap-3">
                  <HeraldrySvgPreview design={v.designData} uid={`tl-${v.id}`} size={46} />
                  <div>
                    <div className="text-xs font-bold text-[#E9DFC9]">
                      v{v.versionNumber} · {v.changeNote}
                    </div>
                    <div className="text-[11px] text-[#E9DFC9]/60">
                      Thiết kế: {v.editorName} {v.approverName ? `· Duyệt: ${v.approverName}` : ""} · {v.eraLabel || "Chưa gắn thời đại"} · {new Date(v.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>
                {canEdit && selectedEvoId && (
                  <button
                    type="button"
                    onClick={() => void restoreVersion(selectedEvoId, v.versionNumber)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#C6A568]/35 px-2.5 py-1.5 text-[11px] font-semibold text-[#C6A568] hover:bg-[#C6A568]/15"
                  >
                    <RotateCcw className="w-3 h-3" /> Khôi phục v{v.versionNumber}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // 2. ROYAL REGALIA ARCHIVE (REGA-XXXXXX)
  // ========================================================
  if (mode === "regalia") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {canEdit && (
          <form onSubmit={submitRegalia} className="lg:col-span-4 rounded-2xl border border-[#C6A568]/25 bg-[#1D2636]/75 p-4 space-y-2.5">
            <h3 className="font-serif text-base font-bold text-[#E9DFC9] flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#C6A568]" /> Thêm Bảo vật Hoàng gia
            </h3>
            <input
              required
              value={regForm.name}
              onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              placeholder="Tên bảo vật (VD: Vương miện Mặt trời Aethel)..."
              className="w-full rounded-lg border border-[#C6A568]/25 bg-[#101522] px-3 py-2 text-xs text-[#E9DFC9]"
            />
            <select
              value={regForm.category}
              onChange={(e) => setRegForm({ ...regForm, category: e.target.value as RegaliaCategoryId })}
              className="w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-2.5 py-2 text-xs text-[#E9DFC9]"
            >
              {Object.entries(REGALIA_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <DirectImageUploadField
              label="Ảnh Bảo vật (Upload trực tiếp)"
              value={regForm.imageUrl}
              onChange={(url) => setRegForm({ ...regForm, imageUrl: url })}
              workspaceId={workspaceId}
              preset="free"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={regForm.linkedKingdomId}
                onChange={(e) => setRegForm({ ...regForm, linkedKingdomId: e.target.value })}
                placeholder="KING-000001"
                className="rounded-lg border border-[#C6A568]/20 bg-[#101522] px-2.5 py-1.5 text-xs text-[#E9DFC9]"
              />
              <input
                value={regForm.linkedCharacterId}
                onChange={(e) => setRegForm({ ...regForm, linkedCharacterId: e.target.value })}
                placeholder="CHAR-000001 (Chủ sở hữu)"
                className="rounded-lg border border-[#C6A568]/20 bg-[#101522] px-2.5 py-1.5 text-xs text-[#E9DFC9]"
              />
            </div>
            <input
              value={regForm.origin}
              onChange={(e) => setRegForm({ ...regForm, origin: e.target.value })}
              placeholder="Nguồn gốc & Thời kỳ chế tác..."
              className="w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9]"
            />
            <textarea
              rows={3}
              value={regForm.history}
              onChange={(e) => setRegForm({ ...regForm, history: e.target.value })}
              placeholder="Lịch sử, nghi lễ đăng quang & sự kiện gắn liền..."
              className="w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9]"
            />
            <input
              value={regForm.sourceCitation}
              onChange={(e) => setRegForm({ ...regForm, sourceCitation: e.target.value })}
              placeholder="Nguồn tham khảo / Thư tịch..."
              className="w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9]"
            />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C6A568] px-3 py-2 text-xs font-bold text-[#101522] hover:bg-[#d8b97e]"
            >
              <Plus className="w-3.5 h-3.5" /> Lưu vào Kho Bảo vật
            </button>
            {statusMsg && <p className="text-[11px] text-emerald-300">{statusMsg}</p>}
          </form>
        )}

        <div className={`${canEdit ? "lg:col-span-8" : "lg:col-span-12"} rounded-2xl border border-[#C6A568]/25 bg-[#1D2636]/65 p-4 space-y-3`}>
          <h3 className="font-serif text-base font-bold text-[#E9DFC9]">
            Kho Lưu trữ Bảo vật Hoàng gia — Royal Regalia Archive ({regalia.length})
          </h3>
          {regalia.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#C6A568]/25 p-8 text-center text-xs text-[#E9DFC9]/60">
              Chưa có bảo vật hoàng gia nào được lưu. Hãy thêm Vương miện, Quyền trượng, Ngai vàng hoặc Đại ấn từ biểu mẫu bên trái.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {regalia.map((item) => (
                <div key={item.id} className="rounded-xl border border-[#C6A568]/20 bg-[#101522]/85 p-3 flex gap-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-lg object-cover border border-[#C6A568]/30 shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg border border-[#C6A568]/25 bg-[#1D2636] flex items-center justify-center shrink-0">
                      <Crown className="w-7 h-7 text-[#C6A568]/70" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-serif text-sm font-bold text-[#E9DFC9] truncate">{item.name}</div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/heraldry?entity=regalia&id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
                            void loadRegalia();
                          }}
                          className="text-rose-300 hover:text-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-[#C6A568]">
                      {item.id} · {REGALIA_CATEGORY_LABELS[item.category]} · {item.linkedKingdomId || "Hoàng gia"}
                    </div>
                    <p className="text-xs text-[#E9DFC9]/75 line-clamp-2">{item.history || item.origin || "Chưa cập nhật lịch sử."}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================================================
  // 3. HERALDIC MEANING DATABASE
  // ========================================================
  if (mode === "meanings") {
    const filteredMeanings = meanings.filter((m) => {
      if (!meaningQ.trim()) return true;
      const q = meaningQ.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.civilization.toLowerCase().includes(q) ||
        m.iconographicMeaning.toLowerCase().includes(q)
      );
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${canEdit ? "lg:col-span-8" : "lg:col-span-12"} space-y-3`}>
          <div className="rounded-2xl border border-[#C6A568]/25 bg-[#1D2636]/75 p-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-base font-bold text-[#E9DFC9] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C6A568]" /> Cơ sở dữ liệu Ý nghĩa Biểu tượng (Heraldic Meaning DB)
              </h3>
              <p className="text-xs text-[#E9DFC9]/65">
                Mọi mục đều phân định rõ trạng thái xác minh và trích dẫn nguồn — không tự xác nhận ý nghĩa chưa có nguồn.
              </p>
            </div>
            <input
              value={meaningQ}
              onChange={(e) => setMeaningQ(e.target.value)}
              placeholder="Tra cứu biểu tượng, màu sắc, văn minh..."
              className="rounded-lg border border-[#C6A568]/25 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9] w-64"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredMeanings.map((m) => (
              <div key={m.id} className="rounded-2xl border border-[#C6A568]/20 bg-[#101522]/85 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-serif text-sm font-bold text-[#E9DFC9]">{m.title}</div>
                    <div className="text-[11px] text-[#C6A568]">{m.civilization} · {m.id}</div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      m.verificationStatus === "verified_source"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : m.verificationStatus === "in_world_canon"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-slate-500/25 text-slate-300"
                    }`}
                  >
                    {m.verificationStatus === "verified_source"
                      ? "Có nguồn xác minh"
                      : m.verificationStatus === "in_world_canon"
                      ? "Canon Nội bộ"
                      : "Bản nháp (Chưa nguồn)"}
                  </span>
                </div>
                <p className="text-xs text-[#E9DFC9]/85"><strong>Hình tượng:</strong> {m.iconographicMeaning}</p>
                {m.colorMeaning && <p className="text-xs text-[#E9DFC9]/75"><strong>Màu sắc:</strong> {m.colorMeaning}</p>}
                {m.politicalMeaning && <p className="text-xs text-[#E9DFC9]/75"><strong>Chính trị / Văn hóa:</strong> {m.politicalMeaning}</p>}
                {m.religiousMeaning && <p className="text-xs text-[#E9DFC9]/75"><strong>Tôn giáo / Truyền thuyết:</strong> {m.religiousMeaning}</p>}
                <div className="pt-1 border-t border-[#C6A568]/15 text-[10px] text-[#E9DFC9]/55">
                  Nguồn: {m.sourceCitation || "Chưa cung cấp nguồn dẫn"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {canEdit && (
          <form onSubmit={submitMeaning} className="lg:col-span-4 rounded-2xl border border-[#C6A568]/25 bg-[#1D2636]/75 p-4 space-y-2.5 h-fit">
            <h4 className="font-serif text-sm font-bold text-[#C6A568]">Bổ sung Mục Ý nghĩa Mới</h4>
            <input
              required
              value={meanForm.title}
              onChange={(e) => setMeanForm({ ...meanForm, title: e.target.value })}
              placeholder="Tên biểu tượng / màu sắc..."
              className="w-full rounded-lg border border-[#C6A568]/25 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9]"
            />
            <input
              required
              value={meanForm.civilization}
              onChange={(e) => setMeanForm({ ...meanForm, civilization: e.target.value })}
              placeholder="Nền văn minh / Vương quốc..."
              className="w-full rounded-lg border border-[#C6A568]/25 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9]"
            />
            <textarea
              rows={2}
              value={meanForm.iconographicMeaning}
              onChange={(e) => setMeanForm({ ...meanForm, iconographicMeaning: e.target.value })}
              placeholder="Ý nghĩa hình tượng..."
              className="w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9]"
            />
            <textarea
              rows={2}
              value={meanForm.politicalMeaning}
              onChange={(e) => setMeanForm({ ...meanForm, politicalMeaning: e.target.value })}
              placeholder="Ý nghĩa chính trị / văn hóa..."
              className="w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9]"
            />
            <input
              value={meanForm.sourceCitation}
              onChange={(e) => setMeanForm({ ...meanForm, sourceCitation: e.target.value })}
              placeholder="Trích dẫn nguồn (Bắt buộc nếu chọn Đã xác minh)..."
              className="w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9]"
            />
            <select
              value={meanForm.verificationStatus}
              onChange={(e) => setMeanForm({ ...meanForm, verificationStatus: e.target.value as HeraldicMeaningEntry["verificationStatus"] })}
              className="w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-2.5 py-1.5 text-xs text-[#E9DFC9]"
            >
              <option value="in_world_canon">Canon Nội bộ Thế giới</option>
              <option value="verified_source">Có nguồn xác minh</option>
              <option value="unverified_draft">Bản nháp chưa nguồn</option>
            </select>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#C6A568] px-3 py-2 text-xs font-bold text-[#101522] hover:bg-[#d8b97e]"
            >
              Lưu Mục Ý nghĩa
            </button>
            {statusMsg && <p className="text-[11px] text-emerald-300">{statusMsg}</p>}
          </form>
        )}
      </div>
    );
  }

  // ========================================================
  // 4. HERALDRY GALLERY & 2-4 EMBLEM COMPARISON
  // ========================================================
  if (mode === "gallery") {
    const filtered = savedDesigns.filter((d) => !galleryCat || d.category === galleryCat);
    const compared = compareIds
      .map((id) => savedDesigns.find((d) => d.id === id))
      .filter(Boolean) as HeraldrySavedDesign[];

    function toggleCompare(id: string) {
      setCompareIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#C6A568]/25 bg-[#1D2636]/75 p-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-base font-bold text-[#E9DFC9] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C6A568]" /> Triển lãm Huy hiệu & So sánh Song song (2–4 Huy hiệu)
            </h3>
            <p className="text-xs text-[#E9DFC9]/65">
              Chọn tối đa 4 huy hiệu để đối chiếu màu sắc, dáng khiên, bố cục và chỉ số tương đồng.
            </p>
          </div>
          <select
            value={galleryCat}
            onChange={(e) => setGalleryCat(e.target.value)}
            className="rounded-lg border border-[#C6A568]/25 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9]"
          >
            <option value="">Tất cả 10 danh mục</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {compared.length >= 2 && (
          <div className="rounded-2xl border border-[#C6A568]/40 bg-[#101522] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm font-bold text-[#C6A568]">
                Bảng So sánh Trực quan ({compared.length} huy hiệu)
              </span>
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="text-xs text-[#E9DFC9]/70 hover:text-[#C6A568]"
              >
                Xóa chọn
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {compared.map((item) => {
                const simWithFirst =
                  item.id === compared[0].id
                    ? null
                    : computeHeraldrySimilarity(compared[0].designData, item.designData);
                return (
                  <div key={item.id} className="rounded-xl border border-[#C6A568]/25 bg-[#1D2636]/60 p-3 flex flex-col items-center text-center">
                    <HeraldrySvgPreview design={item.designData} uid={`cmp-${item.id}`} size={130} />
                    <div className="mt-2 font-serif text-xs font-bold text-[#E9DFC9]">{item.name}</div>
                    <div className="text-[10px] text-[#C6A568]">{STYLE_LABELS[item.style]} · {item.designData.shield.shape}</div>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="h-3.5 w-3.5 rounded-full border border-white/25" style={{ backgroundColor: item.designData.shield.primaryColor }} />
                      <span className="h-3.5 w-3.5 rounded-full border border-white/25" style={{ backgroundColor: item.designData.shield.secondaryColor }} />
                      <span className="h-3.5 w-3.5 rounded-full border border-white/25" style={{ backgroundColor: item.designData.shield.borderColor }} />
                    </div>
                    {simWithFirst && (
                      <div className="mt-2 rounded-lg bg-[#101522] px-2 py-1 text-[10px] text-[#E9DFC9]/80">
                        Tương đồng với #1: <strong className="text-[#C6A568]">{simWithFirst.score}%</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-[#C6A568]/25 p-8 text-center text-xs text-[#E9DFC9]/60">
              Chưa có huy hiệu nào được lưu trong Triển lãm. Hãy lưu thiết kế từ Xưởng Quốc huy trước.
            </div>
          ) : (
            filtered.map((d) => {
              const selected = compareIds.includes(d.id);
              return (
                <div
                  key={d.id}
                  className={`rounded-2xl border p-3 flex flex-col items-center text-center transition-all ${
                    selected
                      ? "border-[#C6A568] bg-[#C6A568]/10"
                      : "border-[#C6A568]/20 bg-[#101522]/85"
                  }`}
                >
                  <HeraldrySvgPreview design={d.designData} uid={`gal-${d.id}`} size={120} />
                  <div className="mt-2 font-serif text-xs font-bold text-[#E9DFC9] truncate w-full">{d.name}</div>
                  <div className="text-[10px] text-[#C6A568]/85">{CATEGORY_LABELS[d.category]} · v{d.version}</div>
                  <div className="mt-2 flex gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => toggleCompare(d.id)}
                      className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold ${
                        selected
                          ? "bg-[#C6A568] text-[#101522]"
                          : "border border-[#C6A568]/30 text-[#E9DFC9]"
                      }`}
                    >
                      {selected ? "Đang so sánh" : "So sánh"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onLoadDesignToCanvas(d.designData, d)}
                      className="rounded-lg border border-[#C6A568]/30 px-2.5 py-1.5 text-[11px] text-[#C6A568]"
                    >
                      Mở
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ========================================================
  // 5. CUSTOM TEMPLATES & JSON ASSET PACK MANAGER
  // ========================================================
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-4 rounded-2xl border border-[#C6A568]/25 bg-[#1D2636]/75 p-4 space-y-3">
        <h3 className="font-serif text-base font-bold text-[#E9DFC9] flex items-center gap-2">
          <Package className="w-4 h-4 text-[#C6A568]" /> Custom Template Builder & Asset Packs
        </h3>
        <p className="text-xs text-[#E9DFC9]/65">
          Lưu thiết kế đang mở trên Canvas thành mẫu dùng lại, nhóm theo Bộ sưu tập, và Xuất/Nhập gói JSON Asset Pack.
        </p>

        {canEdit && (
          <div className="space-y-2 border-t border-[#C6A568]/15 pt-3">
            <input
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder="Tên Mẫu Tùy chỉnh..."
              className="w-full rounded-lg border border-[#C6A568]/25 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9]"
            />
            <input
              value={tplCollection}
              onChange={(e) => setTplCollection(e.target.value)}
              placeholder="Tên Bộ sưu tập (Collection)..."
              className="w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9]"
            />
            <input
              value={tplLicense}
              onChange={(e) => setTplLicense(e.target.value)}
              placeholder="Metadata Bản quyền (License)..."
              className="w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9]"
            />
            <button
              type="button"
              onClick={() => void saveCurrentAsTemplate()}
              className="w-full rounded-lg bg-[#C6A568] px-3 py-2 text-xs font-bold text-[#101522] hover:bg-[#d8b97e]"
            >
              Lưu Canvas Hiện tại thành Mẫu
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-[#C6A568]/15 pt-3">
          <button
            type="button"
            onClick={exportPackJson}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#C6A568]/35 bg-[#101522] px-3 py-2 text-xs font-semibold text-[#E9DFC9]"
          >
            <Download className="w-3.5 h-3.5 text-[#C6A568]" /> Xuất Pack JSON
          </button>
          {canEdit && (
            <label className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#C6A568]/35 bg-[#101522] px-3 py-2 text-xs font-semibold text-[#E9DFC9] cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#C6A568]" /> Nhập Pack JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleImportPackFile(f);
                }}
              />
            </label>
          )}
        </div>
        {statusMsg && <p className="text-[11px] text-emerald-300">{statusMsg}</p>}
      </div>

      <div className="lg:col-span-8 rounded-2xl border border-[#C6A568]/25 bg-[#1D2636]/65 p-4 space-y-3">
        <div className="font-serif text-sm font-bold text-[#E9DFC9] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#C6A568]" /> Kho Mẫu Tùy chỉnh ({customTemplates.length})
        </div>
        {customTemplates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#C6A568]/25 p-8 text-center text-xs text-[#E9DFC9]/60">
            Chưa có mẫu tùy chỉnh nào. Hãy thiết kế trên Canvas rồi lưu tại đây để tái sử dụng cho nhiều vương quốc.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {customTemplates.map((t) => (
              <div key={t.id} className="rounded-xl border border-[#C6A568]/20 bg-[#101522]/85 p-3 flex flex-col items-center text-center">
                <HeraldrySvgPreview design={t.designData} uid={`ctpl-${t.id}`} size={110} />
                <div className="mt-2 font-serif text-xs font-bold text-[#E9DFC9] truncate w-full">{t.name}</div>
                <div className="text-[10px] text-[#C6A568]">{t.collectionName} · {t.license}</div>
                <div className="mt-2 flex gap-1.5 w-full">
                  <button
                    type="button"
                    onClick={() => onLoadDesignToCanvas(t.designData)}
                    className="flex-1 rounded-lg bg-[#C6A568]/20 border border-[#C6A568]/40 py-1 text-[11px] font-semibold text-[#C6A568]"
                  >
                    Dùng mẫu
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/heraldry?entity=custom_template&id=${encodeURIComponent(t.id)}`, { method: "DELETE" });
                        void loadCustomTemplates();
                      }}
                      className="rounded-lg border border-rose-500/30 px-2 py-1 text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
