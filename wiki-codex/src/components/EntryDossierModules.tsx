"use client";

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Languages,
  Lock,
  Plus,
  Scale,
  Shield,
  Sparkles,
  Trash2,
  Users
} from "lucide-react";
import type {
  ConlangLanguage,
  Entry,
  EntryCustomLaw,
  EntryForceUnit,
  EntryResourceItem,
  EntryRosterMember,
  EntryRumorSecret
} from "@/types/codex";
import type { LinkLookupItem } from "./MarkdownCodexRenderer";
import { spellWordInConlang } from "@/lib/conlang";

/* ============================================================================
   1. ROSTER & LEADERSHIP PANEL (Tab "Nhân sự & Chức vụ" — Full CRUD)
   ============================================================================ */

export function EntryRosterPanel({
  entry,
  allEntries,
  canEdit,
  onOpenEntry,
  onPatch
}: {
  entry: Entry;
  allEntries: LinkLookupItem[];
  canEdit: boolean;
  onOpenEntry: (id: string) => void;
  onPatch: (patch: Record<string, unknown>, changeSummary: string) => Promise<void>;
}) {
  const roster = entry.roster || [];
  const [name, setName] = useState("");
  const [entryId, setEntryId] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [department, setDepartment] = useState("Triều chính / Ban điều hành");
  const [tenure, setTenure] = useState("");
  const [status, setStatus] = useState<EntryRosterMember["status"]>("active");
  const [note, setNote] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const linked = allEntries.find((x) => x.id === entryId);
    const finalName = name.trim() || linked?.title || "";
    if (!finalName || !roleTitle.trim()) return;
    const item: EntryRosterMember = {
      id: `ros-${Date.now()}`,
      name: finalName,
      entryId: entryId || null,
      roleTitle: roleTitle.trim(),
      department: department.trim() || "Tổng hợp",
      rankOrder: roster.length + 1,
      tenure: tenure.trim(),
      status,
      note: note.trim()
    };
    await onPatch({ roster: [...roster, item] }, `Thêm nhân sự: ${finalName}`);
    setName("");
    setEntryId("");
    setRoleTitle("");
    setTenure("");
    setNote("");
  }

  async function handleDelete(id: string) {
    await onPatch(
      { roster: roster.filter((r) => r.id !== id) },
      "Xóa nhân sự khỏi danh sách"
    );
  }

  const STATUS_MAP = {
    active: { label: "Đương nhiệm", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/35" },
    former: { label: "Tiền nhiệm", cls: "bg-slate-500/20 text-slate-300 border-slate-400/35" },
    deceased: { label: "Đã qua đời", cls: "bg-rose-500/15 text-rose-300 border-rose-400/35" }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
          <Users className="w-4 h-4" />
          Cơ Cấu Nhân Sự, Lãnh Đạo & Thành Viên ({roster.length})
        </h3>
        <p className="text-xs text-[var(--text-muted)]">
          Danh sách các chức vụ chủ chốt, thành viên và cố vấn gắn kết với {entry.title}.
        </p>
      </div>

      {roster.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-xs text-[var(--text-muted)]">
          Chưa có nhân sự nào được ghi nhận.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roster.map((m) => {
            const st = STATUS_MAP[m.status];
            return (
              <div
                key={m.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3.5 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[var(--accent)]">
                      {m.department} · {m.roleTitle}
                    </div>
                    {m.entryId ? (
                      <button
                        type="button"
                        onClick={() => onOpenEntry(m.entryId!)}
                        className="font-display font-bold text-base text-[var(--text-primary)] hover:text-[var(--accent)] underline decoration-dotted underline-offset-4 cursor-pointer"
                      >
                        ⚝ {m.name}
                      </button>
                    ) : (
                      <div className="font-display font-bold text-base text-[var(--text-primary)]">
                        {m.name}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.cls}`}>
                      {st.label}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {m.tenure && (
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">
                    Nhiệm kỳ: {m.tenure}
                  </div>
                )}
                {m.note && <p className="text-xs text-[var(--text-secondary)]">{m.note}</p>}
              </div>
            );
          })}
        </div>
      )}

      {canEdit && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)]/60 p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs"
        >
          <select
            value={entryId}
            onChange={(e) => {
              setEntryId(e.target.value);
              const found = allEntries.find((x) => x.id === e.target.value);
              if (found && !name) setName(found.title);
            }}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
          >
            <option value="">— Liên kết Hồ sơ Nhân vật (tuỳ chọn) —</option>
            {allEntries.map((x) => (
              <option key={x.id} value={x.id}>
                {x.sigil} {x.title}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên nhân sự / Hội đồng *"
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
          />
          <input
            type="text"
            required
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Chức vụ (VD: Quốc vương, Tướng quân...) *"
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
          />
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Ban / Bộ phận"
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
          />
          <input
            type="text"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            placeholder="Nhiệm kỳ (VD: Năm 310 – Nay)"
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
          />
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EntryRosterMember["status"])}
              className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5"
            >
              <option value="active">Đương nhiệm</option>
              <option value="former">Tiền nhiệm</option>
              <option value="deceased">Đã qua đời</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ============================================================================
   2. LAWS, CUSTOMS, FORCES & RESOURCES (Statecraft Dossier for Kingdoms/Orgs/Cities)
   ============================================================================ */

export function EntryStatecraftPanel({
  entry,
  canEdit,
  onPatch
}: {
  entry: Entry;
  canEdit: boolean;
  onPatch: (patch: Record<string, unknown>, changeSummary: string) => Promise<void>;
}) {
  const laws = entry.lawsAndCustoms || [];
  const forces = entry.forceUnits || [];
  const resources = entry.resourceItems || [];

  const [lawTitle, setLawTitle] = useState("");
  const [lawCat, setLawCat] = useState<EntryCustomLaw["category"]>("law");
  const [lawSummary, setLawSummary] = useState("");
  const [lawEnf, setLawEnf] = useState("");

  const [fuName, setFuName] = useState("");
  const [fuBranch, setFuBranch] = useState<EntryForceUnit["branch"]>("Hải quân");
  const [fuSize, setFuSize] = useState("");
  const [fuCmd, setFuCmd] = useState("");

  const [resName, setResName] = useState("");
  const [resAbund, setResAbund] = useState<EntryResourceItem["abundance"]>("Dồi dào");
  const [resRole, setResRole] = useState<EntryResourceItem["tradeRole"]>("Xuất khẩu chủ lực");

  const LAW_META: Record<EntryCustomLaw["category"], { label: string; cls: string }> = {
    law: { label: "Luật pháp", cls: "bg-sky-500/15 text-sky-300 border-sky-400/35" },
    custom: { label: "Phong tục", cls: "bg-amber-500/15 text-amber-300 border-amber-400/35" },
    taboo: { label: "Điều cấm kỵ", cls: "bg-rose-500/15 text-rose-300 border-rose-400/35" },
    ritual: { label: "Nghi lễ", cls: "bg-purple-500/15 text-purple-300 border-purple-400/35" },
    doctrine: { label: "Giáo lý", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/35" }
  };

  async function addLaw(e: React.FormEvent) {
    e.preventDefault();
    if (!lawTitle.trim()) return;
    const item: EntryCustomLaw = {
      id: `law-${Date.now()}`,
      title: lawTitle.trim(),
      category: lawCat,
      summary: lawSummary.trim(),
      enforcement: lawEnf.trim()
    };
    await onPatch({ lawsAndCustoms: [...laws, item] }, `Thêm luật/phong tục: ${item.title}`);
    setLawTitle("");
    setLawSummary("");
    setLawEnf("");
  }

  async function addForce(e: React.FormEvent) {
    e.preventDefault();
    if (!fuName.trim()) return;
    const item: EntryForceUnit = {
      id: `fu-${Date.now()}`,
      name: fuName.trim(),
      branch: fuBranch,
      sizeLabel: fuSize.trim() || "Chưa rõ quy mô",
      commander: fuCmd.trim() || "Chưa rõ",
      baseLocation: "",
      note: ""
    };
    await onPatch({ forceUnits: [...forces, item] }, `Thêm lực lượng: ${item.name}`);
    setFuName("");
    setFuSize("");
    setFuCmd("");
  }

  async function addResource(e: React.FormEvent) {
    e.preventDefault();
    if (!resName.trim()) return;
    const item: EntryResourceItem = {
      id: `res-${Date.now()}`,
      name: resName.trim(),
      abundance: resAbund,
      tradeRole: resRole,
      note: ""
    };
    await onPatch({ resourceItems: [...resources, item] }, `Thêm sản vật: ${item.name}`);
    setResName("");
  }

  return (
    <div className="space-y-6 pt-4 border-t border-[var(--border-subtle)]">
      {/* Laws & Customs */}
      <div className="space-y-3">
        <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
          <Scale className="w-4 h-4" />
          Luật Pháp, Phong Tục & Điều Cấm Kỵ ({laws.length})
        </h3>
        {laws.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {laws.map((l) => {
              const m = LAW_META[l.category];
              return (
                <div key={l.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/45 p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${m.cls}`}>{m.label}</span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onPatch({ lawsAndCustoms: laws.filter((x) => x.id !== l.id) }, "Xóa luật/phong tục")}
                        className="text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="font-display font-semibold text-sm text-[var(--text-primary)]">{l.title}</div>
                  {l.summary && <p className="text-xs text-[var(--text-secondary)]">{l.summary}</p>}
                  {l.enforcement && <div className="text-[11px] font-mono text-[var(--text-muted)]">Hiệu lực: {l.enforcement}</div>}
                </div>
              );
            })}
          </div>
        )}
        {canEdit && (
          <form onSubmit={addLaw} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <select value={lawCat} onChange={(e) => setLawCat(e.target.value as EntryCustomLaw["category"])} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5">
              {Object.entries(LAW_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
            </select>
            <input type="text" required value={lawTitle} onChange={(e) => setLawTitle(e.target.value)} placeholder="Tên đạo luật / phong tục *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
            <input type="text" value={lawSummary} onChange={(e) => setLawSummary(e.target.value)} placeholder="Nội dung ngắn..." className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
            <button type="submit" className="rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold py-1.5 cursor-pointer">+ Thêm Luật/Tục</button>
          </form>
        )}
      </div>

      {/* Military / Forces & Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2.5">
          <h4 className="font-display text-sm font-bold text-sky-300 flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> Lực Lượng, Quân Đoàn & Hạm Đội ({forces.length})
          </h4>
          {forces.map((f) => (
            <div key={f.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/45 p-3 text-xs flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-primary)]">{f.name} <span className="text-[10px] font-mono text-sky-300">({f.branch})</span></div>
                <div className="text-[var(--text-muted)]">Quy mô: {f.sizeLabel} · Chỉ huy: {f.commander}</div>
              </div>
              {canEdit && (
                <button type="button" onClick={() => onPatch({ forceUnits: forces.filter((x) => x.id !== f.id) }, "Xóa lực lượng")} className="text-rose-400 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {canEdit && (
            <form onSubmit={addForce} className="grid grid-cols-2 gap-1.5 text-xs">
              <input type="text" required value={fuName} onChange={(e) => setFuName(e.target.value)} placeholder="Tên quân đoàn / hạm đội *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5" />
              <select value={fuBranch} onChange={(e) => setFuBranch(e.target.value as EntryForceUnit["branch"])} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5">
                {["Hải quân", "Lục quân", "Kỵ binh", "Học giả / Pháp sư", "Cận vệ", "Thương đội"].map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <input type="text" value={fuSize} onChange={(e) => setFuSize(e.target.value)} placeholder="Quy mô quân số..." className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5" />
              <button type="submit" className="rounded-lg bg-sky-500/25 border border-sky-400/40 text-sky-200 font-semibold py-1.5 cursor-pointer">+ Thêm lực lượng</button>
            </form>
          )}
        </div>

        <div className="space-y-2.5">
          <h4 className="font-display text-sm font-bold text-emerald-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Tài Nguyên & Sản Vật Chủ Lực ({resources.length})
          </h4>
          {resources.map((r) => (
            <div key={r.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/45 p-3 text-xs flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-primary)]">{r.name}</div>
                <div className="text-[var(--text-muted)]">Trữ lượng: <strong className="text-emerald-300">{r.abundance}</strong> · {r.tradeRole}</div>
              </div>
              {canEdit && (
                <button type="button" onClick={() => onPatch({ resourceItems: resources.filter((x) => x.id !== r.id) }, "Xóa sản vật")} className="text-rose-400 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {canEdit && (
            <form onSubmit={addResource} className="grid grid-cols-2 gap-1.5 text-xs">
              <input type="text" required value={resName} onChange={(e) => setResName(e.target.value)} placeholder="Tên tài nguyên / sản vật *" className="col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5" />
              <select value={resAbund} onChange={(e) => setResAbund(e.target.value as EntryResourceItem["abundance"])} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5">
                {["Độc quyền", "Dồi dào", "Ổn định", "Khan hiếm"].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button type="submit" className="rounded-lg bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 font-semibold py-1.5 cursor-pointer">+ Thêm sản vật</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3. RUMORS, MYTHS & LAYERED SECRETS PANEL (3 Tiers + Spoiler Unlock + GM-Only)
   ============================================================================ */

export function EntryRumorsSecretsPanel({
  entry,
  canEdit,
  onPatch
}: {
  entry: Entry;
  canEdit: boolean;
  onPatch: (patch: Record<string, unknown>, changeSummary: string) => Promise<void>;
}) {
  const items = (entry.rumorsAndSecrets || []).filter((r) => canEdit || !r.gmOnly);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [title, setTitle] = useState("");
  const [tier, setTier] = useState<EntryRumorSecret["tier"]>("rumor");
  const [truthPercent, setTruthPercent] = useState(60);
  const [sourceLabel, setSourceLabel] = useState("");
  const [content, setContent] = useState("");
  const [gmOnly, setGmOnly] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const next: EntryRumorSecret = {
      id: `rum-${Date.now()}`,
      title: title.trim(),
      tier,
      truthPercent: tier === "fact" ? 100 : truthPercent,
      content: content.trim(),
      sourceLabel: sourceLabel.trim() || "Truyền thuyết dân gian",
      gmOnly
    };
    await onPatch({ rumorsAndSecrets: [...(entry.rumorsAndSecrets || []), next] }, `Thêm tin đồn/bí mật: ${next.title}`);
    setTitle("");
    setContent("");
    setSourceLabel("");
    setGmOnly(false);
  }

  return (
    <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
      <h3 className="font-display text-base font-bold text-purple-300 flex items-center gap-2">
        <EyeOff className="w-4 h-4" />
        Tin Đồn, Huyền Thoại & Bí Mật Đa Lớp ({items.length})
      </h3>

      {items.length > 0 && (
        <div className="space-y-2.5">
          {items.map((r) => {
            const isSecretLocked = r.tier === "secret" && !revealedIds[r.id];
            return (
              <div
                key={r.id}
                className={`rounded-xl border p-3.5 space-y-1.5 ${
                  r.tier === "secret"
                    ? "border-purple-400/40 bg-purple-500/10"
                    : r.tier === "rumor"
                    ? "border-amber-400/35 bg-amber-500/8"
                    : "border-emerald-400/35 bg-emerald-500/8"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-black/40 border border-white/15">
                      {r.tier === "secret" ? "🔒 Bí mật ẩn" : r.tier === "rumor" ? `💬 Tin đồn (${r.truthPercent}% thật)` : "✦ Sự thật công khai"}
                    </span>
                    {r.gmOnly && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-mono">
                        <Lock className="w-3 h-3" /> Ẩn khách
                      </span>
                    )}
                    <span className="font-display font-semibold text-sm text-[var(--text-primary)]">{r.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {r.tier === "secret" && (
                      <button
                        type="button"
                        onClick={() => setRevealedIds((p) => ({ ...p, [r.id]: !p[r.id] }))}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-purple-400/40 text-purple-200 cursor-pointer"
                      >
                        {isSecretLocked ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {isSecretLocked ? "Lật mở" : "Ẩn"}
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          onPatch(
                            { rumorsAndSecrets: (entry.rumorsAndSecrets || []).filter((x) => x.id !== r.id) },
                            "Xóa tin đồn/bí mật"
                          )
                        }
                        className="text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {isSecretLocked ? (
                  <p className="text-xs italic text-purple-200/70">
                    Nội dung bí mật đang được niêm phong. Nhấn &ldquo;Lật mở&rdquo; để xem.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{r.content}</p>
                    <div className="text-[11px] text-[var(--text-muted)] italic">— Nguồn: {r.sourceLabel}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleAdd} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 space-y-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <select value={tier} onChange={(e) => setTier(e.target.value as EntryRumorSecret["tier"])} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5">
              <option value="rumor">Tin đồn / Huyền thoại</option>
              <option value="secret">Bí mật ẩn (Spoiler)</option>
              <option value="fact">Sự thật công khai</option>
            </select>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề tin đồn / bí mật *" className="sm:col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
            <input type="text" value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} placeholder="Nguồn truyền miệng..." className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
          </div>
          <textarea rows={2} required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nội dung chi tiết..." className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] p-2" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {tier === "rumor" && (
                <label className="inline-flex items-center gap-1.5 text-[11px]">
                  <span>Độ xác thực: {truthPercent}%</span>
                  <input type="range" min={0} max={100} value={truthPercent} onChange={(e) => setTruthPercent(Number(e.target.value))} />
                </label>
              )}
              <label className="inline-flex items-center gap-1.5 text-[11px] text-amber-300 cursor-pointer">
                <input type="checkbox" checked={gmOnly} onChange={(e) => setGmOnly(e.target.checked)} />
                Chỉ nội bộ Admin/Editor (Ẩn Khách)
              </label>
            </div>
            <button type="submit" className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer">
              + Thêm vào hồ sơ
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ============================================================================
   4. LINGUISTIC DOSSIER (Shown specifically on type-language profiles!)
   ============================================================================ */

export function EntryLinguisticDossier({ conlang }: { conlang?: ConlangLanguage }) {
  const [word, setWord] = useState("Aethelgard");
  if (!conlang) return null;
  const tiles = spellWordInConlang(word, conlang);

  return (
    <div className="rounded-2xl border border-purple-400/35 bg-purple-500/8 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-sm font-bold text-purple-200 flex items-center gap-2">
          <Languages className="w-4 h-4" />
          Hồ Sơ Cổ Tự & Đánh Vần Trực Tiếp ({conlang.name})
        </h3>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Nhập từ để đánh vần..."
          className="rounded-lg border border-purple-400/40 bg-[var(--bg-base)] px-2.5 py-1 text-xs"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tiles.map((t, i) => (
          <div key={i} className="rounded-lg border border-purple-400/30 bg-[var(--bg-base)]/75 px-2.5 py-1.5 text-center min-w-[44px]">
            <div className="text-lg text-purple-200 font-mono leading-none">{t.glyph}</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">{t.sourceChar}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
