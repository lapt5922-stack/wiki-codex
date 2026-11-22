import fs from "fs";
import path from "path";
import crypto from "crypto";
import { upsertMediaAsset } from "@/db/repository";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

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

    const ext = path.extname(file.name).toLowerCase() || ".png";
    if (!ALLOWED_EXT.has(ext)) {
      return jsonError("Chỉ hỗ trợ ảnh PNG, JPG, WEBP, GIF, SVG.");
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > 10 * 1024 * 1024) {
      return jsonError("Ảnh vượt quá giới hạn 10MB.");
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
    const fullPath = path.join(uploadDir, safeName);
    fs.writeFileSync(fullPath, Buffer.from(bytes));

    const cdnBase = (process.env.NEXT_PUBLIC_MEDIA_CDN_URL || "").replace(/\/$/, "");
    const publicUrl = cdnBase ? `${cdnBase}/uploads/${safeName}` : `/uploads/${safeName}`;

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

    return jsonOk({ asset }, 201);
  } catch (err) {
    return jsonError(`Lỗi tải ảnh: ${(err as Error).message}`, 500);
  }
}
