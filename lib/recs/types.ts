import type { Title } from "@/lib/catalog/types";

export interface RatedItem {
  externalId: string;
  mediaType: "movie" | "tv";
  rating: number;
}

export interface UserSignals {
  userId: string;
  favoriteGenreIds: number[];
  topPersonIds: string[];
  recentTitleIds: string[];
  seenExternalIds: Set<string>;
  recentRecIds: Set<string>;
  ratedItems: RatedItem[];
  ratingGenreWeights: Map<number, number>;
}

export interface ExplanationTokens {
  matchedGenres: string[];
  matchedPeople: string[];
  matchedTitles: string[];
}

export interface ScoredCandidate {
  title: Title;
  score: number;
  explanationTokens: ExplanationTokens;
}

export interface RecsResult {
  items: Array<{
    title: Title;
    explanation: string;
  }>;
  recsVersion: string;
}
