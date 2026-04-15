import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Title } from "@/lib/catalog/types";
import type { UserSignals } from "../types";

vi.mock("@/lib/catalog/movie", () => ({
  getSimilarMovies: vi.fn(),
}));
vi.mock("@/lib/catalog/tv", () => ({
  getSimilarShows: vi.fn(),
}));
vi.mock("@/lib/catalog/trending", () => ({
  getTrending: vi.fn(),
}));
vi.mock("@/lib/catalog/discover", () => ({
  discoverByGenre: vi.fn(),
}));

import { generateCandidates } from "../candidates";
import { getSimilarMovies } from "@/lib/catalog/movie";
import { getSimilarShows } from "@/lib/catalog/tv";
import { getTrending } from "@/lib/catalog/trending";
import { discoverByGenre } from "@/lib/catalog/discover";

const mockGetSimilarMovies = vi.mocked(getSimilarMovies);
const mockGetSimilarShows = vi.mocked(getSimilarShows);
const mockGetTrending = vi.mocked(getTrending);
const mockDiscoverByGenre = vi.mocked(discoverByGenre);

function makeTitle(overrides: Partial<Title> = {}): Title {
  return {
    externalId: "123",
    mediaType: "movie",
    title: "Test Movie",
    year: 2024,
    overview: "A test movie",
    genres: [{ id: 28, name: "Action" }],
    runtimeMinutes: 120,
    seasonCount: null,
    episodeCount: null,
    status: null,
    posterPath: "/test.jpg",
    backdropPath: null,
    ratingAverage: 7.5,
    ratingCount: 1000,
    trailerKey: null,
    ...overrides,
  };
}

