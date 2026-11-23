import { NextResponse } from "next/server";
import { getMediaBlobById } from "@/db/media-blob-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const blob = await getMediaBlobById(id);
  if (!blob) {
    return NextResponse.json({ error: "Không tìm thấy tệp ảnh." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(blob.data), {
    status: 200,
    headers: {
      "Content-Type": blob.mimeType || "image/webp",
      "Content-Length": String(blob.data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: `"${blob.id}"`
    }
  });
}
