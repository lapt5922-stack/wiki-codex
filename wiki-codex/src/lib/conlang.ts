import type {
  ConlangLanguage,
  ConlangLetter,
  ConlangPhonologyPreset,
  ConlangWord
} from "@/types/codex";
import { normalizeVietnamese } from "./vietnamese";

/**
 * World Conlang Engine V3.0 — Omnilingual System
 * - 6 pre-built fantasy languages (Aethelian Primary, Celestial, Nordic Frost, Solar Classical, Sylvan, Void)
 * - Full 29-letter Alphabet (A-Z + Vietnamese vowels Ă, Â, Đ, Ê, Ô, Ơ, Ư) editable per language
 * - Live Alphabet-driven transliteration & 1-Click Word/Name Spelling Engine
 * - Language-specific deterministic phonology synthesizer (respects customPrefixes / customSuffixes!)
 */

export interface TranslationToken {
  vietnamese: string;
  romanized: string;
  runic: string;
  fromLexicon: boolean;
}

export interface ConlangTranslationResult {
  vietnamese: string;
  romanized: string;
  runic: string;
  bilingualLines: Array<{ vi: string; romanized: string; runic: string }>;
  tokens: TranslationToken[];
}

export interface SpelledLetterTile {
  sourceChar: string;
  glyph: string;
  letterName: string;
  phonetic: string;
  meaning: string;
}

const SCRIPT_MAPS: Record<ConlangLanguage["scriptStyle"], Record<string, string>> = {
  runic: {
    a: "ᚨ", ă: "ᚨ̇", â: "ᚨ̂", b: "ᛒ", c: "ᚲ", d: "ᛞ", đ: "ᚦ", e: "ᛖ", ê: "ᛖ̂",
    f: "ᚠ", g: "ᚷ", h: "ᚺ", i: "ᛁ", j: "ᛃ", k: "ᚲ", l: "ᛚ", m: "ᛗ", n: "ᚾ",
    o: "ᛟ", ô: "ᛟ̂", ơ: "ᛟ̇", p: "ᛈ", q: "ᛩ", r: "ᚱ", s: "ᛊ", t: "ᛏ", u: "ᚢ",
    ư: "ᚢ̇", v: "ᚹ", w: "ᚹ", x: "ᛪ", y: "ᛇ", z: "ᛉ", "'": "·"
  },
  celestial: {
    a: "∆", ă: "∆̇", â: "▲", b: "⏣", c: "☾", d: "◈", đ: "❖", e: "⧗", ê: "⧖",
    f: "⚚", g: "⟐", h: "☥", i: "✦", j: "✧", k: "⌘", l: "⟁", m: "⬡", n: "⋏",
    o: "❂", ô: "◎", ơ: "☉", p: "⛨", q: "◉", r: "✶", s: "✵", t: "☩", u: "∪",
    ư: "⋃", v: "∨", w: "⟠", x: "✕", y: "Ψ", z: "⚝", "'": "·"
  },
  elder: {
    a: "Α", ă: "Ӑ", â: "Â", b: "Β", c: "Ϲ", d: "Δ", đ: "Ð", e: "Ε", ê: "Ê",
    f: "Φ", g: "Γ", h: "Η", i: "Ι", j: "Ξ", k: "Κ", l: "Λ", m: "Μ", n: "Ν",
    o: "Ω", ô: "Θ", ơ: "Ø", p: "Π", q: "Ϙ", r: "Ρ", s: "Σ", t: "Τ", u: "Υ",
    ư: "ϒ", v: "Ψ", w: "Ѡ", x: "Χ", y: "Ϋ", z: "Ζ", "'": "′"
  },
  frost: {
    a: "ᚫ", ă: "ᚬ", â: "ᚭ", b: "ᛓ", c: "ᚳ", d: "ᛑ", đ: "ᚧ", e: "ᛂ", ê: "ᛄ",
    f: "ᚡ", g: "ᚸ", h: "ᚻ", i: "ᛅ", j: "ᛄ", k: "ᚴ", l: "ᛛ", m: "ᛘ", n: "ᚿ",
    o: "ᛜ", ô: "ᛝ", ơ: "ᛟ", p: "ᛔ", q: "ᛕ", r: "ᛦ", s: "ᛋ", t: "ᛐ", u: "ᚣ",
    ư: "ᚤ", v: "ᚥ", w: "ᚥ", x: "ᛪ", y: "ᛨ", z: "ᛎ", "'": "·"
  },
  sylvan: {
    a: "ɑ", ă: "ɐ", â: "ɒ", b: "ɓ", c: "ɕ", d: "ɗ", đ: "ð", e: "ɛ", ê: "ɜ",
    f: "ƒ", g: "ɠ", h: "ɦ", i: "ɨ", j: "ʝ", k: "ƙ", l: "ɭ", m: "ɱ", n: "ɲ",
    o: "ɵ", ô: "ɶ", ơ: "ɞ", p: "ƥ", q: "ʠ", r: "ɾ", s: "ʂ", t: "ƭ", u: "ʉ",
    ư: "ʊ", v: "ʋ", w: "ɯ", x: "χ", y: "ʎ", z: "ʑ", "'": "ʼ"
  },
  void: {
    a: "⟁", ă: "⟀", â: "⟂", b: "⏣", c: "⟃", d: "⟄", đ: "⟅", e: "⟆", ê: "⟇",
    f: "⟈", g: "⟉", h: "⟊", i: "⟋", j: "⟌", k: "⟍", l: "⟎", m: "⟏", n: "⟐",
    o: "⟑", ô: "⟒", ơ: "⟓", p: "⟔", q: "⟕", r: "⟖", s: "⟗", t: "⟘", u: "⟙",
    ư: "⟚", v: "⟛", w: "⟜", x: "⟝", y: "⟞", z: "⟟", "'": "·"
  }
};

