import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const usesPostgres = Boolean(process.env.DATABASE_URL);
  return NextResponse.json(
    {
      ok: true,
      status: "healthy",
      service: "wiki-codex",
      storage: usesPostgres ? "postgresql" : "local-json",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
