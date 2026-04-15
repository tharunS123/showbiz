import { describe, it, expect } from "vitest";
import { scoreCandidate, rankCandidates } from "../score";
import { deterministicExplanation } from "../explain";
import type { Title } from "@/lib/catalog/types";
import type { UserSignals } from "../types";

function makeTitle(overrides: Partial<Title> = {}): Title {
  return {
    externalId: "123",
    mediaType: "movie",
    title: "Test Movie",
    year: 2024,
    overview: "A test movie",
    genres: [
      { id: 28, name: "Action" },
      { id: 18, name: "Drama" },
    ],
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

describe("scoreCandidate", () => {
  it("gives positive score for genre overlap", () => {
    const title = makeTitle();
    const signals = makeSignals({ favoriteGenreIds: [28, 12] });
    const result = scoreCandidate(title, signals);
    expect(result.score).toBeGreaterThan(0);
    expect(result.explanationTokens.matchedGenres).toContain("Action");
  });

  it("returns -Infinity for already seen titles", () => {
    const title = makeTitle({ externalId: "123" });
    const signals = makeSignals({ seenExternalIds: new Set(["123"]) });
    const result = scoreCandidate(title, signals);
    expect(result.score).toBe(-Infinity);
  });

  it("gives recency bonus for recent titles", () => {
    const recentTitle = makeTitle({ year: new Date().getFullYear() });
    const oldTitle = makeTitle({ year: 1990, externalId: "456" });
    const signals = makeSignals({ favoriteGenreIds: [28] });

    const recentScore = scoreCandidate(recentTitle, signals);
    const oldScore = scoreCandidate(oldTitle, signals);
    expect(recentScore.score).toBeGreaterThan(oldScore.score);
  });

  it("gives rating bonus for highly rated titles", () => {
    const highRated = makeTitle({ ratingAverage: 8.5 });
    const lowRated = makeTitle({ ratingAverage: 5.0, externalId: "456" });
    const signals = makeSignals({ favoriteGenreIds: [] });

    const highScore = scoreCandidate(highRated, signals);
    const lowScore = scoreCandidate(lowRated, signals);
    expect(highScore.score).toBeGreaterThan(lowScore.score);
  });

  it("applies diversity penalty for recently recommended titles", () => {
    const title = makeTitle();
    const withPenalty = makeSignals({ recentRecIds: new Set(["123"]) });
    const withoutPenalty = makeSignals();

    const penalizedScore = scoreCandidate(title, withPenalty);
    const normalScore = scoreCandidate(title, withoutPenalty);
    expect(normalScore.score).toBeGreaterThan(penalizedScore.score);
  });
});

describe("rankCandidates", () => {
  it("sorts by score descending and limits results", () => {
    const titles = [
      makeTitle({ externalId: "1", genres: [] }),
      makeTitle({ externalId: "2", genres: [{ id: 28, name: "Action" }] }),
      makeTitle({
        externalId: "3",
        genres: [
          { id: 28, name: "Action" },
          { id: 12, name: "Adventure" },
        ],
      }),
    ];
    const signals = makeSignals({ favoriteGenreIds: [28, 12] });
    const ranked = rankCandidates(titles, signals, 2);

    expect(ranked).toHaveLength(2);
    expect(ranked[0].title.externalId).toBe("3");
    expect(ranked[1].title.externalId).toBe("2");
  });

  it("excludes seen titles", () => {
    const titles = [
      makeTitle({ externalId: "1" }),
      makeTitle({ externalId: "2" }),
    ];
    const signals = makeSignals({ seenExternalIds: new Set(["1"]) });
    const ranked = rankCandidates(titles, signals);
    expect(ranked.every((r) => r.title.externalId !== "1")).toBe(true);
  });
});

describe("deterministicExplanation", () => {
  it("explains genre matches", () => {
    const explanation = deterministicExplanation({
      matchedGenres: ["Action", "Drama"],
      matchedPeople: [],
      matchedTitles: [],
    });
    expect(explanation).toContain("Action");
    expect(explanation).toContain("Drama");
  });

  it("prioritizes person matches over genres", () => {
    const explanation = deterministicExplanation({
      matchedGenres: ["Action"],
      matchedPeople: ["Brad Pitt"],
      matchedTitles: [],
    });
    expect(explanation).toContain("Brad Pitt");
    expect(explanation).not.toContain("Action");
  });

  it("falls back to popularity explanation", () => {
    const explanation = deterministicExplanation({
      matchedGenres: [],
      matchedPeople: [],
      matchedTitles: [],
    });
    expect(explanation).toContain("trending");
  });
});
