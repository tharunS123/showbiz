import { supabase } from "@/lib/db/client";
import { getAllUserListExternalIds } from "@/lib/db/list";
import { getUserSignals as getInteractions } from "@/lib/db/interactions";
import type { UserSignals, RatedItem } from "./types";

export async function buildUserSignals(userId: string): Promise<UserSignals> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

   const [favResult, seenIds, , recentFavResult, ratedResult] = await Promise.all([
    supabase
      .from("list_items")
      .select("external_id, media_type")
      .eq("user_id", userId)
      .eq("list_type", "favorite"),
    getAllUserListExternalIds(userId, "seen"),
    getInteractions(userId, thirtyDaysAgo),
    supabase
      .from("list_items")
      .select("external_id")
      .eq("user_id", userId)
      .in("list_type", ["favorite", "seen"])
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("list_items")
      .select("external_id, media_type, rating")
      .eq("user_id", userId)
      .not("rating", "is", null),
  ]);

  const favorites = favResult.data ?? [];
  const recentFavs = recentFavResult.data ?? [];
   const ratedItems: RatedItem[] = (ratedResult.data ?? []).map((r) => ({
     externalId: r.external_id,
     mediaType: r.media_type as "movie" | "tv",
     rating: r.rating as number,
   }));

   const genreCounts = new Map<number, number>();
  const personCounts = new Map<string, number>();

  for (const fav of favorites) {
    try {
      const { getMovie } = await import("@/lib/catalog/movie");
      const { getTv } = await import("@/lib/catalog/tv");

      const title =
        fav.media_type === "movie"
          ? await getMovie(fav.external_id)
          : await getTv(fav.external_id);

      if (title) {
        for (const g of title.genres) {
          genreCounts.set(g.id, (genreCounts.get(g.id) ?? 0) + 1);
        }
      }
    } catch {
      // skip if catalog fetch fails
    }
  }

  const favoriteGenreIds = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const topPersonIds = [...personCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const ratingGenreWeights = new Map<number, number>();
  for (const rated of ratedItems) {
    try {
      const { getMovie } = await import("@/lib/catalog/movie");
      const { getTv } = await import("@/lib/catalog/tv");

      const title =
        rated.mediaType === "movie"
          ? await getMovie(rated.externalId)
          : await getTv(rated.externalId);

      if (title) {
        const weight = (rated.rating - 3) / 2;
        for (const g of title.genres) {
          const current = ratingGenreWeights.get(g.id) ?? 0;
          ratingGenreWeights.set(g.id, current + weight);
        }
      }
    } catch {
      // skip if catalog fetch fails
    }
  }

  return {
    userId,
    favoriteGenreIds,
    topPersonIds,
    recentTitleIds: recentFavs.map((f) => f.external_id),
    seenExternalIds: seenIds,
    recentRecIds: new Set(),
    ratedItems,
    ratingGenreWeights,
  };
}
