import { tmdbFetch } from "./client";
import { endpoints } from "./endpoints";
import { normalizeMovieListItem, normalizeTvListItem } from "./normalize";
import { TTL } from "@/lib/cache/ttl";
import type { TMDbMovie, TMDbTv, TMDbPagedResponse, Title } from "./types";
import { unstable_cache } from "next/cache";

export const getTrending = unstable_cache(
  async (
    type: "movie" | "tv" | "all" = "all",
    window: "day" | "week" = "week"
  ): Promise<Title[]> => {
    try {
      const data = await tmdbFetch<TMDbPagedResponse<TMDbMovie & TMDbTv & { media_type?: string }>>(
        endpoints.trending(type, window),
        undefined,
        TTL.TRENDING
      );
      return data.results.slice(0, 20).map((item) => {
        const mediaType = type === "all"
          ? (item.media_type === "tv" ? "tv" : "movie")
          : type;
        if (mediaType === "tv") {
          return normalizeTvListItem(item as unknown as TMDbTv);
        }
        return normalizeMovieListItem(item as unknown as TMDbMovie);
      });
    } catch {
      return [];
    }
  },
  ["trending"],
  { revalidate: TTL.TRENDING }
);

export const getPopular = unstable_cache(
  async (type: "movie" | "tv"): Promise<Title[]> => {
    try {
      if (type === "movie") {
        const data = await tmdbFetch<TMDbPagedResponse<TMDbMovie>>(
          endpoints.popular("movie"),
          undefined,
          TTL.POPULAR
        );
        return data.results.slice(0, 20).map(normalizeMovieListItem);
      }
      const data = await tmdbFetch<TMDbPagedResponse<TMDbTv>>(
        endpoints.popular("tv"),
        undefined,
        TTL.POPULAR
      );
      return data.results.slice(0, 20).map(normalizeTvListItem);
    } catch {
      return [];
    }
  },
  ["popular"],
  { revalidate: TTL.POPULAR }
);

export const getTopRated = unstable_cache(
  async (type: "movie" | "tv"): Promise<Title[]> => {
    try {
      if (type === "movie") {
        const data = await tmdbFetch<TMDbPagedResponse<TMDbMovie>>(
          endpoints.topRated("movie"),
          undefined,
          TTL.POPULAR
        );
        return data.results.slice(0, 20).map(normalizeMovieListItem);
      }
      const data = await tmdbFetch<TMDbPagedResponse<TMDbTv>>(
        endpoints.topRated("tv"),
        undefined,
        TTL.POPULAR
      );
      return data.results.slice(0, 20).map(normalizeTvListItem);
    } catch {
      return [];
    }
  },
  ["top-rated"],
  { revalidate: TTL.POPULAR }
);
