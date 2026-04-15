import { tmdbFetch } from "./client";
import { endpoints } from "./endpoints";
import { normalizeMovie, normalizeCast, normalizeCrew } from "./normalize";
import { TTL } from "@/lib/cache/ttl";
import type { TMDbMovie, TMDbCreditsResponse, TMDbPagedResponse, Title, Credit } from "./types";
import { unstable_cache } from "next/cache";

export const getMovie = unstable_cache(
  async (id: string): Promise<Title | null> => {
    try {
      const [movieData, videosData] = await Promise.all([
        tmdbFetch<TMDbMovie>(endpoints.movie(id), undefined, TTL.DETAIL),
        tmdbFetch<{ results: TMDbMovie["videos"] extends { results: infer R } ? R : never }>(
          endpoints.movieVideos(id),
          undefined,
          TTL.DETAIL
        ).catch(() => ({ results: [] })),
      ]);
      const movie = { ...movieData, videos: { results: videosData.results as TMDbMovie["videos"] extends { results: infer R } ? R : never } };
      return normalizeMovie(movie as TMDbMovie);
    } catch {
      return null;
    }
  },
  ["movie-detail"],
  { revalidate: TTL.DETAIL }
);

export const getMovieCredits = unstable_cache(
  async (id: string): Promise<{ cast: Credit[]; crew: Credit[] } | null> => {
    try {
      const data = await tmdbFetch<TMDbCreditsResponse>(
        endpoints.movieCredits(id),
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
  ["movie-credits"],
  { revalidate: TTL.CREDITS }
);

export const getSimilarMovies = unstable_cache(
  async (id: string): Promise<Title[]> => {
    try {
      const data = await tmdbFetch<TMDbPagedResponse<TMDbMovie>>(
        endpoints.movieSimilar(id),
        undefined,
        TTL.SIMILAR
      );
      return data.results.slice(0, 12).map((m) => normalizeMovie(m));
    } catch {
      return [];
    }
  },
  ["movie-similar"],
  { revalidate: TTL.SIMILAR }
);