function makeSignals(overrides: Partial<UserSignals> = {}): UserSignals {
  return {
    userId: "user1",
    favoriteGenreIds: [],
    topPersonIds: [],
    recentTitleIds: [],
    seenExternalIds: new Set(),
    recentRecIds: new Set(),
    ratedItems: [],
    ratingGenreWeights: new Map(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTrending.mockResolvedValue([]);
  mockGetSimilarMovies.mockResolvedValue([]);
  mockGetSimilarShows.mockResolvedValue([]);
  mockDiscoverByGenre.mockResolvedValue([]);
});

describe("generateCandidates", () => {
  it("returns similar titles when recentTitleIds are present", async () => {
    const similarMovie = makeTitle({ externalId: "sim-1", title: "Similar Movie" });
    const similarShow = makeTitle({ externalId: "sim-2", mediaType: "tv", title: "Similar Show" });

    mockGetSimilarMovies.mockResolvedValue([similarMovie]);
    mockGetSimilarShows.mockResolvedValue([similarShow]);

    const signals = makeSignals({ recentTitleIds: ["recent-1"] });
    const result = await generateCandidates(signals);

    expect(mockGetSimilarMovies).toHaveBeenCalledWith("recent-1");
    expect(mockGetSimilarShows).toHaveBeenCalledWith("recent-1");
    expect(result).toContainEqual(similarMovie);
    expect(result).toContainEqual(similarShow);
  });

  it("calls discoverByGenre for movie and tv when favoriteGenreIds are present", async () => {
    const genreMovie = makeTitle({ externalId: "genre-m-1" });
    const genreTv = makeTitle({ externalId: "genre-tv-1", mediaType: "tv" });

    mockDiscoverByGenre
      .mockResolvedValueOnce([genreMovie])
      .mockResolvedValueOnce([genreTv]);

    const signals = makeSignals({ favoriteGenreIds: [28, 12, 35] });
    const result = await generateCandidates(signals);

    expect(mockDiscoverByGenre).toHaveBeenCalledWith("movie", [28, 12, 35]);
    expect(mockDiscoverByGenre).toHaveBeenCalledWith("tv", [28, 12, 35]);
    expect(result).toContainEqual(genreMovie);
    expect(result).toContainEqual(genreTv);
  });

  it("skips genre discovery when favoriteGenreIds is empty", async () => {
    const signals = makeSignals({ favoriteGenreIds: [] });
    await generateCandidates(signals);

    expect(mockDiscoverByGenre).not.toHaveBeenCalled();
  });

  it("deduplicates titles with the same externalId from multiple sources", async () => {
    const shared = makeTitle({ externalId: "dup-1", title: "Duplicate" });

    mockGetSimilarMovies.mockResolvedValue([shared]);
    mockGetTrending.mockResolvedValue([shared]);
    mockDiscoverByGenre
      .mockResolvedValueOnce([shared])
      .mockResolvedValueOnce([]);

    const signals = makeSignals({
      recentTitleIds: ["recent-1"],
      favoriteGenreIds: [28],
    });
    const result = await generateCandidates(signals);

    const matches = result.filter((t) => t.externalId === "dup-1");
    expect(matches).toHaveLength(1);
  });

  it("only uses the first 3 recentTitleIds for similar lookups", async () => {
    const signals = makeSignals({
      recentTitleIds: ["id-1", "id-2", "id-3", "id-4", "id-5"],
    });

    await generateCandidates(signals);

    expect(mockGetSimilarMovies).toHaveBeenCalledTimes(3);
    expect(mockGetSimilarShows).toHaveBeenCalledTimes(3);
    expect(mockGetSimilarMovies).toHaveBeenCalledWith("id-1");
    expect(mockGetSimilarMovies).toHaveBeenCalledWith("id-2");
    expect(mockGetSimilarMovies).toHaveBeenCalledWith("id-3");
    expect(mockGetSimilarMovies).not.toHaveBeenCalledWith("id-4");
    expect(mockGetSimilarMovies).not.toHaveBeenCalledWith("id-5");
  });

  it("catches errors from getSimilarMovies gracefully", async () => {
    mockGetSimilarMovies.mockRejectedValue(new Error("TMDb 503"));
    mockGetSimilarShows.mockResolvedValue([
      makeTitle({ externalId: "show-ok" }),
    ]);

    const signals = makeSignals({ recentTitleIds: ["recent-1"] });
    const result = await generateCandidates(signals);

    expect(result.some((t) => t.externalId === "show-ok")).toBe(true);
  });

  it("catches errors from getSimilarShows gracefully", async () => {
    mockGetSimilarMovies.mockResolvedValue([
      makeTitle({ externalId: "movie-ok" }),
    ]);
    mockGetSimilarShows.mockRejectedValue(new Error("TMDb 503"));

    const signals = makeSignals({ recentTitleIds: ["recent-1"] });
    const result = await generateCandidates(signals);

    expect(result.some((t) => t.externalId === "movie-ok")).toBe(true);
  });

  it("always includes trending results", async () => {
    const trendingTitle = makeTitle({ externalId: "trend-1", title: "Trending" });
    mockGetTrending.mockResolvedValue([trendingTitle]);

    const signals = makeSignals();
    const result = await generateCandidates(signals);

    expect(mockGetTrending).toHaveBeenCalledWith("all", "week");
    expect(result).toContainEqual(trendingTitle);
  });

  it("returns empty array when all sources return empty", async () => {
    const signals = makeSignals();
    const result = await generateCandidates(signals);

    expect(result).toEqual([]);
  });

  it("preserves priority order: similar > genre > trending during dedup", async () => {
    const fromSimilar = makeTitle({ externalId: "dup", title: "From Similar" });
    const fromGenre = makeTitle({ externalId: "dup", title: "From Genre" });
    const fromTrending = makeTitle({ externalId: "dup", title: "From Trending" });

    mockGetSimilarMovies.mockResolvedValue([fromSimilar]);
    mockDiscoverByGenre
      .mockResolvedValueOnce([fromGenre])
      .mockResolvedValueOnce([]);
    mockGetTrending.mockResolvedValue([fromTrending]);

    const signals = makeSignals({
      recentTitleIds: ["r-1"],
      favoriteGenreIds: [28],
    });
    const result = await generateCandidates(signals);

    const match = result.find((t) => t.externalId === "dup");
    expect(match?.title).toBe("From Similar");
  });

  it("slices favoriteGenreIds to first 3 for discovery", async () => {
    const signals = makeSignals({
      favoriteGenreIds: [28, 12, 35, 80, 99],
    });

    await generateCandidates(signals);

    expect(mockDiscoverByGenre).toHaveBeenCalledWith("movie", [28, 12, 35]);
    expect(mockDiscoverByGenre).toHaveBeenCalledWith("tv", [28, 12, 35]);
  });
});
