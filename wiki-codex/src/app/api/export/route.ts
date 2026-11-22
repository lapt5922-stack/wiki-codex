import { NextResponse } from "next/server";
import { loadState } from "@/db/repository";
import {
  exportBundleToHtml,
  exportBundleToZipBuffer,
  exportEntryToMarkdown,
  type WorkspaceExportBundle
} from "@/lib/export-utils";
import { exportEntriesToCsv } from "@/lib/v2-engines";
import { filterEntriesForRole } from "@/lib/rbac";
import { getRequestUser, jsonError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "";
  const format = (searchParams.get("format") || "json").toLowerCase();
  const entryIdsParam = searchParams.get("entryIds");

  const state = await loadState();
  const workspace =
    state.workspaces.find((w) => w.id === workspaceId) ?? state.workspaces[0];
  if (!workspace) return jsonError("Không tìm thấy không gian.", 404);

  const wsTypes = state.entryTypes.filter((t) => t.workspaceId === workspace.id);
  let entries = filterEntriesForRole(
    state.entries.filter((e) => e.workspaceId === workspace.id && !e.deletedAt),
    user.role,
    wsTypes
  );

  if (entryIdsParam) {
    const allowed = new Set(entryIdsParam.split(",").filter(Boolean));
    entries = entries.filter((e) => allowed.has(e.id));
  }

  if (format === "csv") {
    const csv = "\uFEFF" + exportEntriesToCsv(entries);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${workspace.slug}.csv"`
      }
    });
  }

  const bundle: WorkspaceExportBundle = {
    format: "wiki-codex-v1",
    exportedAt: new Date().toISOString(),
    workspace,
    categories: state.categories.filter(
      (c) => c.workspaceId === workspace.id && !c.deletedAt
    ),
    entryTypes: wsTypes,
    entries,
    relations: state.relations.filter((r) => r.workspaceId === workspace.id),
    timelineEvents: state.timelineEvents.filter((t) => t.workspaceId === workspace.id),
    atlasMaps: state.atlasMaps.filter((m) => m.workspaceId === workspace.id),
    atlasPins: state.atlasPins.filter((p) => p.workspaceId === workspace.id),
    conlangs: state.conlangs.filter((c) => c.workspaceId === workspace.id)
  };

  if (format === "markdown" || format === "md") {
    const md = entries.map(exportEntryToMarkdown).join("\n\n---\n\n");
    return new NextResponse(md, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${workspace.slug}.md"`
      }
    });
  }

  if (format === "html") {
    const html = exportBundleToHtml(bundle);
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${workspace.slug}.html"`
      }
    });
  }

  if (format === "zip") {
    const zipBytes = await exportBundleToZipBuffer(bundle);
    return new NextResponse(Buffer.from(zipBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${workspace.slug}-codex.zip"`
      }
    });
  }

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${workspace.slug}.json"`
    }
  });
}