const BASE_ALPHABET_META: Array<{
  latin: string;
  letterName: string;
  phonetic: string;
  meaning: string;
}> = [
  { latin: "A", letterName: "Ael", phonetic: "/aː/", meaning: "Ánh sáng khởi nguyên" },
  { latin: "Ă", letterName: "Aen", phonetic: "/a/", meaning: "Bình minh ngắn" },
  { latin: "Â", letterName: "Aeth", phonetic: "/ə/", meaning: "Mạch nguồn sâu" },
  { latin: "B", letterName: "Bel", phonetic: "/b/", meaning: "Thành lũy bảo hộ" },
  { latin: "C", letterName: "Cael", phonetic: "/k/", meaning: "Vòm trời tinh tú" },
  { latin: "D", letterName: "Drav", phonetic: "/d/", meaning: "Đỉnh núi cổ" },
  { latin: "Đ", letterName: "Dhael", phonetic: "/ɗ/", meaning: "Trụ cột lục địa" },
  { latin: "E", letterName: "Elen", phonetic: "/e/", meaning: "Ngôi sao dẫn lối" },
  { latin: "Ê", letterName: "Etern", phonetic: "/eː/", meaning: "Dòng chảy vĩnh cửu" },
  { latin: "G", letterName: "Glac", phonetic: "/g/", meaning: "Băng tuyết thuần khiết" },
  { latin: "H", letterName: "Heli", phonetic: "/h/", meaning: "Hơi thở của gió" },
  { latin: "I", letterName: "Ith", phonetic: "/iː/", meaning: "Tia sáng tinh thể" },
  { latin: "K", letterName: "Khor", phonetic: "/kʰ/", meaning: "Biên niên sử sách" },
  { latin: "L", letterName: "Lyr", phonetic: "/l/", meaning: "Hòa âm cổ thư" },
  { latin: "M", letterName: "Mir", phonetic: "/m/", meaning: "Tấm gương tri thức" },
  { latin: "N", letterName: "Nor", phonetic: "/n/", meaning: "Phương Bắc xa xôi" },
  { latin: "O", letterName: "Orak", phonetic: "/oː/", meaning: "Con mắt học giả" },
  { latin: "Ô", letterName: "Othal", phonetic: "/o/", meaning: "Di sản truyền đời" },
  { latin: "Ơ", letterName: "Orel", phonetic: "/əː/", meaning: "Vòng tròn nhật nguyệt" },
  { latin: "P", letterName: "Pact", phonetic: "/p/", meaning: "Lời thề hiệp ước" },
  { latin: "Q", letterName: "Quir", phonetic: "/kw/", meaning: "Câu hỏi minh triết" },
  { latin: "R", letterName: "Raid", phonetic: "/r/", meaning: "Hành trình viễn du" },
  { latin: "S", letterName: "Sol", phonetic: "/s/", meaning: "Thái dương rực sáng" },
  { latin: "T", letterName: "Thal", phonetic: "/t/", meaning: "Đại dương mênh mông" },
  { latin: "U", letterName: "Umbr", phonetic: "/u/", meaning: "Bóng đêm tĩnh lặng" },
  { latin: "Ư", letterName: "Urel", phonetic: "/ɯ/", meaning: "Cổ thụ trường tồn" },
  { latin: "V", letterName: "Val", phonetic: "/v/", meaning: "Vương quốc thịnh trị" },
  { latin: "X", letterName: "Xyr", phonetic: "/ks/", meaning: "Giao điểm không gian" },
  { latin: "Y", letterName: "Yel", phonetic: "/j/", meaning: "Cầu nối ngôn ngữ" }
];

