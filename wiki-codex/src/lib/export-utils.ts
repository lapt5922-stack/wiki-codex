import JSZip from "jszip";
import type {
  AtlasMap,
  AtlasPin,
  Category,
  ConlangLanguage,
  Entry,
  EntryRelation,
  EntryType,
  TimelineEvent,
  Workspace
} from "@/types/codex";

export interface WorkspaceExportBundle {
  format: "wiki-codex-v1";
  exportedAt: string;
  workspace: Workspace;
  categories: Category[];
  entryTypes: EntryType[];
  entries: Entry[];
  relations: EntryRelation[];
  timelineEvents: TimelineEvent[];
  atlasMaps: AtlasMap[];
  atlasPins: AtlasPin[];
  conlangs: ConlangLanguage[];
}

export function exportEntryToMarkdown(entry: Entry): string {
  const tagsYaml = entry.tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ");
  const lines = [
    "---",
    `title: "${entry.title.replace(/"/g, '\\"')}"`,
    `slug: "${entry.slug}"`,
    `subtitle: "${(entry.subtitle || "").replace(/"/g, '\\"')}"`,
    `status: "${entry.status}"`,
    `visibility: "${entry.visibility}"`,
    `sigil: "${entry.sigil || "✦"}"`,
    `tags: [${tagsYaml}]`,
    `updatedAt: "${entry.updatedAt}"`,
    "---",
    "",
    `# ${entry.sigil || "✦"} ${entry.title}`,
    entry.subtitle ? `> *${entry.subtitle}*` : "",
    "",
    entry.summary ? `**Tóm tắt:** ${entry.summary}\n` : "",
    entry.contentMarkdown || "",
    entry.sourcesMarkdown ? `\n## Nguồn & Tài liệu tham khảo\n\n${entry.sourcesMarkdown}` : ""
  ];
  return lines.filter((l) => l !== undefined).join("\n").trim() + "\n";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function exportBundleToHtml(bundle: WorkspaceExportBundle): string {
  const articlesHtml = bundle.entries
    .map(
      (e) => `
      <article class="codex-card" id="${escapeHtml(e.slug)}">
        <div class="meta">${escapeHtml(e.sigil || "✦")} · ${escapeHtml(e.status)} · ${escapeHtml(e.tags.join(", "))}</div>
        <h2>${escapeHtml(e.title)}</h2>
        ${e.subtitle ? `<p class="subtitle">${escapeHtml(e.subtitle)}</p>` : ""}
        ${e.summary ? `<p class="summary">${escapeHtml(e.summary)}</p>` : ""}
        <div class="content">${escapeHtml(e.contentMarkdown).replace(/\n/g, "<br/>")}</div>
      </article>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(bundle.workspace.name)} — Wiki Codex</title>
  <style>
    body { font-family: Georgia, serif; background: #0B1020; color: #EAE4D3; max-width: 920px; margin: 0 auto; padding: 32px 20px; line-height: 1.7; }
    header { border-bottom: 1px solid rgba(212,175,55,0.35); padding-bottom: 16px; margin-bottom: 32px; }
    h1 { color: #D4AF37; margin: 0 0 8px; }
    .codex-card { background: rgba(20, 29, 54, 0.85); border: 1px solid rgba(212,175,55,0.28); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .codex-card h2 { color: #F5DFA0; margin: 8px 0; }
    .meta { font-family: monospace; font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em; }
    .subtitle { font-style: italic; color: #CBD5E1; }
    .summary { background: rgba(212,175,55,0.08); border-left: 3px solid #D4AF37; padding: 10px 14px; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(bundle.workspace.sigil || "✦")} ${escapeHtml(bundle.workspace.name)}</h1>
    <p>${escapeHtml(bundle.workspace.description)}</p>
    <small>Xuất từ Wiki Codex lúc ${escapeHtml(bundle.exportedAt)} · ${bundle.entries.length} hồ sơ</small>
  </header>
  ${articlesHtml}
</body>
</html>`;
}

export async function exportBundleToZipBuffer(
  bundle: WorkspaceExportBundle
): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("codex-backup.json", JSON.stringify(bundle, null, 2));
  zip.file("index.html", exportBundleToHtml(bundle));

  const mdFolder = zip.folder("entries");
  if (mdFolder) {
    for (const entry of bundle.entries) {
      mdFolder.file(`${entry.slug || entry.id}.md`, exportEntryToMarkdown(entry));
    }
  }

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

export function parseMarkdownImport(
  markdown: string,
  fallbackTitle = "Hồ sơ nhập từ Markdown"
): {
  title: string;
  subtitle: string;
  summary: string;
  status?: Entry["status"];
  visibility?: Entry["visibility"];
  sigil?: string;
  tags: string[];
  contentMarkdown: string;
} {
  let title = fallbackTitle;
  let subtitle = "";
  let summary = "";
  let status: Entry["status"] | undefined;
  let visibility: Entry["visibility"] | undefined;
  let sigil: string | undefined;
  let tags: string[] = [];
  let contentMarkdown = markdown.trim();

  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(contentMarkdown);
  if (fmMatch) {
    const fm = fmMatch[1];
    contentMarkdown = fmMatch[2].trim();
    const titleM = /^title:\s*"?([^"\n]+)"?/m.exec(fm);
    const subM = /^subtitle:\s*"?([^"\n]+)"?/m.exec(fm);
    const statusM = /^status:\s*"?([^"\n]+)"?/m.exec(fm);
    const visM = /^visibility:\s*"?([^"\n]+)"?/m.exec(fm);
    const sigilM = /^sigil:\s*"?([^"\n]+)"?/m.exec(fm);
    const tagsM = /^tags:\s*\[([^\]]*)\]/m.exec(fm);
    if (titleM) title = titleM[1].trim();
    if (subM) subtitle = subM[1].trim();
    if (statusM) {
      const s = statusM[1].trim();
      if (s === "draft" || s === "review" || s === "published" || s === "archived") {
        status = s;
      }
    }
    if (visM) {
      const v = visM[1].trim();
      if (v === "public" || v === "private") {
        visibility = v;
      }
    }
    if (sigilM) sigil = sigilM[1].trim();
    if (tagsM) {
      tags = tagsM[1]
        .split(",")
        .map((s) => s.replace(/["']/g, "").trim())
        .filter(Boolean);
    }
  } else {
    const h1 = /^#\s+(.+)$/m.exec(contentMarkdown);
    if (h1) title = h1[1].trim();
  }

  // Strip auto-exported header block (# Sigil Title, > *Subtitle*, **Tóm tắt:** ...) if re-importing exported markdown
  const summaryMatch = /^\*\*Tóm tắt:\*\*\s*([^\n]+)\r?\n?/m.exec(contentMarkdown);
  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  }

  return { title, subtitle, summary, status, visibility, sigil, tags, contentMarkdown };
}
