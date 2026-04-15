import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/user";
import { getUserList, addListItem, removeListItem } from "@/lib/db/list";
import { logInteraction } from "@/lib/db/interactions";
import { listMutationLimiter } from "@/lib/rate-limit";
import { z } from "zod/v4";
import type { MediaType, ListType, EventType } from "@/lib/db/types";

const AddSchema = z.object({
  externalId: z.string().min(1),
  mediaType: z.enum(["movie", "tv"]),
  listType: z.enum(["watchlist", "favorite", "seen"]),
  title: z.string().optional(),
  posterPath: z.string().nullable().optional(),
});

const RemoveSchema = z.object({
  externalId: z.string().min(1),
  mediaType: z.enum(["movie", "tv"]),
  listType: z.enum(["watchlist", "favorite", "seen"]),
});

async function resolveUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return getUserByClerkId(clerkId);
}

export async function GET(req: NextRequest) {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type") as ListType | null;
  if (!type || !["watchlist", "favorite", "seen"].includes(type)) {
    return NextResponse.json({ error: "Invalid list type" }, { status: 400 });
  }

  const items = await getUserList(user.id, type);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = listMutationLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } }
    );
  }

  const body = await req.json();
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const { externalId, mediaType, listType, title, posterPath } = parsed.data;
  await addListItem(user.id, externalId, mediaType as MediaType, listType as ListType, {
    title,
    posterPath: posterPath ?? null,
  });

  const eventMap: Record<string, EventType> = {
    watchlist: "add_watchlist",
    favorite: "favorite",
    seen: "mark_seen",
  };
  await logInteraction(user.id, eventMap[listType], {
    externalId,
    mediaType: mediaType as MediaType,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = listMutationLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } }
    );
  }

  const body = await req.json();
  const parsed = RemoveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const { externalId, mediaType, listType } = parsed.data;
  await removeListItem(user.id, externalId, mediaType as MediaType, listType as ListType);

  const eventMap: Record<string, EventType> = {
    watchlist: "remove_watchlist",
    favorite: "unfavorite",
    seen: "unmark_seen",
  };
  await logInteraction(user.id, eventMap[listType], {
    externalId,
    mediaType: mediaType as MediaType,
  });

  return NextResponse.json({ success: true });
}