export function buildAlphabetForStyle(
  style: ConlangLanguage["scriptStyle"] = "runic"
): ConlangLetter[] {
  const table = SCRIPT_MAPS[style] ?? SCRIPT_MAPS.runic;
  return BASE_ALPHABET_META.map((m) => ({
    ...m,
    glyph: table[m.latin.toLowerCase()] ?? m.latin
  }));
}

export function toAncientScript(
  romanized: string,
  style: ConlangLanguage["scriptStyle"] = "runic",
  customAlphabet?: ConlangLetter[]
): string {
  const customMap = new Map<string, string>();
  if (customAlphabet && customAlphabet.length > 0) {
    for (const item of customAlphabet) {
      customMap.set(item.latin.toLowerCase(), item.glyph);
    }
  }
  const table = SCRIPT_MAPS[style] ?? SCRIPT_MAPS.runic;
  let out = "";
  for (const ch of romanized) {
    const lower = ch.toLowerCase();
    out += customMap.get(lower) ?? table[lower] ?? ch;
  }
  return out;
}

export function spellWordInConlang(
  input: string,
  language?: Pick<ConlangLanguage, "alphabet" | "scriptStyle">
): SpelledLetterTile[] {
  const alphabet =
    language?.alphabet && language.alphabet.length > 0
      ? language.alphabet
      : buildAlphabetForStyle(language?.scriptStyle ?? "runic");

  const lookup = new Map<string, ConlangLetter>();
  for (const l of alphabet) {
    lookup.set(l.latin.toLowerCase(), l);
  }

  const tiles: SpelledLetterTile[] = [];
  for (const ch of input.trim()) {
    if (ch === " ") continue;
    const lower = ch.toLowerCase();
    const norm = normalizeVietnamese(ch);
    const hit = lookup.get(lower) ?? lookup.get(norm);
    if (hit) {
      tiles.push({
        sourceChar: ch.toUpperCase(),
        glyph: hit.glyph,
        letterName: hit.letterName,
        phonetic: hit.phonetic,
        meaning: hit.meaning
      });
    } else {
      tiles.push({
        sourceChar: ch.toUpperCase(),
        glyph: toAncientScript(ch, language?.scriptStyle ?? "runic"),
        letterName: ch.toUpperCase(),
        phonetic: `/${lower}/`,
        meaning: "Ký tự mở rộng"
      });
    }
  }
  return tiles;
}

const PHONOLOGY_PRESETS: Record<
  ConlangPhonologyPreset,
  { onsets: string[]; nuclei: string[]; codas: string[] }
