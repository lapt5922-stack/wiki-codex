import type { MetadataRoute } from "next";
import { loadState } from "@/db/repository";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://wiki-codex-atlas.onrender.com";
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/public`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const state = await loadState();
    const publicWorkspaces = state.workspaces.filter((w) => w.isPublic);
    const wsSlugById = new Map(publicWorkspaces.map((w) => [w.id, w.slug]));

    for (const ws of publicWorkspaces) {
      urls.push({
        url: `${baseUrl}/public/${ws.slug}`,
        lastModified: new Date(ws.updatedAt || now),
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }

    for (const ent of state.entries) {
      if (ent.deletedAt || ent.status !== "published" || ent.visibility !== "public") continue;
      const wsSlug = wsSlugById.get(ent.workspaceId);
      if (!wsSlug) continue;
      urls.push({
        url: `${baseUrl}/public/${wsSlug}/${ent.slug}`,
        lastModified: new Date(ent.updatedAt || now),
        changeFrequency: "weekly",
        priority: ent.featured ? 0.8 : 0.65,
      });
    }
  } catch {
    // Fallback to base URLs if DB unavailable at build time
  }

  return urls;
}
