import { supabase } from "./client";

export interface UserPreferences {
  id: string;
  user_id: string;
  excluded_genres: number[];
  max_content_rating: string | null;
  hide_spoilers: boolean;
  updated_at: string;
}

const DEFAULT_PREFERENCES: Omit<UserPreferences, "id" | "user_id" | "updated_at"> = {
  excluded_genres: [],
  max_content_rating: null,
  hide_spoilers: true,
};

export async function getUserPreferences(
  userId: string
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      id: "",
      user_id: userId,
      updated_at: new Date().toISOString(),
      ...DEFAULT_PREFERENCES,
    };
  }

  return data;
}

export async function updateUserPreferences(
  userId: string,
  updates: {
    excluded_genres?: number[];
    max_content_rating?: string | null;
    hide_spoilers?: boolean;
  }
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
