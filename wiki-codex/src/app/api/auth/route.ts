import { NextResponse } from "next/server";
import { loadState, getStorageInfo } from "@/db/repository";
import {
  DEFAULT_GUEST_USER,
  SESSION_COOKIE_NAME,
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
    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });
    return res;
  }

  const state = await loadState();

  if (body.action === "switch_demo_role" && body.role) {
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
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });
    return res;
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const account = state.users.find((u) => u.email.toLowerCase() === email);
  if (!account || !account.passwordHash || !verifyPassword(password, account.passwordHash)) {
    return jsonError("Email hoặc mật khẩu không chính xác.", 401);
  }

  const sessionUser = {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role
  };
  const token = signSessionToken(sessionUser);
  const res = NextResponse.json({ user: sessionUser });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60
  });
  return res;
}
