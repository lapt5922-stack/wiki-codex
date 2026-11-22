import { NextResponse } from "next/server";
import type { SessionUser } from "@/types/codex";
import { getSessionFromCookieHeader } from "./auth";
import { canEditContent, canManageWorkspace, canPublishPublic } from "./rbac";

export function getRequestUser(request: Request): SessionUser {
  return getSessionFromCookieHeader(request.headers.get("cookie"));
}

export function jsonOk<T>(data: T, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(data, { status, headers });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function requireEditor(user: SessionUser): NextResponse | null {
  if (!canEditContent(user.role)) {
    return jsonError(
      "Người xem khách không có quyền chỉnh sửa. Vui lòng đăng nhập Biên tập viên hoặc Quản trị viên.",
      403
    );
  }
  return null;
}

export function requireAdmin(user: SessionUser): NextResponse | null {
  if (!canManageWorkspace(user.role)) {
    return jsonError("Thao tác này chỉ dành cho Quản trị viên (Admin).", 403);
  }
  return null;
}

export function requirePublisher(user: SessionUser): NextResponse | null {
  if (!canPublishPublic(user.role)) {
    return jsonError("Bạn không có quyền xuất bản lên Web Công khai.", 403);
  }
  return null;
}
