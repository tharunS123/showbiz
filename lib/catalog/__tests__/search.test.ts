import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchMulti } from "../search";
import { tmdbFetch } from "../client";
import { endpoints } from "../endpoints";
import { TTL } from "@/lib/cache/ttl";
import type { TMDbPagedResponse, TMDbSearchResult } from "../types";

vi.mock("../client", () => ({
  tmdbFetch: vi.fn(),
}));

const mockedFetch = tmdbFetch as ReturnType<typeof vi.fn>;

function makeSearchResult(
  overrides: Partial<TMDbSearchResult> = {}
): TMDbSearchResult {
  return {
    id: 1,
    media_type: "movie",
    title: "Inception",
    overview: "A mind-bending thriller",
    poster_path: "/inception.jpg",
    vote_average: 8.4,
    vote_count: 30000,
    release_date: "2010-07-16",
    ...overrides,
  };
}

function makePagedResponse(
  results: TMDbSearchResult[],
  overrides: Partial<TMDbPagedResponse<TMDbSearchResult>> = {}
): TMDbPagedResponse<TMDbSearchResult> {
  return {
    page: 1,
    results,
    total_pages: 1,
    total_results: results.length,
    ...overrides,
  };
}

describe("searchMulti", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty results for an empty query", async () => {
    const result = await searchMulti("");

    expect(result).toEqual({ results: [], totalPages: 0, totalResults: 0 });
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("returns empty results for a whitespace-only query", async () => {
    const result = await searchMulti("   ");

    expect(result).toEqual({ results: [], totalPages: 0, totalResults: 0 });
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("calls tmdbFetch with correct args and returns normalized results", async () => {
    const movie = makeSearchResult({
      id: 550,
      media_type: "movie",
      title: "Fight Club",
      release_date: "1999-10-15",
    });
    const tv = makeSearchResult({
      id: 1399,
      media_type: "tv",
      name: "Breaking Bad",
      title: undefined,
      release_date: undefined,
      first_air_date: "2008-01-20",
    });

    mockedFetch.mockResolvedValue(
      makePagedResponse([movie, tv], { total_pages: 3, total_results: 42 })
    );

    const result = await searchMulti("test query", 2);

    expect(mockedFetch).toHaveBeenCalledWith(
      endpoints.searchMulti,
      { query: "test query", page: "2" },
      TTL.SEARCH
    );

    expect(result.results).toHaveLength(2);
    expect(result.totalPages).toBe(3);
    expect(result.totalResults).toBe(42);

    expect(result.results[0]).toMatchObject({
      externalId: "550",
      mediaType: "movie",
      title: "Fight Club",
    });
    expect(result.results[1]).toMatchObject({
      externalId: "1399",
      mediaType: "tv",
      title: "Breaking Bad",
    });
  });

  it("filters out person results from the response", async () => {
    const movie = makeSearchResult({
      id: 550,
      media_type: "movie",
      title: "Fight Club",
    });
    const person = makeSearchResult({
      id: 287,
      media_type: "person",
      name: "Brad Pitt",
      title: undefined,
    });
    const tv = makeSearchResult({
      id: 1399,
      media_type: "tv",
      name: "Breaking Bad",
      title: undefined,
    });

    mockedFetch.mockResolvedValue(
      makePagedResponse([movie, person, tv], { total_results: 3 })
    );

    const result = await searchMulti("brad");

    expect(result.results).toHaveLength(2);
    expect(result.results.every((r) => r.mediaType !== "person")).toBe(true);
  });

  it("defaults to page 1 when not specified", async () => {
    mockedFetch.mockResolvedValue(makePagedResponse([]));

    await searchMulti("query");

    expect(mockedFetch).toHaveBeenCalledWith(
      endpoints.searchMulti,
      { query: "query", page: "1" },
      TTL.SEARCH
    );
  });
});
