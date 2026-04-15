import { tmdbFetch } from "./client";
import { endpoints } from "./endpoints";
import { normalizeMovieListItem, normalizeTvListItem } from "./normalize";
import { TTL } from "@/lib/cache/ttl";
import type { TMDbMovie, TMDbTv, TMDbPagedResponse, Title } from "./types";

export async function discoverByGenre(
  type: "movie" | "tv",
  genreIds: number[]
): Promise<Title[]> {
  if (genreIds.length === 0) return [];

  try {
    const params: Record<string, string> = {
      with_genres: genreIds.join(","),
      sort_by: "popularity.desc",
    };

    if (type === "movie") {
      const data = await tmdbFetch<TMDbPagedResponse<TMDbMovie>>(
        endpoints.discover("movie"),
        params,
        TTL.DISCOVER
      );
      return data.results.slice(0, 20).map(normalizeMovieListItem);
    }

    const data = await tmdbFetch<TMDbPagedResponse<TMDbTv>>(
      endpoints.discover("tv"),
      params,
      TTL.DISCOVER
    );
    return data.results.slice(0, 20).map(normalizeTvListItem);
  } catch {
    return [];
  }
}
