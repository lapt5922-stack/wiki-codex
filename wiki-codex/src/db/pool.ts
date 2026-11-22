import { Pool } from "pg";

let globalPool: Pool | null = null;

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

export function getPostgresPool(): Pool | null {
  if (!isPostgresConfigured()) return null;
  if (globalPool) return globalPool;

  const url = process.env.DATABASE_URL!.trim();
  const useSsl =
    process.env.DATABASE_SSL === "true" ||
    url.includes("sslmode=require") ||
    url.includes("render.com") ||
    url.includes("neon.tech") ||
    url.includes("supabase.co") ||
    url.includes("supabase.com");

  globalPool = new Pool({
    connectionString: url,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000
  });

  return globalPool;
}
