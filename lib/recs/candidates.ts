import type { Title } from "@/lib/catalog/types";
import type { UserSignals } from "./types";
import { getSimilarMovies } from "@/lib/catalog/movie";
import { getSimilarShows } from "@/lib/catalog/tv";
import { getTrending } from "@/lib/catalog/trending";
import { discoverByGenre } from "@/lib/catalog/discover";

export async function generateCandidates(
  signals: UserSignals
): Promise<Title[]> {
  const similarPromises = signals.recentTitleIds.slice(0, 3).map((id) =>
    Promise.all([
      getSimilarMovies(id).catch(() => []),
      getSimilarShows(id).catch(() => []),
    ]).then(([movies, shows]) => [...movies, ...shows])
  );

  const [similarResults, trending, genreMovies, genreTv] = await Promise.all([
    Promise.all(similarPromises).then((results) => results.flat()),
    getTrending("all", "week"),
    signals.favoriteGenreIds.length > 0
      ? discoverByGenre("movie", signals.favoriteGenreIds.slice(0, 3))
      : Promise.resolve([]),
    signals.favoriteGenreIds.length > 0
      ? discoverByGenre("tv", signals.favoriteGenreIds.slice(0, 3))
      : Promise.resolve([]),
  ]);

  const seen = new Set<string>();
  const deduped: Title[] = [];

  for (const title of [
    ...similarResults,
    ...genreMovies,
    ...genreTv,
    ...trending,
  ]) {
    if (seen.has(title.externalId)) continue;
    seen.add(title.externalId);
    deduped.push(title);
  }

  return deduped;
}
