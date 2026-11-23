"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import type {
  BiographySectionKey,
  CharacterAbilityProfile,
  CharacterAchievementRecord,
  CharacterAppearanceStage,
  CharacterAssetRecord,
  CharacterBiographyChapter,
  CharacterCustomFieldDef,
  CharacterEventRecord,
  CharacterHydratedDossier,
  CharacterImageRecord,
  CharacterItemDef,
  CharacterListProjection,
  CharacterPersonalityStage,
  CharacterQuoteRecord,
  CharacterRarity,
  CharacterRecord,
  CharacterRelationType,
  CharacterRoleType,
  CharacterSkillDef,
  CharacterSourceRecord,
  ContentAccessLevel,
  ItemCategory,
  OrganizationCategory,
  SkillCategory,
  VerificationStatus
} from "@/types/character-codex";
import { RELATION_LABELS_VI } from "@/lib/character-id";
import { WORLD_CURRENCIES } from "@/lib/economy-engine";
import { DirectImageUploadField } from "../DirectImageUploadField";
import { MultiImageGalleryUploader } from "../MultiImageGalleryUploader";
import { DraggableScrollArea } from "../DraggableScrollArea";

interface CharacterEditorModalProps {
  workspaceId: string;
  initialDossier?: CharacterHydratedDossier | null;
  allCharacters: CharacterListProjection[];
  customFieldDefs: CharacterCustomFieldDef[];
  onClose: () => void;
  onSaved: (dossier: CharacterHydratedDossier) => void;
}

type EditorTab =
  | "identity"
  | "appearance"
  | "personality"
  | "biography"
  | "abilities"
  | "skills"
  | "combat_equip"
  | "relations_org"
  | "events_ach"
  | "finance_quotes"
  | "gallery_sources"
  | "custom";

const EDITOR_TABS: Array<{ id: EditorTab; label: string }> = [
  { id: "identity", label: "1. Nhận diện" },
  { id: "appearance", label: "2. Ngoại hình" },
  { id: "personality", label: "3. Tính cách" },
  { id: "biography", label: "4. Tiểu sử" },
  { id: "abilities", label: "5. Năng lực & Chỉ số" },
  { id: "skills", label: "5C. Kỹ năng" },
  { id: "combat_equip", label: "6-7. Chiến đấu & Trang bị" },
  { id: "relations_org", label: "8-9. Quan hệ & Tổ chức" },
  { id: "events_ach", label: "11-12. Sự kiện & Thành tựu" },
  { id: "finance_quotes", label: "10,13-15. Địa vị, Tài sản & Bên lề" },
  { id: "gallery_sources", label: "16-17. Ảnh & Nguồn" },
  { id: "custom", label: "Trường tùy biến" }
];

const BIO_SECTION_LABELS: Record<BiographySectionKey, string> = {
  origin: "Nguồn gốc",
  family: "Gia đình",
  childhood: "Thời thơ ấu",
  adolescence: "Tuổi thiếu niên",
  adulthood: "Quá trình trưởng thành",
  education: "Giáo dục",
  training: "Quá trình đào tạo",
  major_incidents: "Biến cố quan trọng",
  life_changing_events: "Sự kiện thay đổi cuộc đời",
  growth_journey: "Hành trình phát triển",
  failures: "Những thất bại",
  successes: "Những thành công",
  secret_past: "Quá khứ bí mật",
  current_bio: "Tiểu sử hiện tại",
  future_direction: "Hướng phát triển tương lai"
};

const STAT_FIELDS: Array<{ key: keyof CharacterAbilityProfile["stats"]; label: string }> = [
  { key: "hp", label: "HP (Sinh lực)" },
  { key: "mp", label: "MP (Năng lượng)" },
  { key: "stamina", label: "Thể lực" },
  { key: "strength", label: "Sức mạnh" },
  { key: "speed", label: "Tốc độ" },
  { key: "endurance", label: "Sức bền" },
  { key: "defense", label: "Phòng thủ" },
  { key: "reflex", label: "Phản xạ" },
  { key: "intelligence", label: "Trí tuệ" },
  { key: "perception", label: "Nhận thức" },
  { key: "willpower", label: "Ý chí" },
  { key: "energyControl", label: "Kiểm soát NL" },
  { key: "adaptability", label: "Thích nghi" }
];

