import { describe, it, expect } from "vitest";
import {
  titleToVector,
  userProfileVector,
  cosineSimilarity,
  rankByEmbedding,
} from "../embeddings";
import type { Title } from "@/lib/catalog/types";
import type { UserSignals } from "../types";

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
    favoriteGenreIds: [28, 12],
    topPersonIds: [],
    recentTitleIds: [],
    seenExternalIds: new Set(),
    recentRecIds: new Set(),
    ratedItems: [],
    ratingGenreWeights: new Map(),
    ...overrides,
  };
}

describe("titleToVector", () => {
  it("returns a fixed-length vector", () => {
    const vec = titleToVector(makeTitle());
    expect(vec).toHaveLength(24);
  });

  it("encodes genres as one-hot in first 20 positions", () => {
    const vec = titleToVector(
      makeTitle({ genres: [{ id: 28, name: "Action" }] })
    );
    expect(vec[28 % 20]).toBe(1);
  });

  it("normalizes rating to 0-1 range", () => {
    const vec = titleToVector(makeTitle({ ratingAverage: 8.0 }));
    expect(vec[20]).toBeCloseTo(0.8);
  });

  it("sets movie flag", () => {
    const movieVec = titleToVector(makeTitle({ mediaType: "movie" }));
    const tvVec = titleToVector(makeTitle({ mediaType: "tv" }));
    expect(movieVec[23]).toBe(1);
    expect(tvVec[23]).toBe(0);
  });
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const vec = [1, 0, 1, 0];
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns 0 for zero vectors", () => {
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
  });
});

describe("userProfileVector", () => {
  it("returns zero vector for empty titles", () => {
    const vec = userProfileVector([], makeSignals());
    expect(vec.every((v) => v === 0)).toBe(true);
  });

  it("averages title vectors", () => {
    const t1 = makeTitle({ ratingAverage: 6.0 });
    const t2 = makeTitle({ ratingAverage: 8.0, externalId: "456" });
    const vec = userProfileVector(
      [t1, t2],
      makeSignals({ favoriteGenreIds: [] })
    );
    expect(vec[20]).toBeCloseTo(0.7);
  });

  it("boosts favorite genre positions", () => {
    const signals = makeSignals({ favoriteGenreIds: [5] });
    const vec = userProfileVector([makeTitle({ genres: [] })], signals);
    expect(vec[5 % 20]).toBeGreaterThan(0);
  });
});

describe("rankByEmbedding", () => {
  it("excludes seen titles", () => {
    const candidates = [
      makeTitle({ externalId: "1" }),
      makeTitle({ externalId: "2" }),
    ];
    const profileVec = titleToVector(candidates[0]);
    const signals = makeSignals({ seenExternalIds: new Set(["1"]) });
    const ranked = rankByEmbedding(candidates, profileVec, signals);
    expect(ranked.every((r) => r.title.externalId !== "1")).toBe(true);
  });

  it("sorts by score descending", () => {
    const similar = makeTitle({
      externalId: "1",
      genres: [{ id: 28, name: "Action" }],
    });
    const different = makeTitle({
      externalId: "2",
      genres: [{ id: 99, name: "Unknown" }],
      ratingAverage: 3.0,
      year: 1970,
    });
    const profileVec = titleToVector(similar);
    const signals = makeSignals();
    const ranked = rankByEmbedding([different, similar], profileVec, signals);
    expect(ranked[0].title.externalId).toBe("1");
  });

  it("applies diversity penalty for recently recommended", () => {
    const title = makeTitle({ externalId: "1" });
    const profileVec = titleToVector(title);
    const withPenalty = rankByEmbedding(
      [title],
      profileVec,
      makeSignals({ recentRecIds: new Set(["1"]) })
    );
    const withoutPenalty = rankByEmbedding(
      [title],
      profileVec,
      makeSignals()
    );
    expect(withoutPenalty[0].score).toBeGreaterThan(withPenalty[0].score);
  });

  it("respects limit", () => {
    const candidates = Array.from({ length: 30 }, (_, i) =>
      makeTitle({ externalId: String(i) })
    );
    const profileVec = titleToVector(candidates[0]);
    const ranked = rankByEmbedding(candidates, profileVec, makeSignals(), 5);
    expect(ranked).toHaveLength(5);
  });
});
