import { supabase } from "./client";
import type { User } from "./types";

export async function syncClerkUser(data: {
  clerkId: string;
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<User> {
  const { data: user, error } = await supabase
    .from("users")
    .upsert(
      {
        clerk_id: data.clerkId,
        email: data.email,
        name: data.name ?? null,
        image: data.image ?? null,
      },
      { onConflict: "clerk_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return user;
}

export async function getUserByClerkId(
  clerkId: string
): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteUserData(clerkId: string) {
  const user = await getUserByClerkId(clerkId);
  if (!user) return;

  await supabase
    .from("interaction_events")
    .delete()
    .eq("user_id", user.id);
  await supabase.from("list_items").delete().eq("user_id", user.id);
  await supabase.from("users").delete().eq("id", user.id);
}
