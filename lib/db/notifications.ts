import { supabase } from "./client";

export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  external_id: string | null;
  title: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

export async function getUserNotifications(
  userId: string,
  options?: { unreadOnly?: boolean }
): Promise<UserNotification[]> {
  let q = supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", userId);

  if (options?.unreadOnly) {
    q = q.eq("read", false);
  }

  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as UserNotification[];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("user_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("id");

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function dismissNotification(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("id");

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
