import {
  createConlang,
  deleteConlang,
  deleteConlangWord,
  loadState,
  updateConlang,
  upsertConlangWord
} from "@/db/repository";
import {
  buildAlphabetForStyle,
  DEFAULT_AETHELIAN_LEXICON,
  translateVietnameseToConlang
} from "@/lib/conlang";
import { generateConlangNames, reverseTranslateConlang } from "@/lib/v2-engines";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const state = await loadState();
  const conlangs = state.conlangs.filter(
    (c) => !workspaceId || c.workspaceId === workspaceId
  );
  return jsonOk({ conlangs });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "translate") {
    const state = await loadState();
    const lang = body.languageId
      ? state.conlangs.find((c) => c.id === body.languageId)
      : state.conlangs.find((c) => c.workspaceId === body.workspaceId) ??
        state.conlangs[0];
    const result = translateVietnameseToConlang(String(body.text || ""), lang);
    return jsonOk({
      language: lang
        ? { id: lang.id, name: lang.name, nativeName: lang.nativeName, sigil: lang.sigil }
        : null,
      translation: result
    });
  }

  if (body.action === "reverse_translate") {
    const state = await loadState();
    const lang = body.languageId
      ? state.conlangs.find((c) => c.id === body.languageId)
      : state.conlangs[0];
    const result = reverseTranslateConlang(String(body.text || ""), lang);
    return jsonOk({ result });
  }

  if (body.action === "generate_names") {
    const state = await loadState();
    const lang = body.languageId
      ? state.conlangs.find((c) => c.id === body.languageId)
      : state.conlangs[0];
    const names = generateConlangNames(
      body.category || "kingdom",
      Number(body.count || 8),
      lang,
      Number(body.seedOffset || 0)
    );
    return jsonOk({ names });
  }

  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  if (body.action === "upsert_word") {
    if (!body.languageId || !body.vietnamese?.trim() || !body.romanized?.trim()) {
      return jsonError("Vui lòng nhập từ Tiếng Việt và Phiên âm Cổ ngữ.");
    }
    const word = await upsertConlangWord(body.languageId, body);
    if (!word) return jsonError("Không tìm thấy ngôn ngữ.", 404);
    return jsonOk({ word }, 201);
  }

  if (!body.workspaceId || !body.name?.trim()) {
    return jsonError("Vui lòng nhập tên bộ ngôn ngữ mới.");
  }

  const conlang = await createConlang({
    workspaceId: body.workspaceId,
    name: body.name.trim(),
    nativeName: (body.nativeName || body.name).trim(),
    description: (body.description || "").trim(),
    sigil: body.sigil || "ᚨ",
    accentColor: body.accentColor || "#A78BFA",
    scriptStyle: body.scriptStyle || "runic",
    phonologyPreset: body.phonologyPreset || "custom",
    customPrefixes: Array.isArray(body.customPrefixes) ? body.customPrefixes : undefined,
    customSuffixes: Array.isArray(body.customSuffixes) ? body.customSuffixes : undefined,
    alphabet: Array.isArray(body.alphabet)
      ? body.alphabet
      : buildAlphabetForStyle(body.scriptStyle || "runic"),
    lexicon: body.seedDefaults ? DEFAULT_AETHELIAN_LEXICON : []
  });
  return jsonOk({ conlang }, 201);
}

export async function PATCH(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.id) return jsonError("Thiếu ID ngôn ngữ.");
  const conlang = await updateConlang(body.id, body);
  if (!conlang) return jsonError("Không tìm thấy ngôn ngữ.", 404);
  return jsonOk({ conlang });
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const languageId = searchParams.get("languageId");
  const wordId = searchParams.get("wordId");

  if (languageId && wordId) {
    await deleteConlangWord(languageId, wordId);
    return jsonOk({ deleted: true });
  }
  if (languageId) {
    await deleteConlang(languageId);
    return jsonOk({ deleted: true });
  }
  return jsonError("Thiếu ID ngôn ngữ hoặc từ vựng.");
}
