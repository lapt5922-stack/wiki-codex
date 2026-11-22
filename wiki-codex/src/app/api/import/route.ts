import { createEntry, loadState } from "@/db/repository";
import { parseMarkdownImport } from "@/lib/export-utils";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  const { workspaceId, format, content } = body as {
    workspaceId: string;
    format: "json" | "markdown";
    content: string;
  };

  if (!workspaceId || !content?.trim()) {
    return jsonError("Thiếu nội dung hoặc không gian đích để nhập dữ liệu.");
  }

  const state = await loadState();
  const defaultType = state.entryTypes.find((t) => t.workspaceId === workspaceId);
  if (!defaultType) {
    return jsonError("Không gian đích chưa có Loại hồ sơ.");
  }

  if (format === "markdown") {
    const parsed = parseMarkdownImport(content);
    const entry = await createEntry(
      {
        workspaceId,
        entryTypeId: defaultType.id,
        title: parsed.title,
        subtitle: parsed.subtitle,
        summary: parsed.summary,
        sigil: parsed.sigil,
        tags: parsed.tags,
        contentMarkdown: parsed.contentMarkdown,
        status: parsed.status || "draft",
        visibility: parsed.visibility || "public"
      },
      user.name
    );
    return jsonOk({ importedCount: 1, entries: [entry] }, 201);
  }

  // JSON import (supports Wiki Codex bundle or array of entries)
  try {
    const parsed = JSON.parse(content);
    const rawEntries = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.entries)
      ? parsed.entries
      : [];

    if (rawEntries.length === 0) {
      return jsonError("Tệp JSON không chứa danh sách hồ sơ hợp lệ.");
    }

    let importedCount = 0;
    for (const item of rawEntries) {
      if (!item.title) continue;
      await createEntry(
        {
          workspaceId,
          entryTypeId:
            state.entryTypes.find(
              (t) => t.workspaceId === workspaceId && (t.id === item.entryTypeId || t.slug === item.entryTypeSlug)
            )?.id ?? defaultType.id,
          categoryId:
            state.categories.find(
              (c) => c.workspaceId === workspaceId && (c.id === item.categoryId || c.slug === item.categorySlug)
            )?.id ?? null,
          title: String(item.title),
          subtitle: String(item.subtitle || ""),
          summary: String(item.summary || ""),
          icon: String(item.icon || "ScrollText"),
          sigil: String(item.sigil || "✦"),
          coverImage: String(item.coverImage || ""),
          thumbImage: String(item.thumbImage || item.coverImage || ""),
          status: item.status || "published",
          visibility: item.visibility || "public",
          canonStatus: item.canonStatus || "canon",
          aliases: Array.isArray(item.aliases) ? item.aliases : [],
          epigraph: item.epigraph,
          customSections: Array.isArray(item.customSections) ? item.customSections : [],
          eraSnapshots: Array.isArray(item.eraSnapshots) ? item.eraSnapshots : [],
          breakdownBars: Array.isArray(item.breakdownBars) ? item.breakdownBars : [],
          powerLevel: typeof item.powerLevel === "number" ? item.powerLevel : undefined,
          powerInfinite: Boolean(item.powerInfinite),
          powerTierOverride: item.powerTierOverride,
          powerSourceLabel: item.powerSourceLabel,
          attributes: Array.isArray(item.attributes) ? item.attributes : undefined,
          powerHistory: Array.isArray(item.powerHistory) ? item.powerHistory : undefined,
          abilities: Array.isArray(item.abilities) ? item.abilities : undefined,
          feats: Array.isArray(item.feats) ? item.feats : undefined,
          variants: Array.isArray(item.variants) ? item.variants : undefined,
          extraFields: Array.isArray(item.extraFields) ? item.extraFields : [],
          hiddenSchemaKeys: Array.isArray(item.hiddenSchemaKeys) ? item.hiddenSchemaKeys : [],
          tabOverrides: item.tabOverrides,
          roster: Array.isArray(item.roster) ? item.roster : [],
          lawsAndCustoms: Array.isArray(item.lawsAndCustoms) ? item.lawsAndCustoms : [],
          forceUnits: Array.isArray(item.forceUnits) ? item.forceUnits : [],
          resourceItems: Array.isArray(item.resourceItems) ? item.resourceItems : [],
          rumorsAndSecrets: Array.isArray(item.rumorsAndSecrets) ? item.rumorsAndSecrets : [],
          featured: Boolean(item.featured),
          spoilerGate: Boolean(item.spoilerGate),
          spoilerLabel: String(item.spoilerLabel || ""),
          tags: Array.isArray(item.tags) ? item.tags : [],
          contentMarkdown: String(item.contentMarkdown || ""),
          customFields: item.customFields || {},
          sourcesMarkdown: String(item.sourcesMarkdown || ""),
          privateNotes: String(item.privateNotes || ""),
          gallery: Array.isArray(item.gallery) ? item.gallery : []
        },
        user.name
      );
      importedCount++;
    }

    return jsonOk({ importedCount }, 201);
  } catch {
    return jsonError("Định dạng JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.");
  }
}
