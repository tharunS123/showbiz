import { supabase } from "./client";

export interface NotificationPreferences {
  user_id: string;
  new_season: boolean;
  marketing: boolean;
}

export async function getUserNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("user_notification_preferences")
    .select("user_id, new_season, marketing")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      user_id: userId,
      new_season: true,
      marketing: false,
    };
  }

  return data;
}

export async function upsertUserNotificationPreferences(
  userId: string,
  input: Partial<Pick<NotificationPreferences, "new_season" | "marketing">>
): Promise<NotificationPreferences> {
  const payload = {
    user_id: userId,
    new_season: input.new_season ?? true,
    marketing: input.marketing ?? false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_notification_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select("user_id, new_season, marketing")
    .single();

  if (error) throw error;
  return data;
}

export async function getNotificationPreferencesMap(
  userIds: string[]
): Promise<Map<string, NotificationPreferences>> {
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("user_notification_preferences")
    .select("user_id, new_season, marketing")
    .in("user_id", userIds);

  if (error) throw error;

  const map = new Map<string, NotificationPreferences>();
  for (const row of data ?? []) {
    map.set(row.user_id, row);
  }
  return map;
}
