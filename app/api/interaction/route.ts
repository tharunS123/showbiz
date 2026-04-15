import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/user";
import { logInteraction } from "@/lib/db/interactions";
import { z } from "zod/v4";
import type { EventType, MediaType } from "@/lib/db/types";

const InteractionSchema = z.object({
  eventType: z.enum([
    "view_title",
    "view_person",
    "search",
    "search_click",
    "rate_title",
    "note_title",
    "rec_impression",
    "rec_click",
    "rec_why_open",
  ]),
  externalId: z.string().optional(),
  mediaType: z.enum(["movie", "tv"]).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = InteractionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  await logInteraction(user.id, parsed.data.eventType as EventType, {
    externalId: parsed.data.externalId,
    mediaType: parsed.data.mediaType as MediaType | undefined,
    context: parsed.data.context as Record<string, unknown> | undefined,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