> = {
  aethelian: {
    onsets: ["Ael", "Val", "Syl", "Khor", "Thal", "Or", "Elen", "Mir", "Vael", "Ser", "Cal", "Lyr"],
    nuclei: ["a", "e", "i", "o", "ae", "ei", "ia", "oa"],
    codas: ["n", "r", "l", "s", "th", "en", "or", "is", "el", "ar", "on", "va"]
  },
  celestial: {
    onsets: ["Ast", "Cael", "Lum", "Orak", "Sol", "Aeth", "Stell", "Aur", "Nyx", "Ser"],
    nuclei: ["a", "e", "i", "ae", "io", "ea", "au"],
    codas: ["is", "on", "el", "ium", "ar", "os", "en", "a"]
  },
  nordic: {
    onsets: ["Glac", "Bore", "Skar", "Fjord", "Krag", "Valk", "Nord", "Drak", "Thar", "Hrim"],
    nuclei: ["a", "o", "u", "e", "i", "au", "ei"],
    codas: ["r", "k", "n", "gard", "heim", "or", "ur", "en", "st"]
  },
  solar: {
    onsets: ["Sol", "Aur", "Imp", "Heli", "Mar", "Cal", "Dom", "Ver", "Luc", "Reg"],
    nuclei: ["a", "o", "e", "i", "ia", "io", "au"],
    codas: ["ia", "ius", "or", "um", "is", "an", "os", "a"]
  },
  sylvan: {
    onsets: ["Syl", "Lyr", "Elen", "Fael", "Thal", "Mel", "Nym", "Vel", "Ael", "Lin"],
    nuclei: ["a", "e", "i", "ae", "ie", "ea", "y"],
    codas: ["l", "n", "en", "is", "iel", "yn", "ar", "a"]
  },
  void: {
    onsets: ["Voi", "Kha", "Zyr", "Nyx", "Vor", "Xel", "Umb", "Mal", "Qor", "Sha"],
    nuclei: ["a", "o", "u", "y", "ae", "ou"],
    codas: ["'ar", "'ul", "x", "z", "th", "ok", "ir", "'en"]
  },
  custom: {
    onsets: ["Ael", "Val", "Sol", "Khor", "Lyr", "Mir", "Or", "Thal"],
    nuclei: ["a", "e", "i", "o", "ae", "ia"],
    codas: ["n", "r", "l", "s", "en", "or", "is", "a"]
  }
};

function deterministicHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export function synthesizeConlangWord(
  viWord: string,
  language?: Pick<ConlangLanguage, "phonologyPreset" | "customPrefixes" | "customSuffixes">
): string {
  const norm = normalizeVietnamese(viWord);
  if (!norm || /^[0-9]+$/.test(norm)) return viWord;

  const preset = PHONOLOGY_PRESETS[language?.phonologyPreset ?? "aethelian"];
  const onsets =
    language?.customPrefixes && language.customPrefixes.length > 0
      ? language.customPrefixes
      : preset.onsets;
  const codas =
    language?.customSuffixes && language.customSuffixes.length > 0
      ? language.customSuffixes
      : preset.codas;

  const h = deterministicHash(norm);
  const onset = onsets[h % onsets.length];
  const nucleus = preset.nuclei[(h >>> 5) % preset.nuclei.length];
  const coda = codas[(h >>> 10) % codas.length];

  let word = `${onset.toLowerCase()}${nucleus}${coda}`;
  word = word.replace(/([aeiou])\1\1+/g, "$1$1");

  if (viWord[0] && viWord[0] === viWord[0].toUpperCase() && viWord[0] !== viWord[0].toLowerCase()) {
    word = word[0].toUpperCase() + word.slice(1);
  }
  return word;
}

