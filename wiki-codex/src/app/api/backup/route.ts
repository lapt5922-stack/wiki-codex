import { NextResponse } from "next/server";
import {
  createFullSystemBackup,
  listStoredBackups,
  loadStoredBackupById,
  restoreFullSystemBackup,
  type SystemBackupEnvelope
} from "@/lib/system-backup";
import { getRequestUser, jsonError, jsonOk, requireAdmin } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const denied = requireAdmin(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "true";
  const backupId = searchParams.get("backupId");

  if (download) {
    const envelope = backupId
      ? await loadStoredBackupById(backupId)
      : await createFullSystemBackup(user.name, "Tải xuống gói sao lưu toàn hệ thống", true);
    if (!envelope) return jsonError("Không tìm thấy bản sao lưu yêu cầu.", 404);

    return new NextResponse(JSON.stringify(envelope, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="aethel-codex-${envelope.backupId}.json"`
      }
    });
  }

  const info = await listStoredBackups();
  return jsonOk(info);
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireAdmin(user);
  if (denied) return denied;

  try {
    const body = await request.json();

    if (body.action === "create_snapshot") {
      const envelope = await createFullSystemBackup(
        user.name,
        String(body.note || "Sao lưu thủ công từ Trung tâm Quản trị"),
        true
      );
      const { stores: _omitLargePayload, ...meta } = envelope;
      return jsonOk({ snapshot: meta }, 201);
    }

    if (body.action === "restore_by_id" && body.backupId) {
      const stored = await loadStoredBackupById(String(body.backupId));
      if (!stored) return jsonError("Không tìm thấy bản chụp sao lưu.", 404);
      const result = await restoreFullSystemBackup(stored, user.name, true);
      return jsonOk(result);
    }

    if (body.action === "restore_envelope" && body.envelope) {
      const result = await restoreFullSystemBackup(
        body.envelope as SystemBackupEnvelope,
        user.name,
        body.createSafetyBackupFirst !== false
      );
      return jsonOk(result);
    }

    return jsonError("Hành động sao lưu/khôi phục không hợp lệ.", 400);
  } catch (err) {
    return jsonError((err as Error).message || "Lỗi khi xử lý sao lưu hệ thống.", 400);
  }
}
