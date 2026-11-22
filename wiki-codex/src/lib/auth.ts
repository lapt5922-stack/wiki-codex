import crypto from "crypto";
import type { SessionUser, UserRole } from "@/types/codex";

export const SESSION_COOKIE_NAME = "wiki_codex_session";

const AUTH_SECRET =
  process.env.AUTH_SECRET || "wiki-codex-dev-secret-change-me-in-production-2026";

export function hashPassword(password: string, salt?: string): string {
  const usedSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, usedSalt, 32).toString("hex");
  return `${usedSalt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;
  const actualHex = crypto.scryptSync(password, salt, 32).toString("hex");
  const a = Buffer.from(actualHex, "hex");
  const b = Buffer.from(expectedHex, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function signSessionToken(user: SessionUser): string {
  const payload = Buffer.from(
    JSON.stringify({
      ...user,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    }),
    "utf8"
  ).toString("base64url");

  const sig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;

  const expectedSig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payload)
    .digest("base64url");

  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser & {
      exp?: number;
    };
    if (parsed.exp && Date.now() > parsed.exp) return null;
    const validRoles: UserRole[] = ["admin", "editor", "guest"];
    if (!validRoles.includes(parsed.role)) return null;
    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name,
      role: parsed.role
    };
  } catch {
    return null;
  }
}

export const DEFAULT_GUEST_USER: SessionUser = {
  id: "guest-public",
  email: "guest@codex.local",
  name: "Người xem khách",
  role: "guest"
};

export function getSessionFromCookieHeader(cookieHeader: string | null): SessionUser {
  if (!cookieHeader) return DEFAULT_GUEST_USER;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      const value = decodeURIComponent(c.slice(SESSION_COOKIE_NAME.length + 1));
      const user = verifySessionToken(value);
      if (user) return user;
    }
  }
  return DEFAULT_GUEST_USER;
}
