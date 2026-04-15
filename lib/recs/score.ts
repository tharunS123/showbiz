import type { Title } from "@/lib/catalog/types";
import type { UserSignals, ExplanationTokens, ScoredCandidate } from "./types";

export function scoreCandidate(
  candidate: Title,
  signals: UserSignals
): ScoredCandidate {
  if (signals.seenExternalIds.has(candidate.externalId)) {
    return {
      title: candidate,
      score: -Infinity,
      explanationTokens: {
        matchedGenres: [],
        matchedPeople: [],
        matchedTitles: [],
      },
    };
  }

  let score = 0;
  const tokens: ExplanationTokens = {
    matchedGenres: [],
    matchedPeople: [],
    matchedTitles: [],
  };

  const genreMatches = candidate.genres.filter((g) =>
    signals.favoriteGenreIds.includes(g.id)
  );
  score += genreMatches.length * 2.0;
  tokens.matchedGenres = genreMatches.map((g) => g.name).filter(Boolean);

  if (
    candidate.year &&
    candidate.year >= new Date().getFullYear() - 2
  ) {
    score += 0.5;
  }

  if (candidate.ratingAverage >= 7) {
    score += 0.5;
  }

  if (signals.recentRecIds.has(candidate.externalId)) {
    score -= 1.0;
  }

  if (signals.ratingGenreWeights.size > 0) {
    for (const genre of candidate.genres) {
      const weight = signals.ratingGenreWeights.get(genre.id);
      if (weight !== undefined) {
        score += weight * 0.5;
      }
    }
  }

  return { title: candidate, score, explanationTokens: tokens };
}

export function rankCandidates(
  candidates: Title[],
  signals: UserSignals,
  limit = 20
): ScoredCandidate[] {
  return candidates
    .map((c) => scoreCandidate(c, signals))
    .filter((sc) => sc.score > -Infinity)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
