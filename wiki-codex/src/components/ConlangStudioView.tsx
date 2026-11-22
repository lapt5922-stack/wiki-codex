"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  BookA,
  BookOpen,
  Copy,
  Languages,
  Plus,
  Sparkles,
  Trash2,
  Wand2
} from "lucide-react";
import type {
  ConlangLanguage,
  ConlangLetter,
  ConlangPhonologyPreset
} from "@/types/codex";
import {
  buildAlphabetForStyle,
  spellWordInConlang,
  translateVietnameseToConlang
} from "@/lib/conlang";
import { generateConlangNames, reverseTranslateConlang } from "@/lib/v2-engines";

interface ConlangStudioViewProps {
  workspaceId: string;
  conlangs: ConlangLanguage[];
  activeConlangId: string;
  canEdit: boolean;
  onSelectActiveConlang: (id: string) => void;
  onRefresh: () => Promise<void>;
  onCreateEntryFromName?: (name: string) => void;
}

export function ConlangStudioView({
  workspaceId,
  conlangs,
  activeConlangId,
  canEdit,
  onSelectActiveConlang,
  onRefresh,
  onCreateEntryFromName
}: ConlangStudioViewProps) {
  const [studioTab, setStudioTab] = useState<
    "translate" | "alphabet" | "reverse" | "names" | "lexicon" | "create"
  >("translate");

  const activeLang = useMemo(
    () => conlangs.find((c) => c.id === activeConlangId) ?? conlangs[0],
    [conlangs, activeConlangId]
  );

  // 1-Click Translate
  const [inputVi, setInputVi] = useState(
    "Dưới ánh sáng tinh tú phương Bắc, vương quốc và thư viện lưu giữ tri thức vĩnh cửu của thế giới."
  );
  const translated = useMemo(
    () => translateVietnameseToConlang(inputVi, activeLang),
    [inputVi, activeLang]
  );
  const [copied, setCopied] = useState(false);

  // Alphabet & Speller
  const [spellInput, setSpellInput] = useState("Aethelgard");
  const alphabet = useMemo(
    () =>
      activeLang?.alphabet && activeLang.alphabet.length > 0
        ? activeLang.alphabet
        : buildAlphabetForStyle(activeLang?.scriptStyle ?? "runic"),
    [activeLang]
  );
  const spelledTiles = useMemo(
    () => spellWordInConlang(spellInput, activeLang),
    [spellInput, activeLang]
  );
  const [editingLetterIdx, setEditingLetterIdx] = useState<number | null>(null);
  const [editGlyph, setEditGlyph] = useState("");
  const [editLName, setEditLName] = useState("");
  const [editPhonetic, setEditPhonetic] = useState("");
  const [editMeaning, setEditMeaning] = useState("");

  // Reverse translate
  const [reverseInput, setReverseInput] = useState("Valdoria et Orakel'on en Aeloria Astrelis");
  const reverseResult = useMemo(
    () => reverseTranslateConlang(reverseInput, activeLang),
    [reverseInput, activeLang]
  );

  // Name Generator
  const [nameCat, setNameCat] = useState<"kingdom" | "character" | "landmark" | "house">("kingdom");
  const [nameSeed, setNameSeed] = useState(0);
  const generatedNames = useMemo(
    () => generateConlangNames(nameCat, 8, activeLang, nameSeed),
    [nameCat, activeLang, nameSeed]
  );

  // Lexicon CRUD
  const [wVi, setWVi] = useState("");
  const [wRom, setWRom] = useState("");
  const [wPos, setWPos] = useState("Danh từ");
  const [wNote, setWNote] = useState("");

  // Custom Conlang Builder
  const [newName, setNewName] = useState("");
  const [newNative, setNewNative] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSigil, setNewSigil] = useState("ᚨ");
  const [newColor, setNewColor] = useState("#A78BFA");
  const [newStyle, setNewStyle] = useState<ConlangLanguage["scriptStyle"]>("runic");
  const [newPhonology, setNewPhonology] = useState<ConlangPhonologyPreset>("custom");
  const [newPrefixes, setNewPrefixes] = useState("Zel, Kor, Vael, Mir, Thal, Sol");
  const [newSuffixes, setNewSuffixes] = useState("is, on, ar, en, va, iel");

  function handleCopy(text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function startEditLetter(idx: number, l: ConlangLetter) {
    setEditingLetterIdx(idx);
    setEditGlyph(l.glyph);
    setEditLName(l.letterName);
    setEditPhonetic(l.phonetic);
    setEditMeaning(l.meaning);
  }

  async function saveAlphabetLetter(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLang || editingLetterIdx === null) return;
    const nextAlphabet = alphabet.map((l, idx) =>
      idx === editingLetterIdx
        ? { ...l, glyph: editGlyph || l.glyph, letterName: editLName, phonetic: editPhonetic, meaning: editMeaning }
        : l
    );
    await fetch("/api/conlang", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: activeLang.id, alphabet: nextAlphabet })
    });
    setEditingLetterIdx(null);
    await onRefresh();
  }

  async function handleAddWord(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLang || !wVi.trim() || !wRom.trim()) return;
    await fetch("/api/conlang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert_word",
        languageId: activeLang.id,
        vietnamese: wVi,
        romanized: wRom,
        partOfSpeech: wPos,
        note: wNote
      })
    });
    setWVi("");
    setWRom("");
    setWNote("");
    await onRefresh();
  }

  async function handleDeleteWord(wordId: string) {
    if (!activeLang) return;
    await fetch(`/api/conlang?languageId=${activeLang.id}&wordId=${wordId}`, { method: "DELETE" });
    await onRefresh();
  }

  async function handleCreateLang(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch("/api/conlang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        name: newName,
        nativeName: newNative || newName,
        description: newDesc,
        sigil: newSigil,
        accentColor: newColor,
        scriptStyle: newStyle,
        phonologyPreset: newPhonology,
        customPrefixes: newPrefixes.split(",").map((s) => s.trim()).filter(Boolean),
        customSuffixes: newSuffixes.split(",").map((s) => s.trim()).filter(Boolean),
        seedDefaults: true
      })
    });
    const data = await res.json();
    setNewName("");
    setNewNative("");
    setNewDesc("");
    await onRefresh();
    if (data.conlang?.id) {
      onSelectActiveConlang(data.conlang.id);
      setStudioTab("alphabet");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header + 1-Click Language Switcher Pills */}
      <div className="codex-card arcane-corners rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
            <Languages className="w-5 h-5" />
            Hệ thống Đa Ngôn Ngữ Thế Giới V3.0 ({conlangs.length} Ngôn ngữ · Bảng Chữ Cái · 1-Click)
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Chuyển đổi 1-Click giữa Ngôn ngữ chính và hàng loạt ngôn ngữ mới, tùy chỉnh Bảng Chữ Cái 29 ký tự và tự tạo bộ ngôn ngữ hoàn toàn riêng biệt.
          </p>
        </div>

        {/* 1-Click Language Selector Chips */}
        <div className="flex flex-wrap gap-1.5">
          {conlangs.map((l) => {
            const active = l.id === activeLang?.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onSelectActiveConlang(l.id)}
                style={active ? { borderColor: l.accentColor, color: l.accentColor, backgroundColor: `${l.accentColor}1E` } : undefined}
                className={`px-3 py-1.5 rounded-xl border text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  active ? "font-semibold shadow-sm" : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                }`}
              >
                <span>{l.sigil}</span>
                <span>{l.nativeName}</span>
                {l.isPrimary && <span className="text-[10px] opacity-75">(Chính)</span>}
              </button>
            );
          })}
        </div>

        {/* 1-Click Quick Tool Switcher Dock */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--border-subtle)] text-xs">
          {(
            [
              ["translate", Sparkles, "1. Dịch 1-Click"],
              ["alphabet", BookA, `2. Bảng Chữ Cái (${alphabet.length})`],
              ["reverse", ArrowLeftRight, "3. Dịch Ngược"],
              ["names", Wand2, "4. Sinh Tên Thế Giới"],
              ["lexicon", BookOpen, `5. Từ điển (${activeLang?.lexicon.length || 0})`],
              ["create", Plus, "6. Tự Tạo Ngôn Ngữ Mới"]
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStudioTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                studioTab === id
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c] font-bold"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tool 1: 1-Click Translator */}
      {studioTab === "translate" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="codex-card rounded-2xl p-4 space-y-3">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase">
              Văn bản Tiếng Việt (tự dịch tức thì sang {activeLang?.name})
            </label>
            <textarea
              rows={6}
              value={inputVi}
              onChange={(e) => setInputVi(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 text-sm leading-relaxed"
            />
          </div>

          <div className="codex-card arcane-corners rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--accent)] uppercase">
                {activeLang?.sigil} {activeLang?.name} ({activeLang?.nativeName})
              </span>
              <button
                type="button"
                onClick={() => handleCopy(`${translated.runic}\n${translated.romanized}`)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] cursor-pointer"
              >
                <Copy className="w-3 h-3" /> {copied ? "Đã chép!" : "Sao chép"}
              </button>
            </div>
            <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] p-3.5">
              <div className="text-[11px] font-mono text-[var(--text-muted)]">Văn tự theo Bảng Chữ Cái ({activeLang?.scriptStyle}):</div>
              <div className="font-mono text-lg tracking-widest text-[var(--accent)] break-words mt-1">{translated.runic}</div>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3.5">
              <div className="text-[11px] font-mono text-[var(--text-muted)]">Phiên âm La-tinh:</div>
              <div className="font-display text-base italic mt-1">{translated.romanized}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tool 2: Full Interactive Alphabet Table (CRUD) + 1-Click Speller */}
      {studioTab === "alphabet" && (
        <div className="space-y-4">
          {/* 1-Click Name / Word Speller */}
          <div className="codex-card rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--accent)]">
                ✦ Công cụ Đánh vần & Khắc tên bằng Bảng Chữ Cái {activeLang?.nativeName}
              </span>
              <input
                type="text"
                value={spellInput}
                onChange={(e) => setSpellInput(e.target.value)}
                placeholder="Gõ tên nhân vật / vương quốc..."
                className="w-64 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5 text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {spelledTiles.map((t, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)]/70 px-3 py-2 text-center min-w-[68px]"
                >
                  <div className="text-2xl text-[var(--accent)]">{t.glyph}</div>
                  <div className="text-xs font-bold mt-0.5">{t.sourceChar} → {t.letterName}</div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)]">{t.phonetic}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 29-Letter Alphabet Grid */}
          <div className="codex-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base text-[var(--accent)]">
                Bảng Chữ Cái Đầy Đủ — {activeLang?.name} (Bấm chữ cái để chỉnh sửa)
              </h3>
            </div>

            {editingLetterIdx !== null && canEdit && (
              <form onSubmit={saveAlphabetLetter} className="rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] p-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <input type="text" value={editGlyph} onChange={(e) => setEditGlyph(e.target.value)} placeholder="Ký tự Glyph" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-center text-base" />
                <input type="text" value={editLName} onChange={(e) => setEditLName(e.target.value)} placeholder="Tên chữ cái" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
                <input type="text" value={editPhonetic} onChange={(e) => setEditPhonetic(e.target.value)} placeholder="Phiên âm /.../" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 font-mono" />
                <input type="text" value={editMeaning} onChange={(e) => setEditMeaning(e.target.value)} placeholder="Ý nghĩa biểu tượng" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
                <div className="flex gap-1">
                  <button type="submit" className="flex-1 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer">Lưu</button>
                  <button type="button" onClick={() => setEditingLetterIdx(null)} className="px-2 rounded-lg border border-[var(--border-subtle)] cursor-pointer">Hủy</button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {alphabet.map((l, idx) => (
                <button
                  key={l.latin + idx}
                  type="button"
                  onClick={() => canEdit && startEditLetter(idx, l)}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-2.5 text-center hover:border-[var(--accent)] transition cursor-pointer space-y-0.5"
                >
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">{l.latin}</div>
                  <div className="text-2xl text-[var(--accent)] leading-tight">{l.glyph}</div>
                  <div className="text-xs font-semibold truncate">{l.letterName}</div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">{l.phonetic}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tool 3: Reverse Translate */}
      {studioTab === "reverse" && (
        <div className="codex-card rounded-2xl p-5 space-y-3">
          <div className="text-xs text-[var(--text-muted)]">
            Nhập từ hoặc câu bằng Phiên âm (VD: <code>Valdoria</code>, <code>Orakel&apos;on</code>) hoặc Văn tự Cổ ngữ để tra ngược nghĩa Tiếng Việt:
          </div>
          <input
            type="text"
            value={reverseInput}
            onChange={(e) => setReverseInput(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3.5 py-2 text-sm"
          />
          <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] p-4 space-y-1">
            <div className="text-xs font-mono text-[var(--accent)]">
              Nghĩa Tiếng Việt ({reverseResult.matchedCount} từ khớp từ điển gốc):
            </div>
            <div className="text-base font-medium">{reverseResult.vietnamese}</div>
          </div>
        </div>
      )}

      {/* Tool 4: World Name Generator */}
      {studioTab === "names" && (
        <div className="codex-card rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5 text-xs">
              {(
                [
                  ["kingdom", "⚜ Vương quốc"],
                  ["character", "⚝ Nhân vật"],
                  ["landmark", "◈ Địa danh"],
                  ["house", "ᛟ Dòng tộc"]
                ] as const
              ).map(([cat, label]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNameCat(cat)}
                  className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                    nameCat === cat
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                      : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setNameSeed((s) => s + 1)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer">
              <Wand2 className="w-3.5 h-3.5" /> Sinh 8 tên mới
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {generatedNames.map((n, i) => (
              <div key={i} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3.5 space-y-1.5">
                <div className="font-display text-lg font-bold text-[var(--accent)]">{n.romanized}</div>
                <div className="font-mono text-xs text-[var(--text-muted)]">{n.runic}</div>
                <div className="text-[11px] italic text-[var(--text-secondary)]">Gợi ý: {n.meaningHint}</div>
                {canEdit && onCreateEntryFromName && (
                  <button type="button" onClick={() => onCreateEntryFromName(n.romanized)} className="mt-2 w-full py-1 rounded-lg border border-[var(--border-strong)] text-[11px] text-[var(--accent)] hover:bg-[var(--accent-soft)] cursor-pointer">
                    + Tạo Hồ sơ từ tên này
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool 5: Lexicon CRUD */}
      {studioTab === "lexicon" && activeLang && (
        <div className="codex-card rounded-2xl p-4 space-y-3">
          {canEdit && (
            <form onSubmit={handleAddWord} className="grid grid-cols-1 sm:grid-cols-5 gap-2 pb-2">
              <input type="text" required value={wVi} onChange={(e) => setWVi(e.target.value)} placeholder="Từ Tiếng Việt *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs" />
              <input type="text" required value={wRom} onChange={(e) => setWRom(e.target.value)} placeholder="Phiên âm Cổ ngữ *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs" />
              <input type="text" value={wPos} onChange={(e) => setWPos(e.target.value)} placeholder="Từ loại" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs" />
              <input type="text" value={wNote} onChange={(e) => setWNote(e.target.value)} placeholder="Ghi chú..." className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs" />
              <button type="submit" className="rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs py-1.5 cursor-pointer">+ Thêm từ</button>
            </form>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
            {activeLang.lexicon.map((w) => (
              <div key={w.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-2 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{w.vietnamese}</span>
                    <span className="text-[var(--text-muted)]">→</span>
                    <span className="font-display text-[var(--accent)] font-semibold">{w.romanized}</span>
                  </div>
                  <div className="font-mono text-[11px] text-[var(--text-muted)] truncate">{w.runic} · {w.partOfSpeech}</div>
                </div>
                {canEdit && (
                  <button type="button" onClick={() => handleDeleteWord(w.id)} className="text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool 6: Custom World Language Creator */}
      {studioTab === "create" && (
        <form onSubmit={handleCreateLang} className="codex-card rounded-2xl p-5 space-y-3.5 max-w-2xl">
          <h3 className="font-display text-lg text-[var(--accent)]">
            ✦ Tự Tạo Bộ Ngôn Ngữ Thế Giới Mới (Tùy biến Ngữ âm & Bảng chữ cái)
          </h3>
          {!canEdit ? (
            <p className="text-xs text-[var(--text-muted)]">Vui lòng chuyển sang vai trò Admin hoặc Biên tập viên để tạo ngôn ngữ mới.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Tên ngôn ngữ (VD: Cổ ngữ Sa Mạc) *" className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
                <input type="text" value={newNative} onChange={(e) => setNewNative(e.target.value)} placeholder="Tên bản địa (VD: Qor'sara)" className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <select value={newStyle} onChange={(e) => setNewStyle(e.target.value as ConlangLanguage["scriptStyle"])} className="sm:col-span-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2">
                  <option value="runic">Văn tự Runic Cổ điển (ᚨᛖᛏᚺᛖᛚ)</option>
                  <option value="celestial">Văn tự Tinh tú (∆✦⟐❂)</option>
                  <option value="elder">Văn tự Đế chế Cổ (ΑΕΤΩΣ)</option>
                  <option value="frost">Văn tự Băng Triều (ᚫᛓᚳᛑ)</option>
                  <option value="sylvan">Văn tự Rừng Ngọc (ɑɓɕɗɛ)</option>
                  <option value="void">Văn tự Hư Không (⟁⏣⟃⟄)</option>
                </select>
                <select value={newPhonology} onChange={(e) => setNewPhonology(e.target.value as ConlangPhonologyPreset)} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2">
                  <option value="custom">Âm sắc Tự nhập</option>
                  <option value="aethelian">Âm Aethelian</option>
                  <option value="nordic">Âm Phương Bắc</option>
                  <option value="solar">Âm Phương Nam</option>
                  <option value="sylvan">Âm Mềm Sylvan</option>
                  <option value="void">Âm Cổ sơ Void</option>
                </select>
                <div className="flex gap-1.5">
                  <input type="text" value={newSigil} onChange={(e) => setNewSigil(e.target.value)} maxLength={2} className="w-12 text-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] text-base text-[var(--accent)]" />
                  <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="flex-1 h-9 rounded-xl bg-transparent cursor-pointer" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Tiền tố âm tiết riêng (cách nhau dấu phẩy)</label>
                  <input type="text" value={newPrefixes} onChange={(e) => setNewPrefixes(e.target.value)} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 font-mono" />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Hậu tố âm tiết riêng (cách nhau dấu phẩy)</label>
                  <input type="text" value={newSuffixes} onChange={(e) => setNewSuffixes(e.target.value)} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 font-mono" />
                </div>
              </div>
              <textarea rows={2} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Mô tả nguồn gốc lịch sử của ngôn ngữ..." className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 text-xs" />
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-xs cursor-pointer">
                ✦ Khởi tạo Ngôn ngữ & Mở Bảng Chữ Cái
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