export const DEFAULT_AETHELIAN_LEXICON: ConlangWord[] = [
  { id: "w-1", vietnamese: "vương quốc", romanized: "Valdoria", runic: toAncientScript("Valdoria"), partOfSpeech: "Danh từ", pronunciation: "/val-do-ri-a/", note: "Quốc gia quân chủ cổ đại" },
  { id: "w-2", vietnamese: "đế chế", romanized: "Imperion", runic: toAncientScript("Imperion"), partOfSpeech: "Danh từ", pronunciation: "/im-pe-ri-on/", note: "Liên minh các lãnh thổ lớn" },
  { id: "w-3", vietnamese: "nhân vật", romanized: "Sera'en", runic: toAncientScript("Sera'en"), partOfSpeech: "Danh từ", pronunciation: "/se-ra-en/", note: "Cá nhân ghi danh sử sách" },
  { id: "w-4", vietnamese: "biên niên sử", romanized: "Khor'vael", runic: toAncientScript("Khor'vael"), partOfSpeech: "Danh từ", pronunciation: "/khor-vael/", note: "Ghi chép lịch sử qua các kỷ nguyên" },
  { id: "w-5", vietnamese: "thư viện", romanized: "Orakel'on", runic: toAncientScript("Orakel'on"), partOfSpeech: "Danh từ", pronunciation: "/o-ra-kel-on/", note: "Nơi lưu giữ cổ thư tri thức" },
  { id: "w-6", vietnamese: "tri thức", romanized: "Sapiara", runic: toAncientScript("Sapiara"), partOfSpeech: "Danh từ", pronunciation: "/sa-pi-a-ra/", note: "Minh triết và học vấn" },
  { id: "w-7", vietnamese: "ánh sáng", romanized: "Aeloria", runic: toAncientScript("Aeloria"), partOfSpeech: "Danh từ", pronunciation: "/ae-lo-ri-a/", note: "Quang minh tinh tú" },
  { id: "w-8", vietnamese: "tinh tú", romanized: "Astrelis", runic: toAncientScript("Astrelis"), partOfSpeech: "Danh từ", pronunciation: "/as-tre-lis/", note: "Các vì sao dẫn đường" },
  { id: "w-9", vietnamese: "bầu trời", romanized: "Caelumir", runic: toAncientScript("Caelumir"), partOfSpeech: "Danh từ", note: "Vòm trời vô tận" },
  { id: "w-10", vietnamese: "mặt trăng", romanized: "Lunareth", runic: toAncientScript("Lunareth"), partOfSpeech: "Danh từ", note: "Nguyệt luân cổ đại" },
  { id: "w-11", vietnamese: "mặt trời", romanized: "Solarius", runic: toAncientScript("Solarius"), partOfSpeech: "Danh từ", note: "Thái dương rực sáng" },
  { id: "w-12", vietnamese: "lịch sử", romanized: "Chronael", runic: toAncientScript("Chronael"), partOfSpeech: "Danh từ", note: "Dòng chảy quá khứ" },
  { id: "w-13", vietnamese: "kỷ nguyên", romanized: "Aeterna", runic: toAncientScript("Aeterna"), partOfSpeech: "Danh từ", note: "Thời đại lịch sử lớn" },
  { id: "w-14", vietnamese: "thời gian", romanized: "Aeternum", runic: toAncientScript("Aeternum"), partOfSpeech: "Danh từ", note: "Trục thời gian vô tận" },
  { id: "w-15", vietnamese: "học giả", romanized: "Lumenor", runic: toAncientScript("Lumenor"), partOfSpeech: "Danh từ", note: "Người nghiên cứu cổ thư" },
  { id: "w-16", vietnamese: "sử gia", romanized: "Khor'len", runic: toAncientScript("Khor'len"), partOfSpeech: "Danh từ", note: "Người chép biên niên sử" },
  { id: "w-17", vietnamese: "kinh đô", romanized: "Aurelia", runic: toAncientScript("Aurelia"), partOfSpeech: "Danh từ", note: "Thủ phủ trung tâm" },
  { id: "w-18", vietnamese: "lục địa", romanized: "Terravael", runic: toAncientScript("Terravael"), partOfSpeech: "Danh từ", note: "Vùng đất rộng lớn" },
  { id: "w-19", vietnamese: "đại dương", romanized: "Thalassor", runic: toAncientScript("Thalassor"), partOfSpeech: "Danh từ", note: "Biển cả mênh mông" },
  { id: "w-20", vietnamese: "rừng", romanized: "Sylvar", runic: toAncientScript("Sylvar"), partOfSpeech: "Danh từ", note: "Khu rừng cổ thụ" },
  { id: "w-21", vietnamese: "núi", romanized: "Drakmor", runic: toAncientScript("Drakmor"), partOfSpeech: "Danh từ", note: "Đỉnh núi cao nguyên" },
  { id: "w-22", vietnamese: "băng", romanized: "Glacien", runic: toAncientScript("Glacien"), partOfSpeech: "Danh từ", note: "Băng tuyết phương Bắc" },
  { id: "w-23", vietnamese: "lửa", romanized: "Ignarel", runic: toAncientScript("Ignarel"), partOfSpeech: "Danh từ", note: "Ngọn lửa vĩnh cửu" },
  { id: "w-24", vietnamese: "gió", romanized: "Zephyra", runic: toAncientScript("Zephyra"), partOfSpeech: "Danh từ", note: "Làn gió tự do" },
  { id: "w-25", vietnamese: "nước", romanized: "Aquarel", runic: toAncientScript("Aquarel"), partOfSpeech: "Danh từ", note: "Dòng nước khởi nguyên" },
  { id: "w-26", vietnamese: "hòa bình", romanized: "Sylvaen", runic: toAncientScript("Sylvaen"), partOfSpeech: "Danh từ", note: "Sự thái bình thịnh trị" },
  { id: "w-27", vietnamese: "hiệp ước", romanized: "Pactumir", runic: toAncientScript("Pactumir"), partOfSpeech: "Danh từ", note: "Lời thề liên minh" },
  { id: "w-28", vietnamese: "cổ ngữ", romanized: "Aethel'va", runic: toAncientScript("Aethel'va"), partOfSpeech: "Danh từ", note: "Ngôn ngữ cổ của lục địa" },
  { id: "w-29", vietnamese: "cổ thư", romanized: "Grimoira", runic: toAncientScript("Grimoira"), partOfSpeech: "Danh từ", note: "Sách cổ ghi chép tri thức" },
  { id: "w-30", vietnamese: "lời thề", romanized: "Oathir", runic: toAncientScript("Oathir"), partOfSpeech: "Danh từ", note: "Cam kết danh dự" },
  { id: "w-31", vietnamese: "di sản", romanized: "Othalir", runic: toAncientScript("Othalir"), partOfSpeech: "Danh từ", note: "Giá trị truyền đời" },
  { id: "w-32", vietnamese: "bản đồ", romanized: "Cartolis", runic: toAncientScript("Cartolis"), partOfSpeech: "Danh từ", note: "Họa đồ địa lý" },
  { id: "w-33", vietnamese: "ngôn ngữ", romanized: "Lingvael", runic: toAncientScript("Lingvael"), partOfSpeech: "Danh từ", note: "Tiếng nói và chữ viết" },
  { id: "w-34", vietnamese: "kiến trúc", romanized: "Arkhon", runic: toAncientScript("Arkhon"), partOfSpeech: "Danh từ", note: "Nghệ thuật xây dựng" },
  { id: "w-35", vietnamese: "thế giới", romanized: "Mundael", runic: toAncientScript("Mundael"), partOfSpeech: "Danh từ", note: "Toàn cõi thế gian" },
  { id: "w-36", vietnamese: "của", romanized: "en", runic: toAncientScript("en"), partOfSpeech: "Giới từ", note: "Sở hữu" },
  { id: "w-37", vietnamese: "và", romanized: "et", runic: toAncientScript("et"), partOfSpeech: "Liên từ", note: "Kết nối" },
  { id: "w-38", vietnamese: "trong", romanized: "in", runic: toAncientScript("in"), partOfSpeech: "Giới từ", note: "Bên trong" },
  { id: "w-39", vietnamese: "dưới", romanized: "sub", runic: toAncientScript("sub"), partOfSpeech: "Giới từ", note: "Phía dưới" },
  { id: "w-40", vietnamese: "trên", romanized: "sur", runic: toAncientScript("sur"), partOfSpeech: "Giới từ", note: "Phía trên" },
  { id: "w-41", vietnamese: "là", romanized: "es", runic: toAncientScript("es"), partOfSpeech: "Động từ", note: "Tồn tại / định nghĩa" },
  { id: "w-42", vietnamese: "từ", romanized: "de", runic: toAncientScript("de"), partOfSpeech: "Giới từ", note: "Khởi nguồn từ" },
  { id: "w-43", vietnamese: "đến", romanized: "ad", runic: toAncientScript("ad"), partOfSpeech: "Giới từ", note: "Hướng tới" },
  { id: "w-44", vietnamese: "cổ đại", romanized: "Antiquar", runic: toAncientScript("Antiquar"), partOfSpeech: "Tính từ", note: "Xa xưa, lâu đời" },
  { id: "w-45", vietnamese: "vĩnh cửu", romanized: "Eternis", runic: toAncientScript("Eternis"), partOfSpeech: "Tính từ", note: "Bất biến theo thời gian" },
  { id: "w-46", vietnamese: "huyền bí", romanized: "Arcanor", runic: toAncientScript("Arcanor"), partOfSpeech: "Tính từ", note: "Sâu thẳm, kỳ diệu" },
  { id: "w-47", vietnamese: "phương bắc", romanized: "Borealis", runic: toAncientScript("Borealis"), partOfSpeech: "Danh từ", note: "Miền Bắc giá lạnh" },
  { id: "w-48", vietnamese: "phương nam", romanized: "Australis", runic: toAncientScript("Australis"), partOfSpeech: "Danh từ", note: "Miền Nam ấm áp" }
];

