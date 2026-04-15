import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/user";
import { updateListItemRating } from "@/lib/db/list";
import { logInteraction } from "@/lib/db/interactions";
import { listMutationLimiter } from "@/lib/rate-limit";
import { z } from "zod/v4";
import type { MediaType, ListType } from "@/lib/db/types";

const RateSchema = z.object({
  externalId: z.string().min(1),
  mediaType: z.enum(["movie", "tv"]),
  listType: z.enum(["watchlist", "favorite", "seen"]),
  rating: z.number().int().min(1).max(5).nullable(),
  note: z.string().max(500).nullable().optional(),
});

async function resolveUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return getUserByClerkId(clerkId);
}

export async function PUT(req: NextRequest) {
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = listMutationLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } }
    );
  }

  const body = await req.json();
  const parsed = RateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { externalId, mediaType, listType, rating, note } = parsed.data;
  await updateListItemRating(
    user.id,
    externalId,
    mediaType as MediaType,
    listType as ListType,
    rating,
    note ?? null
  );

  if (rating !== null) {
    await logInteraction(user.id, "rate_title", {
      externalId,
      mediaType: mediaType as MediaType,
      context: { listType, rating },
    });
  }

  if ((note ?? "").trim().length > 0) {
    await logInteraction(user.id, "note_title", {
      externalId,
      mediaType: mediaType as MediaType,
      context: { listType, noteLength: (note ?? "").trim().length },
    });
  }

  return NextResponse.json({ success: true });
}
