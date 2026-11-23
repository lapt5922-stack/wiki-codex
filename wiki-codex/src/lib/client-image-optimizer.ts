"use client";

export type ImageAspectPreset = "free" | "avatar" | "portrait" | "flag" | "cover";

const PRESET_CONFIG: Record<
  ImageAspectPreset,
  { maxWidth: number; maxHeight: number; aspect?: number }
> = {
  free: { maxWidth: 1600, maxHeight: 1600 },
  avatar: { maxWidth: 640, maxHeight: 640, aspect: 1 },
  portrait: { maxWidth: 900, maxHeight: 1200, aspect: 3 / 4 },
  flag: { maxWidth: 1200, maxHeight: 800, aspect: 3 / 2 },
  cover: { maxWidth: 1600, maxHeight: 900, aspect: 16 / 9 }
};

/**
 * Optimizes an image File on the client via Canvas (center-crop if aspect preset is chosen,
 * resize within bounds, and encode as WebP/JPEG) so uploads are fast and lightweight on mobile & desktop.
 * Animated GIFs and SVGs are passed through untouched.
 */
export async function optimizeImageForUpload(
  file: File,
  preset: ImageAspectPreset = "free",
  quality = 0.84
): Promise<File> {
  if (
    typeof window === "undefined" ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    return file;
  }

  try {
    const img = await loadImageFromFile(file);
    const cfg = PRESET_CONFIG[preset];

    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth || img.width;
    let sh = img.naturalHeight || img.height;

    if (cfg.aspect && sw > 0 && sh > 0) {
      const currentAspect = sw / sh;
      if (currentAspect > cfg.aspect) {
        const nextSw = Math.round(sh * cfg.aspect);
        sx = Math.round((sw - nextSw) / 2);
        sw = nextSw;
      } else if (currentAspect < cfg.aspect) {
        const nextSh = Math.round(sw / cfg.aspect);
        sy = Math.round((sh - nextSh) / 2);
        sh = nextSh;
      }
    }

    const scale = Math.min(1, cfg.maxWidth / sw, cfg.maxHeight / sh);
    const dw = Math.max(1, Math.round(sw * scale));
    const dh = Math.max(1, Math.round(sh * scale));

    const canvas = document.createElement("canvas");
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

    const blob =
      (await canvasToBlob(canvas, "image/webp", quality)) ||
      (await canvasToBlob(canvas, "image/jpeg", quality));
    if (!blob) return file;

    const ext = blob.type === "image/webp" ? ".webp" : ".jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}${ext}`, { type: blob.type });
  } catch {
    return file;
  }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), mime, quality);
  });
}

export async function uploadImageToVault(opts: {
  file: File;
  workspaceId: string;
  preset?: ImageAspectPreset;
  title?: string;
  caption?: string;
  tags?: string;
}): Promise<{ url: string; assetId?: string; sizeBytes?: number }> {
  const optimized = await optimizeImageForUpload(opts.file, opts.preset || "free");
  const form = new FormData();
  form.append("file", optimized);
  form.append("workspaceId", opts.workspaceId);
  if (opts.title) form.append("title", opts.title);
  if (opts.caption) form.append("caption", opts.caption);
  if (opts.tags) form.append("tags", opts.tags);

  const res = await fetch("/api/media/upload", {
    method: "POST",
    body: form
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Không thể tải ảnh lên máy chủ.");
  }
  const url = data.url || data.asset?.fullUrl || data.asset?.thumbUrl;
  if (!url) throw new Error("Máy chủ không trả về đường dẫn ảnh.");
  return {
    url,
    assetId: data.asset?.id,
    sizeBytes: data.sizeBytes
  };
}
