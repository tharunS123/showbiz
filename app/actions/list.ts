"use server";

import { requireUser } from "@/lib/auth";
import { addListItem, removeListItem } from "@/lib/db/list";
import { logInteraction } from "@/lib/db/interactions";
import { revalidatePath } from "next/cache";
import type { MediaType, ListType, EventType } from "@/lib/db/types";

interface ToggleListItemInput {
  externalId: string;
  mediaType: "movie" | "tv";
  listType: "watchlist" | "favorite" | "seen";
  add: boolean;
  title: string;
  posterPath: string | null;
}

const addEventMap: Record<string, EventType> = {
  watchlist: "add_watchlist",
  favorite: "favorite",
  seen: "mark_seen",
};

const removeEventMap: Record<string, EventType> = {
  watchlist: "remove_watchlist",
  favorite: "unfavorite",
  seen: "unmark_seen",
};

export async function toggleListItem(input: ToggleListItemInput) {
  const user = await requireUser();

  if (input.add) {
    await addListItem(
      user.id,
      input.externalId,
      input.mediaType as MediaType,
      input.listType as ListType,
      { title: input.title, posterPath: input.posterPath }
    );
    await logInteraction(user.id, addEventMap[input.listType], {
      externalId: input.externalId,
      mediaType: input.mediaType as MediaType,
    });
  } else {
    await removeListItem(
      user.id,
      input.externalId,
      input.mediaType as MediaType,
      input.listType as ListType
    );
    await logInteraction(user.id, removeEventMap[input.listType], {
      externalId: input.externalId,
      mediaType: input.mediaType as MediaType,
    });
  }

  revalidatePath("/lists");
}
