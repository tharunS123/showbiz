import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/user";
import { generateRecs } from "@/lib/recs";
import { sendAlert } from "@/lib/alerts";

export async function GET(req: NextRequest) {
  const userIdParam = req.nextUrl.searchParams.get("userId");

  let userId: string;

  if (userIdParam) {
    userId = userIdParam;
  } else {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    userId = user.id;
  }

  try {
    const result = await generateRecs(userId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[recs] generation failed:", err);
    await sendAlert({
      source: "api/recs",
      message: "Recommendation generation failed",
      severity: "error",
      meta: {
        userId,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return NextResponse.json(
      { items: [], recsVersion: "v1-error" },
      { status: 200 }
    );
  }
}