export function createSixDefaultConlangs(workspaceId: string, now: string): ConlangLanguage[] {
  return [
    {
      id: "lang-aethelva",
      workspaceId,
      name: "Cổ ngữ Aethelian (Ngôn ngữ Chính)",
      nativeName: "Aethel'va",
      description: "Ngôn ngữ học thuật và sử thi chính thức của Lục địa Aethelgard, kèm bảng chữ cái Runic 29 ký tự đầy đủ.",
      sigil: "ᚨ",
      accentColor: "#D4AF37",
      scriptStyle: "runic",
      phonologyPreset: "aethelian",
      isPrimary: true,
      alphabet: buildAlphabetForStyle("runic"),
      lexicon: DEFAULT_AETHELIAN_LEXICON,
      createdAt: now
    },
    {
      id: "lang-celestial",
      workspaceId,
      name: "Thiên Văn Ngữ Orakel",
      nativeName: "Astrel'on",
      description: "Ngữ hệ ký hiệu thiên văn dùng trên bản đồ sao và ấn ký của Hội đồng Thiên văn.",
      sigil: "✦",
      accentColor: "#A78BFA",
      scriptStyle: "celestial",
      phonologyPreset: "celestial",
      alphabet: buildAlphabetForStyle("celestial"),
      lexicon: DEFAULT_AETHELIAN_LEXICON.slice(0, 20).map((w) => ({
        ...w,
        runic: toAncientScript(w.romanized, "celestial")
      })),
      createdAt: now
    },
    {
      id: "lang-glacien",
      workspaceId,
      name: "Băng Triều Cổ Ngữ",
      nativeName: "Glacien'or",
      description: "Phương ngữ phương Bắc rắn rỏi dùng trong luật hàng hải và biên niên sử vịnh Aurelia.",
      sigil: "✧",
      accentColor: "#38BDF8",
      scriptStyle: "frost",
      phonologyPreset: "nordic",
      alphabet: buildAlphabetForStyle("frost"),
      lexicon: DEFAULT_AETHELIAN_LEXICON.slice(0, 16).map((w) => ({
        ...w,
        runic: toAncientScript(w.romanized, "frost")
      })),
      createdAt: now
    },
    {
      id: "lang-solaris",
      workspaceId,
      name: "Hoàng Kim Ngữ Solaria",
      nativeName: "Solaris'ia",
      description: "Ngữ hệ cổ điển giàu nguyên âm của Đế chế Hoàng Kim phương Nam.",
      sigil: "✹",
      accentColor: "#F59E0B",
      scriptStyle: "elder",
      phonologyPreset: "solar",
      alphabet: buildAlphabetForStyle("elder"),
      lexicon: DEFAULT_AETHELIAN_LEXICON.slice(0, 16).map((w) => ({
        ...w,
        runic: toAncientScript(w.romanized, "elder")
      })),
      createdAt: now
    },
    {
      id: "lang-sylvar",
      workspaceId,
      name: "Mộc Ngữ Rừng Ngọc",
      nativeName: "Sylvar'en",
      description: "Ngôn ngữ mềm mại lưu giữ trên các bia đá cổ thụ tại Rừng Ngọc Sylvaris.",
      sigil: "ᛇ",
      accentColor: "#34D399",
      scriptStyle: "sylvan",
      phonologyPreset: "sylvan",
      alphabet: buildAlphabetForStyle("sylvan"),
      lexicon: DEFAULT_AETHELIAN_LEXICON.slice(0, 14).map((w) => ({
        ...w,
        runic: toAncientScript(w.romanized, "sylvan")
      })),
      createdAt: now
    },
    {
      id: "lang-void",
      workspaceId,
      name: "Hư Không Ngữ Cổ Sơ",
      nativeName: "Void'ar",
      description: "Văn tự cổ sơ xuất hiện trên các di tích tiền sử và hải đồ Thành cổ Mất tích.",
      sigil: "⟐",
      accentColor: "#FB7185",
      scriptStyle: "void",
      phonologyPreset: "void",
      alphabet: buildAlphabetForStyle("void"),
      lexicon: DEFAULT_AETHELIAN_LEXICON.slice(0, 12).map((w) => ({
        ...w,
        runic: toAncientScript(w.romanized, "void")
      })),
      createdAt: now
    }
  ];
}

