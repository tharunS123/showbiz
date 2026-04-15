import { NextRequest, NextResponse } from "next/server";
import { discoverByMood } from "@/lib/recs/mood";
import { searchLimiter } from "@/lib/rate-limit";
import { sendAlert } from "@/lib/alerts";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || !query.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
  const limit = searchLimiter.check(`mood:${ip}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) },
      }
    );
  }

  try {
    const result = await discoverByMood(query);
    return NextResponse.json(result);
  } catch (err) {
    await sendAlert({
      source: "api/mood",
      message: "Mood discovery failed",
      severity: "error",
      meta: {
        query,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return NextResponse.json(
      { error: "Discovery failed" },
      { status: 500 }
    );
  }
}
