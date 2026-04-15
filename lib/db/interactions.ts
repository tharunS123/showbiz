import { supabase } from "./client";
import type { EventType, MediaType, InteractionEvent } from "./types";

export async function logInteraction(
  userId: string,
  eventType: EventType,
  opts?: {
    externalId?: string;
    mediaType?: MediaType;
    context?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from("interaction_events").insert({
    user_id: userId,
    event_type: eventType,
    external_id: opts?.externalId ?? null,
    media_type: opts?.mediaType ?? null,
    context: opts?.context ?? null,
  });

  if (error) throw error;
}

export async function getUserSignals(
  userId: string,
  since: Date
): Promise<InteractionEvent[]> {
  const { data, error } = await supabase
    .from("interaction_events")
    .select("*")
    .eq("user_id", userId)
    .gte("timestamp", since.toISOString())
    .order("timestamp", { ascending: false })
    .limit(500);

  if (error) throw error;
  return data ?? [];
}