function splitComma(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

export function CharacterEditorModal({
  workspaceId,
  initialDossier,
  allCharacters,
  customFieldDefs,
  onClose,
  onSaved
}: CharacterEditorModalProps) {
  const isEdit = Boolean(initialDossier?.character.id);
  const draftKey = `char-codex-draft-${workspaceId}-${initialDossier?.character.id || "new"}`;

  const [tab, setTab] = useState<EditorTab>("identity");
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);

  // Group 1 + 6 + 10 + 15 core character state
  const [charData, setCharData] = useState<Partial<CharacterRecord>>(() =>
    initialDossier?.character
      ? structuredClone(initialDossier.character)
      : {
          fullName: "",
          birthName: "",
          trueName: "",
          aliases: [],
          nicknames: [],
          titles: [],
          ancientTitles: [],
          historicalTitles: [],
          age: "",
          birthYear: null,
          deathYear: null,
          gender: "",
          race: "Nhân tộc",
          nationality: "",
          hometown: "",
          birthPlace: "",
          residence: "",
          originWorld: "Aethelgard Prime",
          currentWorld: "Aethelgard Prime",
          occupation: "",
          position: "",
          rank: "",
          role: "supporting",
          rarity: "common",
          lifeStatus: "alive",
          activityStatus: "active",
          classification: "",
          tags: [],
          symbol: "✦",
          accentColor: "#D4AF37",
          portraitUrl: "",
          coverUrl: "",
          summary: "",
          pinnedToGrandHall: false,
          accessLevel: "public",
          spoilerLabel: "",
          verificationStatus: "draft",
          combat: {
            combatStyle: "",
            schoolOrDiscipline: "",
            martialArts: [],
            combatExperience: "",
            commandRating: 50,
            tacticsRating: 50,
            defenseRating: 50,
            offenseRating: 50,
            masteredWeapons: [],
            notableOpponents: [],
            importantBattles: [],
            victoriesCount: 0,
            defeatsCount: 0,
            militaryAchievements: ""
          },
          socialStanding: {
            reputation: "",
            prestigeScore: 50,
            politicalInfluence: 30,
            economicInfluence: 30,
            militaryInfluence: 30,
            culturalInfluence: 30,
            powerAuthority: "",
            legalAuthority: "",
            fameLevel: "",
            dangerLevel: "",
            nationEvaluations: [],
            organizationEvaluations: [],
            historicalTitles: []
          },
          trivia: {
            hobbies: [],
            favoriteFood: "",
            favoriteColor: "",
            musicTaste: "",
            habits: [],
            favoriteItems: [],
            littleKnownFacts: [],
            personalSecrets: [],
            funDetails: []
          }
        }
  );

  // Sub-collections
  const [appearances, setAppearances] = useState<CharacterAppearanceStage[]>(
    () => (initialDossier?.appearances ? structuredClone(initialDossier.appearances) : [])
  );
  const [personalities, setPersonalities] = useState<CharacterPersonalityStage[]>(
    () => (initialDossier?.personalities ? structuredClone(initialDossier.personalities) : [])
  );
  const [biographies, setBiographies] = useState<CharacterBiographyChapter[]>(
    () => (initialDossier?.biographies ? structuredClone(initialDossier.biographies) : [])
  );
  const [ability, setAbility] = useState<CharacterAbilityProfile>(() =>
    initialDossier?.ability
      ? structuredClone(initialDossier.ability)
      : {
          characterId: initialDossier?.character.id || "",
          stats: {
            hp: 100,
            mp: 100,
            stamina: 100,
            strength: 10,
            speed: 10,
            endurance: 10,
            defense: 10,
            reflex: 10,
            intelligence: 10,
            perception: 10,
            willpower: 10,
            energyControl: 10,
            adaptability: 10
          },
          worldStatOverrides: [],
          level: 1,
          realm: "",
          powerTier: "",
          energySystem: "",
          elements: [],
          attributes: [],
          bloodline: "",
          innateAbilities: [],
          awakenedAbilities: [],
          specialCapabilities: [],
          resistances: [],
          immunities: [],
          weaknesses: [],
          powerLimits: "",
          unbrokenLimits: "",
          progressionHistory: [],
          accessLevel: "public",
          verificationStatus: "draft"
        }
  );

  const [skills, setSkills] = useState<
    Array<{
      skill: Partial<CharacterSkillDef>;
      relation: { skillLevel: number; masteryLevel: string; mentorName: string; ownershipStatus: "owned" | "sealed" | "lost" | "temporary" | "evolving"; acquiredAtLabel: string; accessLevel: ContentAccessLevel };
    }>
  >(() =>
    (initialDossier?.skills || []).map((s) => ({
      skill: structuredClone(s.skill),
      relation: {
        skillLevel: s.relation.skillLevel,
        masteryLevel: s.relation.masteryLevel,
        mentorName: s.relation.mentorName,
        ownershipStatus: s.relation.ownershipStatus,
        acquiredAtLabel: s.relation.acquiredAtLabel,
        accessLevel: s.relation.accessLevel
      }
    }))
  );

  const [equipment, setEquipment] = useState<
    Array<{ item: Partial<CharacterItemDef>; relation: { slotLabel: string; isEquipped: boolean; acquiredAtLabel: string; note: string; accessLevel: ContentAccessLevel } }>
  >(() =>
    (initialDossier?.equipment || []).map((e) => ({
      item: structuredClone(e.item),
      relation: {
        slotLabel: e.relation.slotLabel,
        isEquipped: e.relation.isEquipped,
        acquiredAtLabel: e.relation.acquiredAtLabel,
        note: e.relation.note,
        accessLevel: e.relation.accessLevel
      }
    }))
  );

  const [relationships, setRelationships] = useState<
    Array<{
      id?: string;
      characterBId: string;
      relationType: CharacterRelationType;
      description: string;
      startDate: string;
      status: "active" | "estranged" | "ended" | "secret" | "complicated";
      closeness: number;
      isBidirectional: boolean;
      accessLevel: ContentAccessLevel;
    }>
  >(() =>
    (initialDossier?.relationships || [])
      .filter((r) => r.direction === "outgoing")
      .map((r) => ({
        id: r.relation.id,
        characterBId: r.otherCharacter.id,
        relationType: r.relation.relationType,
        description: r.relation.description,
        startDate: r.relation.startDate,
        status: r.relation.status,
        closeness: r.relation.closeness,
        isBidirectional: r.relation.isBidirectional,
        accessLevel: r.relation.accessLevel
      }))
  );

  const [affiliations, setAffiliations] = useState<
    Array<{
      organization: { id?: string; name: string; category: OrganizationCategory; sigil: string; color: string };
      affiliation: { position: string; rank: string; joinDate: string; leaveDate: string; roleDescription: string; memberStatus: "active" | "former" | "founder" | "expelled" | "secret_member" | "deceased_member"; accessLevel: ContentAccessLevel };
    }>
  >(() =>
    (initialDossier?.affiliations || []).map((a) => ({
      organization: {
        id: a.organization.id,
        name: a.organization.name,
        category: a.organization.category,
        sigil: a.organization.sigil,
        color: a.organization.color
      },
      affiliation: {
        position: a.affiliation.position,
        rank: a.affiliation.rank,
        joinDate: a.affiliation.joinDate,
        leaveDate: a.affiliation.leaveDate,
        roleDescription: a.affiliation.roleDescription,
        memberStatus: a.affiliation.memberStatus,
        accessLevel: a.affiliation.accessLevel
      }
    }))
  );

  const [events, setEvents] = useState<Array<{ event: Partial<CharacterEventRecord>; characterRole: string }>>(() =>
    (initialDossier?.events || []).map((e) => ({
      event: structuredClone(e.event),
      characterRole: e.participation.characterRole
    }))
  );
  const [achievements, setAchievements] = useState<Partial<CharacterAchievementRecord>[]>(() =>
    initialDossier?.achievements ? structuredClone(initialDossier.achievements) : []
  );
  const [assets, setAssets] = useState<Partial<CharacterAssetRecord>[]>(() =>
    initialDossier?.assets ? structuredClone(initialDossier.assets) : []
  );
  const [quotes, setQuotes] = useState<Partial<CharacterQuoteRecord>[]>(() =>
    initialDossier?.quotes ? structuredClone(initialDossier.quotes) : []
  );
  const [images, setImages] = useState<Partial<CharacterImageRecord>[]>(() =>
    initialDossier?.images ? structuredClone(initialDossier.images) : []
  );
  const [sources, setSources] = useState<Partial<CharacterSourceRecord>[]>(() =>
    initialDossier?.sources ? structuredClone(initialDossier.sources) : []
  );
  const [customValues, setCustomValues] = useState<Record<string, unknown>>(() => {
    const map: Record<string, unknown> = {};
    for (const cf of initialDossier?.customFields || []) {
      map[cf.definition.id] = cf.value;
    }
    return map;
  });

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!isEdit) {
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.charData?.fullName) {
            setCharData((prev) => ({ ...prev, ...parsed.charData }));
            setDraftRestored(true);
          }
        }
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ charData, savedAt: new Date().toISOString() }));
      } catch {
        // ignore
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [charData, draftKey]);

  const handleSubmit = async () => {
    if (!charData.fullName?.trim()) {
      setError("Vui lòng nhập Họ và tên nhân vật (Bắt buộc).");
      setTab("identity");
      return;
    }
    if (
      typeof charData.birthYear === "number" &&
      typeof charData.deathYear === "number" &&
      charData.deathYear < charData.birthYear
    ) {
      setError("Năm mất không được nhỏ hơn năm sinh!");
      setTab("identity");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const url = isEdit
        ? `/api/characters/${encodeURIComponent(initialDossier!.character.id)}`
        : "/api/characters";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          character: charData,
          appearances,
          personalities,
          biographies,
          ability,
          skills,
          equipment,
          relationships,
          affiliations,
          events,
          achievements,
          assets,
          quotes,
          images,
          sources,
          customFieldValues: customValues,
          changeNote: changeNote.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể lưu hồ sơ nhân vật.");
        return;
      }
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      onSaved(data.dossier);
    } catch {
      setError("Lỗi kết nối máy chủ khi lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-6xl h-[96vh] sm:h-auto sm:max-h-[94vh] rounded-t-2xl sm:rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-surface)]">
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-[var(--accent)] flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>
                {isEdit
                  ? `Chỉnh sửa Hồ sơ: ${initialDossier!.character.id} — ${initialDossier!.character.fullName}`
                  : "Tạo Hồ sơ Nhân vật Mới (17 Nhóm Dữ liệu Chuẩn)"}
              </span>
            </h2>
            {draftRestored && (
              <span className="text-[11px] text-emerald-300">✓ Đã khôi phục bản nháp tự động lưu</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer ${
                previewMode
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{previewMode ? "Quay lại Sửa" : "Xem trước"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Group Tab Ribbon (Drag with Mouse / Swipe / Scrollbar) */}
        {!previewMode && (
          <div className="px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/60">
            <DraggableScrollArea ariaLabel="Nhóm dữ liệu nhân vật" innerClassName="flex gap-1.5">
              {EDITOR_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    tab === t.id
                      ? "bg-[var(--accent)] text-[#090e1c] font-bold"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--accent)] border border-[var(--border-subtle)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </DraggableScrollArea>
          </div>
        )}

        {/* Validation Error */}
        {error && (
          <div className="mx-4 mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {previewMode ? (
            <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)]/60 p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <span
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
                  style={{ borderColor: charData.accentColor, color: charData.accentColor }}
                >
                  {charData.symbol || "✦"}
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                    {charData.fullName || "(Chưa nhập tên)"}
                  </h3>
                  <div className="text-[var(--text-muted)]">
                    {charData.titles?.join(" · ")} · {charData.race} · {charData.nationality || "Chưa rõ quốc gia"}
                  </div>
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{charData.summary}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg bg-[var(--bg-surface)] p-2.5">
                  <div className="text-[10px] text-[var(--text-muted)]">Cấp độ / Cảnh giới</div>
                  <div className="font-bold text-amber-300">Lv.{ability.level} · {ability.realm || "—"}</div>
                </div>
                <div className="rounded-lg bg-[var(--bg-surface)] p-2.5">
                  <div className="text-[10px] text-[var(--text-muted)]">Giai đoạn Ngoại hình</div>
                  <div className="font-bold">{appearances.length} giai đoạn</div>
                </div>
                <div className="rounded-lg bg-[var(--bg-surface)] p-2.5">
                  <div className="text-[10px] text-[var(--text-muted)]">Kỹ năng / Trang bị</div>
                  <div className="font-bold">{skills.length} KN · {equipment.length} TB</div>
                </div>
                <div className="rounded-lg bg-[var(--bg-surface)] p-2.5">
                  <div className="text-[10px] text-[var(--text-muted)]">Quan hệ / Sự kiện</div>
                  <div className="font-bold">{relationships.length} QH · {events.length} SK</div>
                </div>
              </div>
            </div>
          ) : tab === "identity" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 p-3">
                <DirectImageUploadField
                  workspaceId={workspaceId}
                  label="Ảnh Chân dung Nhân vật (Upload trực tiếp / Kéo thả / Ctrl+V)"
                  value={charData.portraitUrl || ""}
                  onChange={(url) => setCharData({ ...charData, portraitUrl: url })}
                  preset="portrait"
                  tags="character,portrait"
                />
                <DirectImageUploadField
                  workspaceId={workspaceId}
                  label="Ảnh Bìa Nhân vật (16:9 Banner)"
                  value={charData.coverUrl || ""}
                  onChange={(url) => setCharData({ ...charData, coverUrl: url })}
                  preset="cover"
                  tags="character,cover"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[var(--accent)] font-semibold mb-1">Họ và tên *</label>
                  <input value={charData.fullName || ""} onChange={(e) => setCharData({ ...charData, fullName: e.target.value })} className={inputCls} placeholder="VD: Aurelius Vaelor" />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Tên khai sinh</label>
                  <input value={charData.birthName || ""} onChange={(e) => setCharData({ ...charData, birthName: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Tên thật</label>
                  <input value={charData.trueName || ""} onChange={(e) => setCharData({ ...charData, trueName: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Bí danh (phân cách dấu phẩy)</label>
                  <input value={(charData.aliases || []).join(", ")} onChange={(e) => setCharData({ ...charData, aliases: splitComma(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Biệt danh</label>
                  <input value={(charData.nicknames || []).join(", ")} onChange={(e) => setCharData({ ...charData, nicknames: splitComma(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Danh hiệu</label>
                  <input value={(charData.titles || []).join(", ")} onChange={(e) => setCharData({ ...charData, titles: splitComma(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Tuổi</label>
                  <input value={charData.age || ""} onChange={(e) => setCharData({ ...charData, age: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Năm sinh / Năm mất</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input type="number" placeholder="Năm sinh" value={charData.birthYear ?? ""} onChange={(e) => setCharData({ ...charData, birthYear: e.target.value ? Number(e.target.value) : null })} className={inputCls} />
                    <input type="number" placeholder="Năm mất" value={charData.deathYear ?? ""} onChange={(e) => setCharData({ ...charData, deathYear: e.target.value ? Number(e.target.value) : null })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Giới tính &amp; Chủng tộc</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input placeholder="Giới tính" value={charData.gender || ""} onChange={(e) => setCharData({ ...charData, gender: e.target.value })} className={inputCls} />
                    <input placeholder="Chủng tộc" value={charData.race || ""} onChange={(e) => setCharData({ ...charData, race: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Quốc tịch / Quốc gia</label>
                  <input value={charData.nationality || ""} onChange={(e) => setCharData({ ...charData, nationality: e.target.value })} className={inputCls} placeholder="VD: Vương quốc Valoria" />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Quê quán / Nơi cư trú</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input placeholder="Quê quán" value={charData.hometown || ""} onChange={(e) => setCharData({ ...charData, hometown: e.target.value })} className={inputCls} />
                    <input placeholder="Nơi cư trú" value={charData.residence || ""} onChange={(e) => setCharData({ ...charData, residence: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Nghề nghiệp / Chức vụ / Cấp bậc</label>
                  <div className="grid grid-cols-3 gap-1">
                    <input placeholder="Nghề" value={charData.occupation || ""} onChange={(e) => setCharData({ ...charData, occupation: e.target.value })} className={inputCls} />
                    <input placeholder="Chức vụ" value={charData.position || ""} onChange={(e) => setCharData({ ...charData, position: e.target.value })} className={inputCls} />
                    <input placeholder="Cấp bậc" value={charData.rank || ""} onChange={(e) => setCharData({ ...charData, rank: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Vai trò &amp; Độ hiếm</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select value={charData.role || "supporting"} onChange={(e) => setCharData({ ...charData, role: e.target.value as CharacterRoleType })} className={inputCls}>
                      <option value="protagonist">Nhân vật chính</option>
                      <option value="deuteragonist">Thứ chính</option>
                      <option value="antagonist">Phản diện</option>
                      <option value="mentor">Sư phụ / Cố vấn</option>
                      <option value="ruler">Quân chủ / Lãnh đạo</option>
                      <option value="historical">Nhân vật lịch sử</option>
                      <option value="legendary_entity">Thực thể huyền thoại</option>
                      <option value="supporting">Nhân vật phụ</option>
                    </select>
                    <select value={charData.rarity || "common"} onChange={(e) => setCharData({ ...charData, rarity: e.target.value as CharacterRarity })} className={inputCls}>
                      <option value="common">Thường</option>
                      <option value="uncommon">Khá hiếm</option>
                      <option value="rare">Hiếm</option>
                      <option value="epic">Sử thi</option>
                      <option value="legendary">Huyền thoại</option>
                      <option value="mythic">Thần thoại</option>
                      <option value="unique">Độc nhất</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Trạng thái sống &amp; Hoạt động</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select value={charData.lifeStatus || "alive"} onChange={(e) => setCharData({ ...charData, lifeStatus: e.target.value as CharacterRecord["lifeStatus"] })} className={inputCls}>
                      <option value="alive">Còn sống</option>
                      <option value="deceased">Đã mất</option>
                      <option value="missing">Mất tích</option>
                      <option value="immortal">Bất tử</option>
                      <option value="sealed">Bị phong ấn</option>
                      <option value="unknown">Không rõ</option>
                    </select>
                    <select value={charData.activityStatus || "active"} onChange={(e) => setCharData({ ...charData, activityStatus: e.target.value as CharacterRecord["activityStatus"] })} className={inputCls}>
                      <option value="active">Đang hoạt động</option>
                      <option value="retired">Ẩn cư</option>
                      <option value="dormant">Ngủ say</option>
                      <option value="exiled">Lưu vong</option>
                      <option value="imprisoned">Bị giam giữ</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Quyền hiển thị &amp; Xác thực</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select value={charData.accessLevel || "public"} onChange={(e) => setCharData({ ...charData, accessLevel: e.target.value as ContentAccessLevel })} className={inputCls}>
                      <option value="public">Công khai</option>
                      <option value="spoiler">Ẩn Spoiler</option>
                      <option value="unpublished">Chưa xuất bản</option>
                      <option value="private_draft">Bản nháp riêng tư</option>
                      <option value="authorized_only">Chỉ người có quyền</option>
                      <option value="admin_only">Chỉ Quản trị viên</option>
                    </select>
                    <select value={charData.verificationStatus || "draft"} onChange={(e) => setCharData({ ...charData, verificationStatus: e.target.value as VerificationStatus })} className={inputCls}>
                      <option value="official">Chính thức</option>
                      <option value="verified">Đã xác minh</option>
                      <option value="unverified">Chưa xác minh</option>
                      <option value="inferred">Suy luận</option>
                      <option value="creative">Sáng tạo</option>
                      <option value="updating">Đang cập nhật</option>
                      <option value="draft">Bản nháp</option>
                      <option value="outdated">Đã lỗi thời</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">URL Ảnh chân dung</label>
                  <input value={charData.portraitUrl || ""} onChange={(e) => setCharData({ ...charData, portraitUrl: e.target.value })} className={inputCls} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Biểu tượng &amp; Màu nhận diện</label>
                  <div className="flex items-center gap-2">
                    <input value={charData.symbol || "✦"} onChange={(e) => setCharData({ ...charData, symbol: e.target.value })} className="w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5 text-center text-sm" />
                    <input type="color" value={charData.accentColor || "#D4AF37"} onChange={(e) => setCharData({ ...charData, accentColor: e.target.value })} className="w-9 h-8 rounded cursor-pointer bg-transparent border-0" />
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="checkbox" checked={Boolean(charData.pinnedToGrandHall)} onChange={(e) => setCharData({ ...charData, pinnedToGrandHall: e.target.checked })} className="accent-amber-400" />
                      <span>Ghim Grand Hall</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Tags (phân cách dấu phẩy)</label>
                  <input value={(charData.tags || []).join(", ")} onChange={(e) => setCharData({ ...charData, tags: splitComma(e.target.value) })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Tóm tắt hồ sơ nhân vật</label>
                <textarea rows={3} value={charData.summary || ""} onChange={(e) => setCharData({ ...charData, summary: e.target.value })} className={inputCls} />
              </div>
            </div>
          ) : tab === "appearance" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--accent)]">Các Giai đoạn Ngoại hình ({appearances.length})</span>
                <button
                  type="button"
                  onClick={() =>
                    setAppearances((prev) => [
                      ...prev,
                      {
                        id: `app-${Date.now()}`,
                        characterId: charData.id || "",
                        stageName: `Giai đoạn #${prev.length + 1}`,
                        ageAtStage: "",
                        timePeriod: "",
                        description: "",
                        imageUrl: "",
                        height: "",
                        weight: "",
                        hairColor: "",
                        hairStyle: "",
                        eyeColor: "",
                        skinTone: "",
                        faceFeatures: "",
                        physique: "",
                        distinguishingMarks: "",
                        scars: "",
                        tattoos: "",
                        specialMarkings: "",
                        voice: "",
                        demeanor: "",
                        casualOutfit: "",
                        combatOutfit: "",
                        ceremonialOutfit: "",
                        specialOutfit: "",
                        accessories: "",
                        personalEmblem: "",
                        changesNoted: "",
                        isCurrent: prev.length === 0,
                        accessLevel: "public",
                        verificationStatus: "draft"
                      }
                    ])
                  }
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm giai đoạn ngoại hình
                </button>
              </div>
              {appearances.map((ap, idx) => (
                <div key={ap.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input value={ap.stageName} onChange={(e) => setAppearances((p) => p.map((x, i) => (i === idx ? { ...x, stageName: e.target.value } : x)))} className="font-semibold bg-transparent border-b border-[var(--border-subtle)] text-xs text-[var(--accent)] flex-1" placeholder="Tên giai đoạn" />
                    <button type="button" onClick={() => setAppearances((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input placeholder="Tuổi" value={ap.ageAtStage} onChange={(e) => setAppearances((p) => p.map((x, i) => (i === idx ? { ...x, ageAtStage: e.target.value } : x)))} className={inputCls} />
                    <input placeholder="Chiều cao" value={ap.height} onChange={(e) => setAppearances((p) => p.map((x, i) => (i === idx ? { ...x, height: e.target.value } : x)))} className={inputCls} />
                    <input placeholder="Cân nặng" value={ap.weight} onChange={(e) => setAppearances((p) => p.map((x, i) => (i === idx ? { ...x, weight: e.target.value } : x)))} className={inputCls} />
                    <input placeholder="Màu tóc / mắt" value={ap.hairColor} onChange={(e) => setAppearances((p) => p.map((x, i) => (i === idx ? { ...x, hairColor: e.target.value } : x)))} className={inputCls} />
                    <input placeholder="Trang phục thường ngày" value={ap.casualOutfit} onChange={(e) => setAppearances((p) => p.map((x, i) => (i === idx ? { ...x, casualOutfit: e.target.value } : x)))} className={inputCls} />
                    <input placeholder="Trang phục chiến đấu" value={ap.combatOutfit} onChange={(e) => setAppearances((p) => p.map((x, i) => (i === idx ? { ...x, combatOutfit: e.target.value } : x)))} className={inputCls} />
                    <input placeholder="Sẹo / Hình xăm" value={ap.scars} onChange={(e) => setAppearances((p) => p.map((x, i) => (i === idx ? { ...x, scars: e.target.value } : x)))} className={inputCls} />
                    <input placeholder="Phong thái / Giọng nói" value={ap.demeanor} onChange={(e) => setAppearances((p) => p.map((x, i) => (i === idx ? { ...x, demeanor: e.target.value } : x)))} className={inputCls} />
                  </div>
                  <textarea rows={2} placeholder="Mô tả tổng quan ngoại hình giai đoạn này..." value={ap.description} onChange={(e) => setAppearances((p) => p.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)))} className={inputCls} />
                </div>
              ))}
            </div>
          ) : tab === "personality" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--accent)]">Tính cách &amp; Phát triển Tâm lý ({personalities.length})</span>
                <button
                  type="button"
                  onClick={() =>
                    setPersonalities((prev) => [
                      ...prev,
                      {
                        id: `per-${Date.now()}`,
                        characterId: charData.id || "",
                        stageName: `Giai đoạn Tâm lý #${prev.length + 1}`,
                        periodLabel: "",
                        corePersonality: "",
                        strengths: [],
                        weaknesses: [],
                        likes: [],
                        dislikes: [],
                        fears: [],
                        motivations: "",
                        shortTermGoals: "",
                        longTermGoals: "",
                        beliefs: "",
                        lifePhilosophy: "",
                        personalPrinciples: "",
                        habits: "",
                        psychologyProfile: "",
                        dangerReaction: "",
                        pressureReaction: "",
                        communicationStyle: "",
                        emotionalControl: "",
                        internalConflict: "",
                        psychologicalGrowth: "",
                        isCurrent: prev.length === 0,
                        accessLevel: "public",
                        verificationStatus: "draft"
                      }
                    ])
                  }
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm giai đoạn tâm lý
                </button>
              </div>
              {personalities.map((per, idx) => (
                <div key={per.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input value={per.stageName} onChange={(e) => setPersonalities((p) => p.map((x, i) => (i === idx ? { ...x, stageName: e.target.value } : x)))} className="font-semibold bg-transparent border-b border-[var(--border-subtle)] text-xs text-[var(--accent)] flex-1" />
                    <button type="button" onClick={() => setPersonalities((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input placeholder="Tính cách cốt lõi" value={per.corePersonality} onChange={(e) => setPersonalities((p) => p.map((x, i) => (i === idx ? { ...x, corePersonality: e.target.value } : x)))} className={inputCls} />
                    <input placeholder="Động lực chính" value={per.motivations} onChange={(e) => setPersonalities((p) => p.map((x, i) => (i === idx ? { ...x, motivations: e.target.value } : x)))} className={inputCls} />
                    <input placeholder="Ưu điểm (phân cách phẩy)" value={per.strengths.join(", ")} onChange={(e) => setPersonalities((p) => p.map((x, i) => (i === idx ? { ...x, strengths: splitComma(e.target.value) } : x)))} className={inputCls} />
                    <input placeholder="Khuyết điểm (phân cách phẩy)" value={per.weaknesses.join(", ")} onChange={(e) => setPersonalities((p) => p.map((x, i) => (i === idx ? { ...x, weaknesses: splitComma(e.target.value) } : x)))} className={inputCls} />
                    <input placeholder="Triết lý sống" value={per.lifePhilosophy} onChange={(e) => setPersonalities((p) => p.map((x, i) => (i === idx ? { ...x, lifePhilosophy: e.target.value } : x)))} className={inputCls} />
                    <input placeholder="Mâu thuẫn nội tâm" value={per.internalConflict} onChange={(e) => setPersonalities((p) => p.map((x, i) => (i === idx ? { ...x, internalConflict: e.target.value } : x)))} className={inputCls} />
                  </div>
                </div>
              ))}
            </div>
          ) : tab === "biography" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--accent)]">Các Chương Tiểu sử (Hỗ trợ Spoiler cấp từng chương)</span>
                <button
                  type="button"
                  onClick={() =>
                    setBiographies((prev) => [
                      ...prev,
                      {
                        id: `bio-${Date.now()}`,
                        characterId: charData.id || "",
                        sectionKey: "origin",
                        chapterOrder: prev.length + 1,
                        stageLabel: `Chương ${prev.length + 1}`,
                        title: "Chương mới",
                        contentMarkdown: "",
                        accessLevel: "public",
                        verificationStatus: "draft"
                      }
                    ])
                  }
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm chương tiểu sử
                </button>
              </div>
              {biographies.map((bio, idx) => (
                <div key={bio.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <select value={bio.sectionKey} onChange={(e) => setBiographies((p) => p.map((x, i) => (i === idx ? { ...x, sectionKey: e.target.value as BiographySectionKey } : x)))} className={inputCls}>
                      {Object.entries(BIO_SECTION_LABELS).map(([k, l]) => (
                        <option key={k} value={k}>{l}</option>
                      ))}
                    </select>
                    <input placeholder="Tiêu đề chương" value={bio.title} onChange={(e) => setBiographies((p) => p.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))} className={inputCls} />
                    <select value={bio.accessLevel} onChange={(e) => setBiographies((p) => p.map((x, i) => (i === idx ? { ...x, accessLevel: e.target.value as ContentAccessLevel } : x)))} className={inputCls}>
                      <option value="public">Công khai</option>
                      <option value="spoiler">Ẩn Spoiler</option>
                      <option value="private_draft">Nháp riêng tư</option>
                      <option value="admin_only">Chỉ Admin</option>
                    </select>
                    <div className="flex items-center gap-1">
                      <select value={bio.verificationStatus} onChange={(e) => setBiographies((p) => p.map((x, i) => (i === idx ? { ...x, verificationStatus: e.target.value as VerificationStatus } : x)))} className={inputCls}>
                        <option value="official">Chính thức</option>
                        <option value="verified">Đã xác minh</option>
                        <option value="inferred">Suy luận</option>
                        <option value="draft">Bản nháp</option>
                      </select>
                      <button type="button" onClick={() => setBiographies((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <textarea rows={3} placeholder="Nội dung chương (hỗ trợ Markdown)..." value={bio.contentMarkdown} onChange={(e) => setBiographies((p) => p.map((x, i) => (i === idx ? { ...x, contentMarkdown: e.target.value } : x)))} className={inputCls} />
                </div>
              ))}
            </div>
          ) : tab === "abilities" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Cấp độ (Level)</label>
                  <input type="number" value={ability.level} onChange={(e) => setAbility({ ...ability, level: Number(e.target.value) || 1 })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Cảnh giới</label>
                  <input value={ability.realm} onChange={(e) => setAbility({ ...ability, realm: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Bậc sức mạnh</label>
                  <input value={ability.powerTier} onChange={(e) => setAbility({ ...ability, powerTier: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Hệ thống năng lượng</label>
                  <input value={ability.energySystem} onChange={(e) => setAbility({ ...ability, energySystem: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Nguyên tố (phẩy)</label>
                  <input value={ability.elements.join(", ")} onChange={(e) => setAbility({ ...ability, elements: splitComma(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Huyết thống</label>
                  <input value={ability.bloodline} onChange={(e) => setAbility({ ...ability, bloodline: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3">
                <div className="text-xs font-semibold text-[var(--accent)] mb-2">13 Chỉ số Cơ bản (Chỉnh sửa trực tiếp — chỉ lưu khi bạn xác nhận)</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                  {STAT_FIELDS.map((sf) => (
                    <div key={sf.key}>
                      <label className="block text-[10px] text-[var(--text-muted)] mb-0.5">{sf.label}</label>
                      <input
                        type="number"
                        value={ability.stats[sf.key]}
                        onChange={(e) =>
                          setAbility({
                            ...ability,
                            stats: { ...ability.stats, [sf.key]: Number(e.target.value) || 0 }
                          })
                        }
                        className={`${inputCls} font-mono`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Điểm yếu (phẩy)</label>
                  <input value={ability.weaknesses.join(", ")} onChange={(e) => setAbility({ ...ability, weaknesses: splitComma(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Giới hạn sức mạnh</label>
                  <input value={ability.powerLimits} onChange={(e) => setAbility({ ...ability, powerLimits: e.target.value })} className={inputCls} />
                </div>
              </div>
            </div>
          ) : tab === "skills" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--accent)]">Danh sách Kỹ năng ({skills.length})</span>
                <button
                  type="button"
                  onClick={() =>
                    setSkills((prev) => [
                      ...prev,
                      {
                        skill: { name: "", category: "active", description: "", cooldown: "", energyCost: "", effectRange: "", verificationStatus: "draft" },
                        relation: { skillLevel: 1, masteryLevel: "Sơ cấp", mentorName: "", ownershipStatus: "owned", acquiredAtLabel: "", accessLevel: "public" }
                      }
                    ])
                  }
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm kỹ năng
                </button>
              </div>
              {skills.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input placeholder="Tên kỹ năng *" value={item.skill.name || ""} onChange={(e) => setSkills((p) => p.map((x, i) => (i === idx ? { ...x, skill: { ...x.skill, name: e.target.value } } : x)))} className={inputCls} />
                    <select value={item.skill.category || "active"} onChange={(e) => setSkills((p) => p.map((x, i) => (i === idx ? { ...x, skill: { ...x.skill, category: e.target.value as SkillCategory } } : x)))} className={inputCls}>
                      <option value="active">Chủ động</option>
                      <option value="passive">Bị động</option>
                      <option value="support">Hỗ trợ</option>
                      <option value="defense">Phòng thủ</option>
                      <option value="attack">Tấn công</option>
                      <option value="movement">Di chuyển</option>
                      <option value="healing">Hồi phục</option>
                      <option value="magic">Ma pháp</option>
                      <option value="ultimate">Tuyệt kỹ</option>
                      <option value="forbidden">Cấm thuật</option>
                      <option value="special">Năng lực đặc biệt</option>
                    </select>
                    <input placeholder="Hồi chiêu / Chi phí NL" value={item.skill.cooldown || ""} onChange={(e) => setSkills((p) => p.map((x, i) => (i === idx ? { ...x, skill: { ...x.skill, cooldown: e.target.value } } : x)))} className={inputCls} />
                    <div className="flex items-center gap-1">
                      <input type="number" placeholder="Lv" value={item.relation.skillLevel} onChange={(e) => setSkills((p) => p.map((x, i) => (i === idx ? { ...x, relation: { ...x.relation, skillLevel: Number(e.target.value) || 1 } } : x)))} className={inputCls} />
                      <button type="button" onClick={() => setSkills((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <textarea rows={2} placeholder="Mô tả & cơ chế hoạt động kỹ năng..." value={item.skill.description || ""} onChange={(e) => setSkills((p) => p.map((x, i) => (i === idx ? { ...x, skill: { ...x.skill, description: e.target.value } } : x)))} className={inputCls} />
                </div>
              ))}
            </div>
          ) : tab === "combat_equip" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Phong cách chiến đấu" value={charData.combat?.combatStyle || ""} onChange={(e) => setCharData({ ...charData, combat: { ...charData.combat!, combatStyle: e.target.value } })} className={inputCls} />
                <input placeholder="Trường phái / Võ thuật" value={charData.combat?.schoolOrDiscipline || ""} onChange={(e) => setCharData({ ...charData, combat: { ...charData.combat!, schoolOrDiscipline: e.target.value } })} className={inputCls} />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                <span className="text-xs font-semibold text-[var(--accent)]">Trang bị &amp; Vật phẩm ({equipment.length})</span>
                <button
                  type="button"
                  onClick={() =>
                    setEquipment((prev) => [
                      ...prev,
                      {
                        item: { name: "", category: "weapon", origin: "", levelOrTier: "", traits: "", currentStatus: "equipped" },
                        relation: { slotLabel: "Vũ khí", isEquipped: true, acquiredAtLabel: "", note: "", accessLevel: "public" }
                      }
                    ])
                  }
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm trang bị
                </button>
              </div>
              {equipment.map((eq, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input placeholder="Tên trang bị" value={eq.item.name || ""} onChange={(e) => setEquipment((p) => p.map((x, i) => (i === idx ? { ...x, item: { ...x.item, name: e.target.value } } : x)))} className={inputCls} />
                  <select value={eq.item.category || "weapon"} onChange={(e) => setEquipment((p) => p.map((x, i) => (i === idx ? { ...x, item: { ...x.item, category: e.target.value as ItemCategory } } : x)))} className={inputCls}>
                    <option value="weapon">Vũ khí</option>
                    <option value="armor">Giáp</option>
                    <option value="outfit">Trang phục</option>
                    <option value="accessory">Phụ kiện</option>
                    <option value="artifact">Cổ vật</option>
                    <option value="treasure">Bảo vật</option>
                    <option value="vehicle">Phương tiện</option>
                  </select>
                  <input placeholder="Cấp độ / Đặc tính" value={eq.item.traits || ""} onChange={(e) => setEquipment((p) => p.map((x, i) => (i === idx ? { ...x, item: { ...x.item, traits: e.target.value } } : x)))} className={inputCls} />
                  <div className="flex items-center gap-1">
                    <input placeholder="Vị trí (Slot)" value={eq.relation.slotLabel} onChange={(e) => setEquipment((p) => p.map((x, i) => (i === idx ? { ...x, relation: { ...x.relation, slotLabel: e.target.value } } : x)))} className={inputCls} />
                    <button type="button" onClick={() => setEquipment((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === "relations_org" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--accent)]">Quan hệ Nhân vật Hai chiều ({relationships.length})</span>
                <button
                  type="button"
                  onClick={() =>
                    setRelationships((prev) => [
                      ...prev,
                      {
                        characterBId: allCharacters.find((c) => c.id !== charData.id)?.id || "",
                        relationType: "ally",
                        description: "",
                        startDate: "",
                        status: "active",
                        closeness: 70,
                        isBidirectional: true,
                        accessLevel: "public"
                      }
                    ])
                  }
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm quan hệ
                </button>
              </div>
              {relationships.map((rel, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select value={rel.characterBId} onChange={(e) => setRelationships((p) => p.map((x, i) => (i === idx ? { ...x, characterBId: e.target.value } : x)))} className={inputCls}>
                    <option value="">-- Chọn nhân vật --</option>
                    {allCharacters.filter((c) => c.id !== charData.id).map((c) => (
                      <option key={c.id} value={c.id}>{c.id} — {c.fullName}</option>
                    ))}
                  </select>
                  <select value={rel.relationType} onChange={(e) => setRelationships((p) => p.map((x, i) => (i === idx ? { ...x, relationType: e.target.value as CharacterRelationType } : x)))} className={inputCls}>
                    {Object.entries(RELATION_LABELS_VI).map(([k, l]) => (
                      <option key={k} value={k}>{l}</option>
                    ))}
                  </select>
                  <input placeholder="Mô tả quan hệ" value={rel.description} onChange={(e) => setRelationships((p) => p.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)))} className={inputCls} />
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={100} value={rel.closeness} onChange={(e) => setRelationships((p) => p.map((x, i) => (i === idx ? { ...x, closeness: Number(e.target.value) } : x)))} className="w-16 rounded border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-xs font-mono" title="Độ thân thiết 0-100" />
                    <button type="button" onClick={() => setRelationships((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <span className="text-xs font-semibold text-[var(--accent)]">Gia tộc &amp; Tổ chức ({affiliations.length})</span>
                <button
                  type="button"
                  onClick={() =>
                    setAffiliations((prev) => [
                      ...prev,
                      {
                        organization: { name: "", category: "guild", sigil: "⛨", color: "#60A5FA" },
                        affiliation: { position: "", rank: "", joinDate: "", leaveDate: "", roleDescription: "", memberStatus: "active", accessLevel: "public" }
                      }
                    ])
                  }
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm tổ chức / gia tộc
                </button>
              </div>
              {affiliations.map((af, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input placeholder="Tên Gia tộc / Tổ chức" value={af.organization.name} onChange={(e) => setAffiliations((p) => p.map((x, i) => (i === idx ? { ...x, organization: { ...x.organization, name: e.target.value } } : x)))} className={inputCls} />
                  <input placeholder="Chức vụ" value={af.affiliation.position} onChange={(e) => setAffiliations((p) => p.map((x, i) => (i === idx ? { ...x, affiliation: { ...x.affiliation, position: e.target.value } } : x)))} className={inputCls} />
                  <input placeholder="Cấp bậc / Ngày gia nhập" value={af.affiliation.joinDate} onChange={(e) => setAffiliations((p) => p.map((x, i) => (i === idx ? { ...x, affiliation: { ...x.affiliation, joinDate: e.target.value } } : x)))} className={inputCls} />
                  <button type="button" onClick={() => setAffiliations((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 justify-self-end p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          ) : tab === "events_ach" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--accent)]">Sự kiện &amp; Timeline Nhân vật ({events.length})</span>
                <button
                  type="button"
                  onClick={() =>
                    setEvents((prev) => [
                      ...prev,
                      { event: { title: "", year: 780, era: "", location: "", content: "", outcome: "" }, characterRole: "Nhân vật chính" }
                    ])
                  }
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm sự kiện
                </button>
              </div>
              {events.map((ev, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input placeholder="Tên sự kiện" value={ev.event.title || ""} onChange={(e) => setEvents((p) => p.map((x, i) => (i === idx ? { ...x, event: { ...x.event, title: e.target.value } } : x)))} className={inputCls} />
                  <input type="number" placeholder="Năm" value={ev.event.year ?? 0} onChange={(e) => setEvents((p) => p.map((x, i) => (i === idx ? { ...x, event: { ...x.event, year: Number(e.target.value) } } : x)))} className={inputCls} />
                  <input placeholder="Địa điểm" value={ev.event.location || ""} onChange={(e) => setEvents((p) => p.map((x, i) => (i === idx ? { ...x, event: { ...x.event, location: e.target.value } } : x)))} className={inputCls} />
                  <div className="flex items-center gap-1">
                    <input placeholder="Vai trò" value={ev.characterRole} onChange={(e) => setEvents((p) => p.map((x, i) => (i === idx ? { ...x, characterRole: e.target.value } : x)))} className={inputCls} />
                    <button type="button" onClick={() => setEvents((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <span className="text-xs font-semibold text-[var(--accent)]">Thành tựu &amp; Chiến tích ({achievements.length})</span>
                <button
                  type="button"
                  onClick={() => setAchievements((p) => [...p, { title: "", category: "historical", dateAchieved: "", description: "", impactLevel: "national" }])}
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm thành tựu
                </button>
              </div>
              {achievements.map((ach, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input placeholder="Tên thành tựu" value={ach.title || ""} onChange={(e) => setAchievements((p) => p.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))} className={inputCls} />
                  <input placeholder="Ngày đạt được" value={ach.dateAchieved || ""} onChange={(e) => setAchievements((p) => p.map((x, i) => (i === idx ? { ...x, dateAchieved: e.target.value } : x)))} className={inputCls} />
                  <div className="flex items-center gap-1">
                    <input placeholder="Mô tả ngắn" value={ach.description || ""} onChange={(e) => setAchievements((p) => p.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)))} className={inputCls} />
                    <button type="button" onClick={() => setAchievements((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === "finance_quotes" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--accent)]">Tài chính &amp; Tài sản Đa tiền tệ ({assets.length})</span>
                <button
                  type="button"
                  onClick={() => setAssets((p) => [...p, { personalWealth: "", currencyCode: "AUR", income: "", properties: [] }])}
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm hồ sơ tài sản
                </button>
              </div>
              {assets.map((as, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input placeholder="Tài sản cá nhân" value={as.personalWealth || ""} onChange={(e) => setAssets((p) => p.map((x, i) => (i === idx ? { ...x, personalWealth: e.target.value } : x)))} className={inputCls} />
                  <select value={as.currencyCode || "AUR"} onChange={(e) => setAssets((p) => p.map((x, i) => (i === idx ? { ...x, currencyCode: e.target.value } : x)))} className={inputCls}>
                    {WORLD_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                  </select>
                  <input placeholder="Thu nhập" value={as.income || ""} onChange={(e) => setAssets((p) => p.map((x, i) => (i === idx ? { ...x, income: e.target.value } : x)))} className={inputCls} />
                  <button type="button" onClick={() => setAssets((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 justify-self-end p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <span className="text-xs font-semibold text-[var(--accent)]">Lời thoại &amp; Trích dẫn ({quotes.length})</span>
                <button
                  type="button"
                  onClick={() => setQuotes((p) => [...p, { category: "famous", quoteText: "", listener: "", timeLabel: "", location: "" }])}
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm trích dẫn
                </button>
              </div>
              {quotes.map((q, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input placeholder="Câu nói nổi tiếng..." value={q.quoteText || ""} onChange={(e) => setQuotes((p) => p.map((x, i) => (i === idx ? { ...x, quoteText: e.target.value } : x)))} className={`${inputCls} sm:col-span-2`} />
                  <div className="flex items-center gap-1">
                    <input placeholder="Thời điểm / Người nghe" value={q.listener || ""} onChange={(e) => setQuotes((p) => p.map((x, i) => (i === idx ? { ...x, listener: e.target.value } : x)))} className={inputCls} />
                    <button type="button" onClick={() => setQuotes((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === "gallery_sources" ? (
            <div className="space-y-4">
              <MultiImageGalleryUploader
                workspaceId={workspaceId}
                label="Thư viện Hình ảnh Nhân vật (Tải nhiều ảnh trực tiếp)"
                tags="character,gallery"
                items={images.map((img, idx) => ({
                  id: img.id || `cimg-${idx}`,
                  url: img.url || "",
                  caption: img.caption || "",
                  source: img.sourceCredit || ""
                }))}
                onChange={(next) =>
                  setImages(
                    next.map((g) => ({
                      id: g.id,
                      category: "portrait",
                      url: g.url,
                      caption: g.caption,
                      sourceCredit: g.source || ""
                    }))
                  )
                }
              />

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <span className="text-xs font-semibold text-[var(--accent)]">Nguồn &amp; Tài liệu Tham khảo ({sources.length})</span>
                <button
                  type="button"
                  onClick={() => setSources((p) => [...p, { sourceType: "official", title: "", providerOrAuthor: "", reliability: 90, verificationStatus: "verified" }])}
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm nguồn xác thực
                </button>
              </div>
              {sources.map((src, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input placeholder="Tên nguồn / Văn khố" value={src.title || ""} onChange={(e) => setSources((p) => p.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))} className={inputCls} />
                  <input placeholder="Tác giả / Người cung cấp" value={src.providerOrAuthor || ""} onChange={(e) => setSources((p) => p.map((x, i) => (i === idx ? { ...x, providerOrAuthor: e.target.value } : x)))} className={inputCls} />
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} max={100} value={src.reliability ?? 80} onChange={(e) => setSources((p) => p.map((x, i) => (i === idx ? { ...x, reliability: Number(e.target.value) } : x)))} className={inputCls} title="Độ tin cậy %" />
                    <button type="button" onClick={() => setSources((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[var(--accent)]">
                Trường Dữ liệu Tùy biến của Không gian ({customFieldDefs.length})
              </div>
              {customFieldDefs.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">Chưa có trường tùy biến nào. Bạn có thể tạo trong mục Quản lý Trường Tùy biến.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customFieldDefs.map((def) => (
                    <div key={def.id}>
                      <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                        [{def.groupName}] {def.label} {def.required && <span className="text-rose-400">*</span>}
                      </label>
                      {def.dataType === "select" ? (
                        <select value={String(customValues[def.id] ?? def.defaultValue ?? "")} onChange={(e) => setCustomValues({ ...customValues, [def.id]: e.target.value })} className={inputCls}>
                          <option value="">-- Chọn --</option>
                          {def.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : def.dataType === "boolean" ? (
                        <label className="flex items-center gap-2 text-xs">
                          <input type="checkbox" checked={Boolean(customValues[def.id])} onChange={(e) => setCustomValues({ ...customValues, [def.id]: e.target.checked })} />
                          <span>Có / Kích hoạt</span>
                        </label>
                      ) : (
                        <input value={String(customValues[def.id] ?? "")} onChange={(e) => setCustomValues({ ...customValues, [def.id]: e.target.value })} className={inputCls} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-wrap items-center justify-between gap-2">
          <input
            type="text"
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            placeholder="Ghi chú thay đổi phiên bản (VD: Cập nhật cảnh giới mới)..."
            className="flex-1 min-w-[200px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5 text-xs"
          />
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] text-xs cursor-pointer">
              Hủy
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-xs flex items-center gap-1.5 hover:brightness-110 disabled:opacity-60 cursor-pointer"
            >
              {saving ? <CheckCircle2 className="w-4 h-4 animate-pulse" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Đang lưu vào DB..." : isEdit ? "Lưu & Tạo Phiên bản mới" : "Khởi tạo Hồ sơ Nhân vật"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
