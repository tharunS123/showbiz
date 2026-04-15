import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/client";
import { cachePing, isRedisConfigured } from "@/lib/cache/redis";

async function checkDatabase() {
  try {
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) return { status: "down", error: error.message };
    return { status: "up" };
  } catch (err) {
    return {
      status: "down",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkRedis() {
  if (!isRedisConfigured()) {
    return { status: "skipped", reason: "not_configured" };
  }

  const ok = await cachePing();
  return ok ? { status: "up" } : { status: "down", error: "ping_failed" };
}

function checkTmdb() {
  return process.env.TMDB_API_KEY
    ? { status: "up" }
    : { status: "down", error: "missing_api_key" };
}

export async function GET() {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  const tmdb = checkTmdb();

  const dependencies = { database, redis, tmdb };
  const hasDown = Object.values(dependencies).some((d) => d.status === "down");

  return NextResponse.json(
    {
      status: hasDown ? "degraded" : "ok",
      timestamp: new Date().toISOString(),
      dependencies,
    },
    { status: hasDown ? 503 : 200 }
  );
}
