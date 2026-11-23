"use client";

import React, { useState } from "react";
import { Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import type {
  KingdomCustomFieldDef,
  KingdomHydratedDossier,
  KingdomPolityType,
  KingdomWorkflowStatus
} from "@/types/kingdom-codex";
import { WORLD_CURRENCIES } from "@/lib/economy-engine";
import { DirectImageUploadField } from "../DirectImageUploadField";
import { MultiImageGalleryUploader } from "../MultiImageGalleryUploader";
import { useDraftAutoSave } from "@/lib/use-draft-autosave";
import { DraggableScrollArea } from "../DraggableScrollArea";
import {
  FreeformTabBlocksEditor,
  ProfileTabCrudBar
} from "../CustomProfileLayoutBuilder";
import type { EntityProfileLayoutConfig } from "@/lib/empty-field-engine";

interface KingdomEditorModalProps {
  dossier: KingdomHydratedDossier;
  customFieldDefs: KingdomCustomFieldDef[];
  onClose: () => void;
  onSaved: (updated: KingdomHydratedDossier) => void;
}

type BuiltInKEditTab = "identity" | "geo_gov" | "royalty_econ" | "mil_tech_cul" | "stats_events" | "custom";
type KEditTab = BuiltInKEditTab | string;

const K_EDIT_TABS: Array<{ id: BuiltInKEditTab; label: string }> = [
  { id: "identity", label: "1. Nhận diện & Biểu tượng" },
  { id: "geo_gov", label: "2. Địa lý & Chính quyền" },
  { id: "royalty_econ", label: "3. Hoàng gia (CHAR-ID) & Kinh tế" },
  { id: "mil_tech_cul", label: "4. Quân sự, Công nghệ & Văn hóa" },
  { id: "stats_events", label: "5. 14 Chỉ số & Lịch sử" },
  { id: "custom", label: "6. Trường động & Tùy chỉnh" }
];

export function KingdomEditorModal({
  dossier,
  customFieldDefs,
  onClose,
  onSaved
}: KingdomEditorModalProps) {
  const [tab, setTab] = useState<KEditTab>("identity");
  const [draft, setDraft] = useState<KingdomHydratedDossier>(() => structuredClone(dossier));
  const [customValues, setCustomValues] = useState<Record<string, unknown>>(() => {
    const m: Record<string, unknown> = {};
    for (const cf of dossier.customFields) m[cf.definition.id] = cf.value;
    return m;
  });
  const [changeNote, setChangeNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const autoDraft = useDraftAutoSave(`kingdom-codex-draft-${dossier.kingdom.id}`, draft, true);

  async function handleSave() {
    if (!draft.kingdom.officialName.trim()) {
      setError("Vui lòng nhập Tên chính thức quốc gia.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/kingdoms/${encodeURIComponent(draft.kingdom.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          customFieldValues: customValues,
          changeNote: changeNote.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể lưu thay đổi.");
        return;
      }
      autoDraft.clearDraft();
      onSaved(data.dossier);
    } catch {
      setError("Lỗi kết nối khi lưu hồ sơ quốc gia.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-5xl h-[96vh] sm:h-auto sm:max-h-[92vh] rounded-t-2xl sm:rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-4 sm:px-6 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)]">
          <h2 className="font-display text-base sm:text-lg font-bold text-[var(--accent)] flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Chỉnh sửa Quốc gia: {draft.kingdom.id} — {draft.kingdom.officialName}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {(() => {
          const layout: EntityProfileLayoutConfig = draft.kingdom.profileLayout || {};
          const setLayout = (next: EntityProfileLayoutConfig) =>
            setDraft({ ...draft, kingdom: { ...draft.kingdom, profileLayout: next } });
          const hiddenSet = new Set(layout.hiddenBuiltInTabs || []);
          const renamedMap = layout.renamedBuiltInTabs || {};
          const visibleBuiltIn = K_EDIT_TABS.filter((t) => !hiddenSet.has(t.id)).map((t) => ({
            id: t.id,
            label: renamedMap[t.id] || t.label,
            isBuiltIn: true
          }));
          const customTabs = (layout.customTabs || []).map((ct) => ({
            id: ct.id,
            label: `${ct.sigil || "✦"} ${ct.label}`,
            isBuiltIn: false
          }));
          const allTabs = [...visibleBuiltIn, ...customTabs];
          const activeMeta =
            allTabs.find((x) => x.id === tab) || allTabs[0] || { id: "identity", label: "1. Nhận diện", isBuiltIn: true };

          return (
            <div className="px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/60 text-xs space-y-2">
              <DraggableScrollArea ariaLabel="Nhóm dữ liệu vương quốc" innerClassName="flex gap-1.5">
                {allTabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`shrink-0 min-h-[36px] px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                      tab === t.id ? "bg-[var(--accent)] text-[#090e1c] font-bold" : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </DraggableScrollArea>
              <ProfileTabCrudBar
                activeTabId={activeMeta.id}
                activeTabLabel={activeMeta.label}
                isBuiltIn={activeMeta.isBuiltIn}
                layout={layout}
                onChangeLayout={setLayout}
                onSelectTab={(nextId) => setTab(nextId)}
              />
            </div>
          );
        })()}

        {autoDraft.hasSavedDraft && (
          <div className="mx-4 mt-3 rounded-lg bg-amber-500/15 border border-amber-500/40 px-3 py-2 text-xs text-amber-200 flex items-center justify-between gap-2">
            <span>✦ Phát hiện bản nháp tự động lưu trước đó. Bạn có muốn khôi phục?</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const restored = autoDraft.restoreDraft();
                  if (restored) setDraft(restored);
                }}
                className="px-2.5 py-1 rounded bg-amber-400 text-black font-bold cursor-pointer"
              >
                Khôi phục
              </button>
              <button
                type="button"
                onClick={() => autoDraft.clearDraft()}
                className="px-2 py-1 rounded border border-amber-400/40 cursor-pointer"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        )}

        {error && <div className="mx-4 mt-3 rounded-lg bg-rose-500/15 border border-rose-500/40 px-3 py-2 text-xs text-rose-200">{error}</div>}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {tab === "identity" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[var(--accent)] mb-1">Tên chính thức *</label>
                  <input value={draft.kingdom.officialName} onChange={(e) => setDraft({ ...draft, kingdom: { ...draft.kingdom, officialName: e.target.value } })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Tên thông dụng</label>
                  <input value={draft.kingdom.commonName} onChange={(e) => setDraft({ ...draft, kingdom: { ...draft.kingdom, commonName: e.target.value } })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Tên cổ đại</label>
                  <input value={draft.kingdom.ancientName} onChange={(e) => setDraft({ ...draft, kingdom: { ...draft.kingdom, ancientName: e.target.value } })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Loại hình chính trị</label>
                  <select value={draft.kingdom.polityType} onChange={(e) => setDraft({ ...draft, kingdom: { ...draft.kingdom, polityType: e.target.value as KingdomPolityType } })} className={inputCls}>
                    <option value="kingdom">Vương quốc</option>
                    <option value="empire">Đế chế</option>
                    <option value="federation">Liên bang</option>
                    <option value="republic">Cộng hòa</option>
                    <option value="city_state">Thành bang</option>
                    <option value="principality">Công quốc</option>
                    <option value="special_zone">Đặc khu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Trạng thái Xuất bản</label>
                  <select value={draft.kingdom.workflowStatus} onChange={(e) => setDraft({ ...draft, kingdom: { ...draft.kingdom, workflowStatus: e.target.value as KingdomWorkflowStatus } })} className={inputCls}>
                    <option value="published">Published (Công khai)</option>
                    <option value="draft">Draft (Bản nháp)</option>
                    <option value="under_review">Under Review (Đang duyệt)</option>
                    <option value="archived">Archived (Lưu trữ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Tiền tệ chính thức</label>
                  <select
                    value={draft.kingdom.currencyCode}
                    onChange={(e) => {
                      const cur = WORLD_CURRENCIES.find((c) => c.code === e.target.value);
                      setDraft({
                        ...draft,
                        kingdom: { ...draft.kingdom, currencyCode: e.target.value, currencyName: cur?.name || e.target.value }
                      });
                    }}
                    className={inputCls}
                  >
                    {WORLD_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Danh ngôn / Lời đề từ quốc gia</label>
                <input value={draft.kingdom.motto} onChange={(e) => setDraft({ ...draft, kingdom: { ...draft.kingdom, motto: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Tóm tắt quốc gia</label>
                <textarea rows={3} value={draft.kingdom.summary} onChange={(e) => setDraft({ ...draft, kingdom: { ...draft.kingdom, summary: e.target.value } })} className={inputCls} />
              </div>

              {/* Direct Image Uploads for Flag, Coat of Arms, Capital, Cover & Gallery */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 p-3 space-y-3">
                <div className="text-xs font-bold text-[var(--accent)]">✦ Biểu tượng &amp; Hình ảnh Quốc gia (Upload trực tiếp / Kéo thả / Ctrl+V)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <DirectImageUploadField
                    workspaceId={draft.kingdom.workspaceId}
                    label="Quốc kỳ (Flag 3:2)"
                    value={draft.symbols.flagUrl || ""}
                    onChange={(url) => setDraft({ ...draft, symbols: { ...draft.symbols, flagUrl: url } })}
                    preset="flag"
                    tags="kingdom,flag"
                    compact
                  />
                  <DirectImageUploadField
                    workspaceId={draft.kingdom.workspaceId}
                    label="Quốc huy (Coat of Arms 1:1)"
                    value={draft.symbols.coatOfArmsUrl || ""}
                    onChange={(url) => setDraft({ ...draft, symbols: { ...draft.symbols, coatOfArmsUrl: url } })}
                    preset="avatar"
                    tags="kingdom,emblem"
                    compact
                  />
                  <DirectImageUploadField
                    workspaceId={draft.kingdom.workspaceId}
                    label="Ảnh Thủ đô (16:9)"
                    value={draft.symbols.capitalImageUrl || ""}
                    onChange={(url) => setDraft({ ...draft, symbols: { ...draft.symbols, capitalImageUrl: url } })}
                    preset="cover"
                    tags="kingdom,capital"
                    compact
                  />
                  <DirectImageUploadField
                    workspaceId={draft.kingdom.workspaceId}
                    label="Ảnh Bìa Quốc gia (16:9)"
                    value={draft.symbols.coverImageUrl || ""}
                    onChange={(url) => setDraft({ ...draft, symbols: { ...draft.symbols, coverImageUrl: url } })}
                    preset="cover"
                    tags="kingdom,cover"
                    compact
                  />
                </div>
                <MultiImageGalleryUploader
                  workspaceId={draft.kingdom.workspaceId}
                  label="Thư viện Ảnh Vương quốc (Upload nhiều ảnh)"
                  tags="kingdom,gallery"
                  items={draft.images.map((im) => ({
                    id: im.id,
                    url: im.url,
                    caption: im.caption,
                    source: im.sourceCredit
                  }))}
                  onChange={(next) =>
                    setDraft({
                      ...draft,
                      images: next.map((g, idx) => ({
                        id: g.id,
                        kingdomId: draft.kingdom.id,
                        category: "architecture",
                        url: g.url,
                        thumbUrl: g.url,
                        caption: g.caption,
                        sourceCredit: g.source || "",
                        sortOrder: idx + 1
                      }))
                    })
                  }
                />
              </div>
            </div>
          )}

          {tab === "geo_gov" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Thủ đô</label>
                <input value={draft.territory.capitalName} onChange={(e) => setDraft({ ...draft, territory: { ...draft.territory, capitalName: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Diện tích (km²)</label>
                <input type="number" value={draft.territory.areaKm2} onChange={(e) => setDraft({ ...draft, territory: { ...draft.territory, areaKm2: Number(e.target.value) || 0 } })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Hiến pháp</label>
                <input value={draft.government.constitution} onChange={(e) => setDraft({ ...draft, government: { ...draft.government, constitution: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Thể chế quản trị</label>
                <input value={draft.government.politicalSystem} onChange={(e) => setDraft({ ...draft, government: { ...draft.government, politicalSystem: e.target.value }, kingdom: { ...draft.kingdom, governmentType: e.target.value } })} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Cơ chế kế vị / bầu cử</label>
                <input value={draft.government.successionMechanism} onChange={(e) => setDraft({ ...draft, government: { ...draft.government, successionMechanism: e.target.value } })} className={inputCls} />
              </div>
            </div>
          )}

          {tab === "royalty_econ" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--accent)]">Hoàng gia &amp; Nguyên thủ (Gắn Character ID — VD: CHAR-000001)</span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      rulers: [
                        ...draft.rulers,
                        {
                          id: `rul-${Date.now()}`,
                          kingdomId: draft.kingdom.id,
                          characterId: "",
                          fallbackName: "",
                          roleTitle: "Nguyên thủ / Quan chức",
                          dynasty: "",
                          reignStart: "",
                          reignEnd: "Hiện tại",
                          predecessorName: "",
                          successorName: "",
                          isCurrent: true,
                          note: ""
                        }
                      ]
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm nguyên thủ
                </button>
              </div>
              {draft.rulers.map((r, idx) => (
                <div key={r.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input placeholder="Character ID (CHAR-000001)" value={r.characterId || ""} onChange={(e) => setDraft({ ...draft, rulers: draft.rulers.map((x, i) => (i === idx ? { ...x, characterId: e.target.value || null } : x)) })} className={`${inputCls} font-mono`} />
                  <input placeholder="Tên hiển thị (nếu chưa có CHAR-ID)" value={r.fallbackName} onChange={(e) => setDraft({ ...draft, rulers: draft.rulers.map((x, i) => (i === idx ? { ...x, fallbackName: e.target.value } : x)) })} className={inputCls} />
                  <input placeholder="Chức vị (Quốc vương, Tể tướng...)" value={r.roleTitle} onChange={(e) => setDraft({ ...draft, rulers: draft.rulers.map((x, i) => (i === idx ? { ...x, roleTitle: e.target.value } : x)) })} className={inputCls} />
                  <button type="button" onClick={() => setDraft({ ...draft, rulers: draft.rulers.filter((_, i) => i !== idx) })} className="text-rose-400 justify-self-end p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}

          {tab === "mil_tech_cul" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Học thuyết Quốc phòng</label>
                <input value={draft.military.defenseDoctrine} onChange={(e) => setDraft({ ...draft, military: { ...draft.military, defenseDoctrine: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Hệ thống Ma pháp / Siêu nhiên</label>
                <input value={draft.technology.magicSystem} onChange={(e) => setDraft({ ...draft, technology: { ...draft.technology, magicSystem: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Bản sắc Văn hóa</label>
                <input value={draft.culture.culturalIdentity} onChange={(e) => setDraft({ ...draft, culture: { ...draft.culture, culturalIdentity: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Điểm phát triển Hạ tầng (0-100)</label>
                <input type="number" min={0} max={100} value={draft.infrastructure.developmentScore} onChange={(e) => setDraft({ ...draft, infrastructure: { ...draft.infrastructure, developmentScore: Number(e.target.value) || 0 } })} className={inputCls} />
              </div>
            </div>
          )}

          {tab === "stats_events" && (
            <div className="space-y-3">
              <div className="font-semibold text-[var(--accent)]">Điều chỉnh 14 Chỉ số Quốc gia Độc lập (0–100)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {draft.statistics.map((st, idx) => (
                  <div key={st.key} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-2.5 flex items-center justify-between gap-2">
                    <span className="truncate">{st.label}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={st.score}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          statistics: draft.statistics.map((x, i) => (i === idx ? { ...x, score: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } : x))
                        })
                      }
                      className="w-16 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-right"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "custom" && (
            <div className="space-y-4">
              {customFieldDefs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customFieldDefs.map((def) => (
                    <div key={def.id}>
                      <label className="block text-[11px] text-[var(--text-muted)] mb-1">[{def.groupName}] {def.label}</label>
                      <input value={String(customValues[def.id] ?? "")} onChange={(e) => setCustomValues({ ...customValues, [def.id]: e.target.value })} className={inputCls} />
                    </div>
                  ))}
                </div>
              )}
              <FreeformTabBlocksEditor
                workspaceId={draft.kingdom.workspaceId}
                tabId="sources"
                tabTitle="Trường & Khối Tùy chỉnh Quốc gia"
                layout={draft.kingdom.profileLayout || {}}
                onChangeLayout={(next) =>
                  setDraft({ ...draft, kingdom: { ...draft.kingdom, profileLayout: next } })
                }
              />
            </div>
          )}

          {!K_EDIT_TABS.some((t) => t.id === tab) && (
            <FreeformTabBlocksEditor
              workspaceId={draft.kingdom.workspaceId}
              tabId={tab}
              tabTitle={
                (draft.kingdom.profileLayout?.customTabs || []).find((ct) => ct.id === tab)?.label ||
                "Tab Tùy chỉnh Quốc gia"
              }
              layout={draft.kingdom.profileLayout || {}}
              onChangeLayout={(next) =>
                setDraft({ ...draft, kingdom: { ...draft.kingdom, profileLayout: next } })
              }
            />
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-wrap items-center justify-between gap-2">
          <input
            type="text"
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            placeholder="Ghi chú thay đổi phiên bản..."
            className="flex-1 min-w-[200px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5 text-xs"
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] text-xs cursor-pointer">Hủy</button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Đang lưu..." : "Lưu & Tạo Phiên bản"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
