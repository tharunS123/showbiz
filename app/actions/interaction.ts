"use server";

import { getCurrentUser } from "@/lib/auth";
import { logInteraction } from "@/lib/db/interactions";
import type { EventType, MediaType } from "@/lib/db/types";

export async function trackView(
  externalId: string,
  mediaType: "movie" | "tv"
) {
  const user = await getCurrentUser();
  if (!user) return;

  await logInteraction(user.id, "view_title" as EventType, {
    externalId,
    mediaType: mediaType as MediaType,
  });
}

export async function trackSearch(query: string) {
  const user = await getCurrentUser();
  if (!user) return;

  await logInteraction(user.id, "search" as EventType, {
    context: { query },
  });
}