function matchCapitalization(source: string, target: string): string {
  if (!source || !target) return target;
  if (source === source.toUpperCase() && source !== source.toLowerCase()) {
    return target.toUpperCase();
  }
  const first = source[0];
  if (first === first.toUpperCase() && first !== first.toLowerCase()) {
    return target[0].toUpperCase() + target.slice(1);
  }
  return target;
}

export function translateVietnameseToConlang(
  vietnameseText: string,
  language?: Pick<
    ConlangLanguage,
    "lexicon" | "scriptStyle" | "alphabet" | "phonologyPreset" | "customPrefixes" | "customSuffixes"
  >
): ConlangTranslationResult {
  const lexicon = language?.lexicon ?? DEFAULT_AETHELIAN_LEXICON;
  const scriptStyle = language?.scriptStyle ?? "runic";
  const alphabet = language?.alphabet;

  const lexMap = new Map<string, ConlangWord>();
  let maxPhraseWords = 1;
  for (const entry of lexicon) {
    const key = normalizeVietnamese(entry.vietnamese);
    if (!key) continue;
    lexMap.set(key, entry);
    const len = key.split(" ").length;
    if (len > maxPhraseWords) maxPhraseWords = len;
  }

  const lines = vietnameseText.split(/\r?\n/);
  const bilingualLines: Array<{ vi: string; romanized: string; runic: string }> = [];
  const allTokens: TranslationToken[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      bilingualLines.push({ vi: "", romanized: "", runic: "" });
      continue;
    }

    const mdPrefixMatch = /^(\s*(?:#{1,6}\s+|[-*]\s+|>\s+))(.*)$/.exec(line);
    const prefix = mdPrefixMatch ? mdPrefixMatch[1] : "";
    const body = mdPrefixMatch ? mdPrefixMatch[2] : line;

    const rawParts = body.split(/([^\p{L}\p{N}]+)/u).filter((p) => p.length > 0);
    const outRomanParts: string[] = [];
    const outRunicParts: string[] = [];

    let i = 0;
    while (i < rawParts.length) {
      const part = rawParts[i];
      if (!/[\p{L}\p{N}]/u.test(part)) {
        outRomanParts.push(part);
        outRunicParts.push(part);
        i++;
        continue;
      }

      let matchedWord: ConlangWord | null = null;
      let matchedSpan = 1;
      let matchedSource = part;

      for (let wordCount = Math.min(maxPhraseWords, 4); wordCount >= 1; wordCount--) {
        const candidateParts: string[] = [];
        let cursor = i;
        let wordsSeen = 0;
        let valid = true;

        while (cursor < rawParts.length && wordsSeen < wordCount) {
          const token = rawParts[cursor];
          if (/[\p{L}\p{N}]/u.test(token)) {
            candidateParts.push(token);
            wordsSeen++;
            cursor++;
          } else if (token === " " && wordsSeen > 0 && wordsSeen < wordCount) {
            cursor++;
          } else {
            valid = false;
            break;
          }
        }

        if (valid && wordsSeen === wordCount) {
          const phraseNorm = normalizeVietnamese(candidateParts.join(" "));
          const hit = lexMap.get(phraseNorm);
          if (hit) {
            matchedWord = hit;
            matchedSpan = cursor - i;
            matchedSource = candidateParts.join(" ");
            break;
          }
        }
      }

      if (matchedWord) {
        const rom = matchCapitalization(matchedSource, matchedWord.romanized);
        const run = toAncientScript(rom, scriptStyle, alphabet);
        outRomanParts.push(rom);
        outRunicParts.push(run);
        allTokens.push({ vietnamese: matchedSource, romanized: rom, runic: run, fromLexicon: true });
        i += matchedSpan;
      } else {
        const rom = synthesizeConlangWord(part, language);
        const run = toAncientScript(rom, scriptStyle, alphabet);
        outRomanParts.push(rom);
        outRunicParts.push(run);
        allTokens.push({ vietnamese: part, romanized: rom, runic: run, fromLexicon: false });
        i++;
      }
    }

    bilingualLines.push({
      vi: line,
      romanized: prefix + outRomanParts.join(""),
      runic: prefix + outRunicParts.join("")
    });
  }

  return {
    vietnamese: vietnameseText,
    romanized: bilingualLines.map((l) => l.romanized).join("\n"),
    runic: bilingualLines.map((l) => l.runic).join("\n"),
    bilingualLines,
    tokens: allTokens
  };
}
