import type { Title } from "@/lib/catalog/types";
import type { UserSignals } from "./types";

const GENRE_UNIVERSE_SIZE = 20;

export function titleToVector(title: Title): number[] {
  const genreVec = new Array(GENRE_UNIVERSE_SIZE).fill(0);
  for (const g of title.genres) {
    const idx = g.id % GENRE_UNIVERSE_SIZE;
    genreVec[idx] = 1;
  }

  const ratingNorm = (title.ratingAverage || 0) / 10;
  const recencyNorm = title.year
    ? Math.max(0, 1 - (new Date().getFullYear() - title.year) / 50)
    : 0.5;
  const popularityNorm = Math.min(1, (title.ratingCount || 0) / 10000);
  const isMovie = title.mediaType === "movie" ? 1 : 0;

  return [...genreVec, ratingNorm, recencyNorm, popularityNorm, isMovie];
}

export function userProfileVector(
  titles: Title[],
  signals: UserSignals
): number[] {
  if (titles.length === 0) {
    return new Array(GENRE_UNIVERSE_SIZE + 4).fill(0);
  }

  const ratingMap = new Map(
    signals.ratedItems.map((r) => [r.externalId, r.rating])
  );

  const dim = GENRE_UNIVERSE_SIZE + 4;
  const weighted = new Array(dim).fill(0);
  let totalWeight = 0;

  for (const title of titles) {
    const vec = titleToVector(title);
    const rating = ratingMap.get(title.externalId);
    const weight = rating !== undefined ? rating / 3 : 1;
    totalWeight += weight;

    for (let i = 0; i < dim; i++) {
      weighted[i] += vec[i] * weight;
    }
  }

  if (totalWeight > 0) {
    for (let i = 0; i < dim; i++) {
      weighted[i] /= totalWeight;
    }
  }

  for (const genreId of signals.favoriteGenreIds) {
    const idx = genreId % GENRE_UNIVERSE_SIZE;
    weighted[idx] = Math.min(1, weighted[idx] + 0.3);
  }

  if (signals.ratingGenreWeights.size > 0) {
    for (const [genreId, weight] of signals.ratingGenreWeights) {
      const idx = genreId % GENRE_UNIVERSE_SIZE;
      weighted[idx] = Math.max(0, Math.min(1, weighted[idx] + weight * 0.15));
    }
  }

  return weighted;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function rankByEmbedding(
  candidates: Title[],
  profileVec: number[],
  signals: UserSignals,
  limit = 20
): Array<{ title: Title; score: number; similarity: number }> {
  const scored = candidates
    .filter((c) => !signals.seenExternalIds.has(c.externalId))
    .map((title) => {
      const vec = titleToVector(title);
      const similarity = cosineSimilarity(profileVec, vec);

      let diversityPenalty = 0;
      if (signals.recentRecIds.has(title.externalId)) {
        diversityPenalty = 0.15;
      }

      const score = similarity - diversityPenalty;
      return { title, score, similarity };
    });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
