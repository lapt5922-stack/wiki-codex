import { describe, expect, it } from "vitest";
import { getMediaBlobById, saveMediaBlob } from "@/db/media-blob-store";

describe("Dual-Persistence Media Blob Store", () => {
  it("saves and retrieves uploaded image bytes reliably", async () => {
    const sample = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]);
    const saved = await saveMediaBlob({
      workspaceId: "ws-aethelgard",
      fileName: "test-emblem.png",
      mimeType: "image/png",
      data: sample
    });

    expect(saved.id).toMatch(/^mblob-/);
    expect(saved.sizeBytes).toBe(sample.byteLength);

    const loaded = await getMediaBlobById(saved.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.mimeType).toBe("image/png");
    expect(loaded?.data.equals(sample)).toBe(true);
  });

  it("rejects invalid / path-traversal IDs safely", async () => {
    expect(await getMediaBlobById("../../etc/passwd")).toBeNull();
    expect(await getMediaBlobById("bad/id\\name")).toBeNull();
  });
});
