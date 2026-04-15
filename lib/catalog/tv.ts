import { tmdbFetch } from "./client";
import { endpoints } from "./endpoints";
import { normalizeTv, normalizeCast, normalizeCrew } from "./normalize";
import { TTL } from "@/lib/cache/ttl";
import type { TMDbTv, TMDbCreditsResponse, TMDbPagedResponse, TMDbVideo, Title, Credit } from "./types";
import { unstable_cache } from "next/cache";

export const getTv = unstable_cache(
  async (id: string): Promise<Title | null> => {
    try {
      const [tvData, videosData] = await Promise.all([
        tmdbFetch<TMDbTv>(endpoints.tv(id), undefined, TTL.DETAIL),
        tmdbFetch<{ results: TMDbVideo[] }>(
          endpoints.tvVideos(id),
          undefined,
          TTL.DETAIL
        ).catch(() => ({ results: [] as TMDbVideo[] })),
      ]);
      const tv: TMDbTv = { ...tvData, videos: { results: videosData.results } };
      return normalizeTv(tv);
    } catch {
      return null;
    }
  },
  ["tv-detail"],
  { revalidate: TTL.DETAIL }
);

export const getTvCredits = unstable_cache(
  async (id: string): Promise<{ cast: Credit[]; crew: Credit[] } | null> => {
    try {
      const data = await tmdbFetch<TMDbCreditsResponse>(
        endpoints.tvCredits(id),
        undefined,
        TTL.CREDITS
      );
      return {
        cast: normalizeCast(data.cast).slice(0, 20),
        crew: normalizeCrew(data.crew),
      };
    } catch {
      return null;
    }
  },
  ["tv-credits"],
  { revalidate: TTL.CREDITS }
);

export const getSimilarShows = unstable_cache(
  async (id: string): Promise<Title[]> => {
    try {
      const data = await tmdbFetch<TMDbPagedResponse<TMDbTv>>(
        endpoints.tvSimilar(id),
        undefined,
        TTL.SIMILAR
      );
      return data.results.slice(0, 12).map((t) => normalizeTv(t));
    } catch {
      return [];
    }
  },
  ["tv-similar"],
  { revalidate: TTL.SIMILAR }
);
