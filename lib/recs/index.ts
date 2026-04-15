import { buildUserSignals } from "./signals";
import { generateCandidates } from "./candidates";
import { rankCandidates } from "./score";
import { deterministicExplanation } from "./explain";
import { userProfileVector, rankByEmbedding } from "./embeddings";
import type { RecsResult } from "./types";
import { getUserPreferences } from "@/lib/db/preferences";

const RECS_MODE = process.env.RECS_MODE ?? "rules";

async function generateRulesRecs(
  userId: string,
  limit: number
): Promise<RecsResult> {
  const signals = await buildUserSignals(userId);

  if (
    signals.favoriteGenreIds.length === 0 &&
    signals.recentTitleIds.length === 0
  ) {
    return { items: [], recsVersion: "v1-empty" };
  }

  const [allCandidates, prefs] = await Promise.all([
    generateCandidates(signals),
    getUserPreferences(userId),
  ]);

  const candidates = allCandidates.filter(
    (c) => !c.genres.some((g) => prefs.excluded_genres.includes(g.id))
  );
  const ranked = rankCandidates(candidates, signals, limit);

  const items = ranked.map((sc) => ({
    title: sc.title,
    explanation: deterministicExplanation(sc.explanationTokens),
  }));

  return { items, recsVersion: "v1-rules" };
}

async function generateEmbeddingsRecs(
  userId: string,
  limit: number
): Promise<RecsResult> {
  const signals = await buildUserSignals(userId);

  if (
    signals.favoriteGenreIds.length === 0 &&
    signals.recentTitleIds.length === 0
  ) {
    return { items: [], recsVersion: "v2-empty" };
  }

  const [allCandidates, prefs] = await Promise.all([
    generateCandidates(signals),
    getUserPreferences(userId),
  ]);

  const candidates = allCandidates.filter(
    (c) => !c.genres.some((g) => prefs.excluded_genres.includes(g.id))
  );

  const { getMovie } = await import("@/lib/catalog/movie");
  const { getTv } = await import("@/lib/catalog/tv");

  const profileTitles = await Promise.all(
    signals.recentTitleIds.slice(0, 5).map(async (id) => {
      const movie = await getMovie(id).catch(() => null);
      if (movie) return movie;
      return getTv(id).catch(() => null);
    })
  );
  const validTitles = profileTitles.filter(
    (t): t is NonNullable<typeof t> => t !== null
  );

  const profileVec = userProfileVector(validTitles, signals);
  const ranked = rankByEmbedding(candidates, profileVec, signals, limit);

  const items = ranked.map((r) => {
    const simPct = Math.round(r.similarity * 100);
    const genreOverlap = r.title.genres
      .filter((g) => signals.favoriteGenreIds.includes(g.id))
      .map((g) => g.name)
      .filter(Boolean);

    let explanation: string;
    if (genreOverlap.length > 0) {
      explanation = `${simPct}% match — shares your favorite genres: ${genreOverlap.join(", ")}.`;
    } else {
      explanation = `${simPct}% match based on your viewing profile.`;
    }

    return { title: r.title, explanation };
  });

  return { items, recsVersion: "v2-embeddings" };
}

export async function generateRecs(
  userId: string,
  limit = 20
): Promise<RecsResult> {
  if (RECS_MODE === "embeddings") {
    return generateEmbeddingsRecs(userId, limit);
  }
  return generateRulesRecs(userId, limit);
}
