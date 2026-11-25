import { NextResponse } from "next/server";
import { loadState, getStorageInfo } from "@/db/repository";
import {
  DEFAULT_GUEST_USER,
  SESSION_COOKIE_NAME,
  buildSessionCookieOptions,
  checkLoginRateLimit,
  clearLoginFailures,
  recordLoginFailure,
  signSessionToken,
  verifyPassword
} from "@/lib/auth";
import { getRequestUser, jsonError, jsonOk } from "@/lib/api-helpers";
import type { UserRole } from "@/types/codex";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  return jsonOk({
    user,
    storage: getStorageInfo()
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    action?: "login" | "logout" | "switch_demo_role";
    email?: string;
    password?: string;
    role?: UserRole;
  };

  if (body.action === "logout") {
    const res = NextResponse.json({ user: DEFAULT_GUEST_USER });
    res.cookies.set(SESSION_COOKIE_NAME, "", buildSessionCookieOptions(0));
    return res;
  }

  const state = await loadState();

  if (body.action === "switch_demo_role" && body.role) {
    if (process.env.DISABLE_DEMO_ROLE_SWITCH === "true") {
      return jsonError("Chế độ chuyển vai trò nhanh đã bị vô hiệu hóa trên môi trường này.", 403);
    }
    const demoUser = state.users.find((u) => u.role === body.role);
    if (!demoUser) return jsonError("Vai trò không hợp lệ.", 400);
    const sessionUser = {
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      role: demoUser.role
    };
    const token = signSessionToken(sessionUser);
    const res = NextResponse.json({ user: sessionUser });
    res.cookies.set(SESSION_COOKIE_NAME, token, buildSessionCookieOptions(7 * 24 * 60 * 60));
    return res;
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const forwardedIp = (request.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const rateKey = `${forwardedIp}::${email || "unknown"}`;

  const limitCheck = checkLoginRateLimit(rateKey);
  if (!limitCheck.allowed) {
    return jsonError(
      `Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau ${limitCheck.retryAfterSeconds} giây.`,
      429
    );
  }

  const account = state.users.find((u) => u.email.toLowerCase() === email);
  if (!account || !account.passwordHash || !verifyPassword(password, account.passwordHash)) {
    recordLoginFailure(rateKey);
    return jsonError("Email hoặc mật khẩu không chính xác.", 401);
  }

  clearLoginFailures(rateKey);

  const sessionUser = {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role
  };
  const token = signSessionToken(sessionUser);
  const res = NextResponse.json({ user: sessionUser });
  res.cookies.set(SESSION_COOKIE_NAME, token, buildSessionCookieOptions(7 * 24 * 60 * 60));
  return res;
}
