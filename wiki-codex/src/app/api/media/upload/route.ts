import path from "path";
import { upsertMediaAsset } from "@/db/repository";
import { saveMediaBlob } from "@/db/media-blob-store";
import { sanitizeSvgContent } from "@/lib/heraldry/shapes-and-palettes";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const workspaceId = String(form.get("workspaceId") || "");
    const title = String(form.get("title") || "").trim();
    const caption = String(form.get("caption") || "").trim();
    const tagsRaw = String(form.get("tags") || "");

    if (!file || !workspaceId) {
      return jsonError("Thiếu tệp hình ảnh hoặc không gian đích.");
    }

    const ext = path.extname(file.name).toLowerCase() || ".webp";
    if (!ALLOWED_EXT.has(ext)) {
      return jsonError("Chỉ hỗ trợ ảnh PNG, JPG, WEBP, GIF, SVG.");
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > 10 * 1024 * 1024) {
      return jsonError("Ảnh vượt quá giới hạn 10MB.");
    }

    const mimeType = file.type || EXT_TO_MIME[ext] || "image/webp";
    const rawBuf = Buffer.from(bytes);
    const safeData =
      ext === ".svg" || mimeType.includes("svg")
        ? Buffer.from(sanitizeSvgContent(rawBuf.toString("utf8")), "utf8")
        : rawBuf;
    const saved = await saveMediaBlob({
      workspaceId,
      fileName: file.name || `upload${ext}`,
      mimeType,
      data: safeData
    });

    const cdnBase = (process.env.NEXT_PUBLIC_MEDIA_CDN_URL || "").replace(/\/$/, "");
    const publicUrl = cdnBase
      ? `${cdnBase}/api/media/file/${saved.id}`
      : `/api/media/file/${saved.id}`;

    const asset = await upsertMediaAsset({
      workspaceId,
      title: title || file.name.replace(/\.[^.]+$/, ""),
      thumbUrl: publicUrl,
      fullUrl: publicUrl,
      tags: tagsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      caption,
      source: "upload"
    });

    return jsonOk(
      {
        asset,
        url: publicUrl,
        blobId: saved.id,
        sizeBytes: saved.sizeBytes,
        mimeType: saved.mimeType
      },
      201
    );
  } catch (err) {
    return jsonError(`Lỗi tải ảnh: ${(err as Error).message}`, 500);
  }
}
