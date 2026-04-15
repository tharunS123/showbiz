import { tmdbFetch } from "./client";
import { endpoints } from "./endpoints";
import { normalizeSearchResult } from "./normalize";
import { TTL } from "@/lib/cache/ttl";
import type { TMDbPagedResponse, TMDbSearchResult, Title } from "./types";

export async function searchMulti(
  query: string,
  page = 1
): Promise<{ results: Title[]; totalPages: number; totalResults: number }> {
  if (!query.trim()) {
    return { results: [], totalPages: 0, totalResults: 0 };
  }

  const data = await tmdbFetch<TMDbPagedResponse<TMDbSearchResult>>(
    endpoints.searchMulti,
    { query, page: String(page) },
    TTL.SEARCH
  );

  const results = data.results
    .map(normalizeSearchResult)
    .filter((r): r is Title => r !== null);

  return {
    results,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}
