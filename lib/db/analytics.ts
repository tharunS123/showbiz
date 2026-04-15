import { supabase } from "@/lib/db/client";

export async function getEventCountsByType() {
  const { data, error } = await supabase
    .from("interaction_events")
    .select("event_type");

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.event_type] = (counts[row.event_type] ?? 0) + 1;
  }
  return counts;
}

export async function getDailyActiveUsers(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("interaction_events")
    .select("user_id, timestamp")
    .gte("timestamp", since.toISOString());

  if (error) throw error;

  const byDay: Record<string, Set<string>> = {};
  for (const row of data ?? []) {
    const day = row.timestamp.slice(0, 10);
    if (!byDay[day]) byDay[day] = new Set();
    byDay[day].add(row.user_id);
  }

  return Object.entries(byDay)
    .map(([date, users]) => ({ date, count: users.size }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getRecClickThroughRate() {
  const { data, error } = await supabase
    .from("interaction_events")
    .select("event_type")
    .in("event_type", ["rec_click", "rec_impression"]);

  if (error) throw error;

  let clicks = 0;
  let impressions = 0;
  for (const row of data ?? []) {
    if (row.event_type === "rec_click") clicks++;
    if (row.event_type === "rec_impression") impressions++;
  }

  return impressions === 0 ? 0 : clicks / impressions;
}

export async function getListDepthAverages() {
  const { data, error } = await supabase
    .from("list_items")
    .select("user_id, list_type");

  if (error) throw error;

  const userListCounts: Record<string, Record<string, number>> = {};
  for (const row of data ?? []) {
    if (!userListCounts[row.list_type]) userListCounts[row.list_type] = {};
    userListCounts[row.list_type][row.user_id] =
      (userListCounts[row.list_type][row.user_id] ?? 0) + 1;
  }

  const averages: Record<string, number> = {};
  for (const [listType, users] of Object.entries(userListCounts)) {
    const counts = Object.values(users);
    averages[listType] =
      counts.reduce((sum, c) => sum + c, 0) / counts.length;
  }

  return averages;
}

export async function getTopRatedItems(limit: number) {
  const { data, error } = await supabase
    .from("list_items")
    .select("external_id, media_type, title, poster_path, rating")
    .not("rating", "is", null);

  if (error) throw error;

  const grouped: Record<
    string,
    { title: string; media_type: string; ratings: number[] }
  > = {};

  for (const row of data ?? []) {
    const key = `${row.media_type}:${row.external_id}`;
    if (!grouped[key]) {
      grouped[key] = {
        title: row.title,
        media_type: row.media_type,
        ratings: [],
      };
    }
    grouped[key].ratings.push(row.rating);
  }

  return Object.entries(grouped)
    .map(([, item]) => ({
      title: item.title,
      media_type: item.media_type,
      avg_rating:
        item.ratings.reduce((s, r) => s + r, 0) / item.ratings.length,
      rating_count: item.ratings.length,
    }))
    .sort((a, b) => b.avg_rating - a.avg_rating)
    .slice(0, limit);
}

export async function getTotalActiveUsers() {
  const { data, error } = await supabase.from("users").select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

function toIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getSignupCohortRetention(weeks = 8) {
  const now = new Date();
  const cohortStart = new Date(now);
  cohortStart.setDate(cohortStart.getDate() - weeks * 7);

  const [{ data: users, error: usersError }, { data: events, error: eventsError }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, created_at")
        .gte("created_at", cohortStart.toISOString()),
      supabase
        .from("interaction_events")
        .select("user_id, timestamp")
        .gte("timestamp", cohortStart.toISOString()),
    ]);

  if (usersError) throw usersError;
  if (eventsError) throw eventsError;

  const eventsByUser = new Map<string, Date[]>();
  for (const event of events ?? []) {
    const arr = eventsByUser.get(event.user_id) ?? [];
    arr.push(new Date(event.timestamp));
    eventsByUser.set(event.user_id, arr);
  }

  const cohorts = new Map<
    string,
    { total: number; retainedDay7: number; retainedDay30: number }
  >();

  for (const user of users ?? []) {
    const createdAt = new Date(user.created_at);
    const cohortLabel = toIsoDay(createdAt).slice(0, 7);

    const bucket = cohorts.get(cohortLabel) ?? {
      total: 0,
      retainedDay7: 0,
      retainedDay30: 0,
    };
    bucket.total += 1;

    const userEvents = eventsByUser.get(user.id) ?? [];
    const day7Start = new Date(createdAt);
    day7Start.setDate(day7Start.getDate() + 7);
    const day7End = new Date(createdAt);
    day7End.setDate(day7End.getDate() + 14);

    const day30Start = new Date(createdAt);
    day30Start.setDate(day30Start.getDate() + 30);
    const day30End = new Date(createdAt);
    day30End.setDate(day30End.getDate() + 37);

    if (userEvents.some((d) => d >= day7Start && d < day7End)) {
      bucket.retainedDay7 += 1;
    }
    if (userEvents.some((d) => d >= day30Start && d < day30End)) {
      bucket.retainedDay30 += 1;
    }

    cohorts.set(cohortLabel, bucket);
  }

  return [...cohorts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cohort, stats]) => ({
      cohort,
      users: stats.total,
      day7Retention:
        stats.total === 0 ? 0 : Number(((stats.retainedDay7 / stats.total) * 100).toFixed(1)),
      day30Retention:
        stats.total === 0 ? 0 : Number(((stats.retainedDay30 / stats.total) * 100).toFixed(1)),
    }));
}
