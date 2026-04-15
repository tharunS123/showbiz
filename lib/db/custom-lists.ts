import { supabase } from "./client";
import type { MediaType } from "./types";

export interface CustomList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface CustomListItem {
  id: string;
  list_id: string;
  external_id: string;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  note: string | null;
  ordering: number;
  created_at: string;
}

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

export async function createCustomList(
  userId: string,
  name: string,
  description?: string,
  isPublic = false
): Promise<CustomList> {
  const slug = generateSlug(name);
  const { data, error } = await supabase
    .from("custom_lists")
    .insert({
      user_id: userId,
      name,
      description: description ?? null,
      is_public: isPublic,
      slug,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserCustomLists(userId: string): Promise<CustomList[]> {
  const { data, error } = await supabase
    .from("custom_lists")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getCustomListBySlug(slug: string): Promise<CustomList | null> {
  const { data, error } = await supabase
    .from("custom_lists")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCustomListById(listId: string): Promise<CustomList | null> {
  const { data, error } = await supabase
    .from("custom_lists")
    .select("*")
    .eq("id", listId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCustomListItems(listId: string): Promise<CustomListItem[]> {
  const { data, error } = await supabase
    .from("custom_list_items")
    .select("*")
    .eq("list_id", listId)
    .order("ordering", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addCustomListItem(
  listId: string,
  externalId: string,
  mediaType: MediaType,
  meta: { title?: string; posterPath?: string | null; note?: string } = {}
): Promise<void> {
  const { data: maxOrder } = await supabase
    .from("custom_list_items")
    .select("ordering")
    .eq("list_id", listId)
    .order("ordering", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxOrder?.ordering ?? -1) + 1;

  const { error } = await supabase.from("custom_list_items").upsert(
    {
      list_id: listId,
      external_id: externalId,
      media_type: mediaType,
      title: meta.title ?? "",
      poster_path: meta.posterPath ?? null,
      note: meta.note ?? null,
      ordering: nextOrder,
    },
    { onConflict: "list_id,external_id,media_type" }
  );

  if (error) throw error;

  await supabase
    .from("custom_lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", listId);
}

export async function removeCustomListItem(
  listId: string,
  externalId: string,
  mediaType: MediaType
): Promise<void> {
  const { error } = await supabase
    .from("custom_list_items")
    .delete()
    .eq("list_id", listId)
    .eq("external_id", externalId)
    .eq("media_type", mediaType);

  if (error) throw error;
}

export async function deleteCustomList(listId: string): Promise<void> {
  const { error } = await supabase
    .from("custom_lists")
    .delete()
    .eq("id", listId);

  if (error) throw error;
}

export async function updateCustomList(
  listId: string,
  updates: { name?: string; description?: string; is_public?: boolean }
): Promise<void> {
  const { error } = await supabase
    .from("custom_lists")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", listId);

  if (error) throw error;
}
