import { supabase } from "./client";
import type { MediaType, ListType, ListItem } from "./types";

export async function getUserList(
  userId: string,
  listType: ListType
): Promise<ListItem[]> {
  const { data, error } = await supabase
    .from("list_items")
    .select("*")
    .eq("user_id", userId)
    .eq("list_type", listType)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addListItem(
  userId: string,
  externalId: string,
  mediaType: MediaType,
  listType: ListType,
  meta: { title?: string; posterPath?: string | null } = {}
) {
  const { error } = await supabase.from("list_items").upsert(
    {
      user_id: userId,
      external_id: externalId,
      media_type: mediaType,
      list_type: listType,
      title: meta.title ?? "",
      poster_path: meta.posterPath ?? null,
    },
    { onConflict: "user_id,external_id,media_type,list_type" }
  );

  if (error) throw error;
}

export async function removeListItem(
  userId: string,
  externalId: string,
  mediaType: MediaType,
  listType: ListType
) {
  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("user_id", userId)
    .eq("external_id", externalId)
    .eq("media_type", mediaType)
    .eq("list_type", listType);

  if (error) throw error;
}

export async function getUserListStatus(
  userId: string,
  externalId: string,
  mediaType: MediaType
) {
  const { data, error } = await supabase
    .from("list_items")
    .select("list_type")
    .eq("user_id", userId)
    .eq("external_id", externalId)
    .eq("media_type", mediaType);

  if (error) throw error;

  const types = (data ?? []).map((r) => r.list_type);
  return {
    watchlist: types.includes("watchlist"),
    favorite: types.includes("favorite"),
    seen: types.includes("seen"),
  };
}

export async function updateListItemRating(
  userId: string,
  externalId: string,
  mediaType: MediaType,
  listType: ListType,
  rating: number | null,
  note: string | null
) {
  const { error } = await supabase
    .from("list_items")
    .update({ rating, note })
    .eq("user_id", userId)
    .eq("external_id", externalId)
    .eq("media_type", mediaType)
    .eq("list_type", listType);

  if (error) throw error;
}

export async function getListItemRating(
  userId: string,
  externalId: string,
  mediaType: MediaType
): Promise<{ rating: number | null; note: string | null } | null> {
  const { data, error } = await supabase
    .from("list_items")
    .select("rating, note")
    .eq("user_id", userId)
    .eq("external_id", externalId)
    .eq("media_type", mediaType)
    .not("rating", "is", null)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAllUserListExternalIds(
  userId: string,
  listType: ListType
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("list_items")
    .select("external_id")
    .eq("user_id", userId)
    .eq("list_type", listType);

  if (error) throw error;
  return new Set((data ?? []).map((r) => r.external_id));
}
