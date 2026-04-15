import type { Title } from "@/lib/catalog/types";
import { discoverByGenre } from "@/lib/catalog/discover";

interface MoodFilters {
  genreIds: number[];
  excludeGenreIds: number[];
  maxRuntime: number | null;
  mediaType: "movie" | "tv" | "both";
}

const GENRE_MAP: Record<string, number[]> = {
  action: [28],
  adventure: [12],
  animation: [16],
  comedy: [35],
  crime: [80],
  documentary: [99],
  drama: [18],
  family: [10751],
  fantasy: [14],
  history: [36],
  horror: [27],
  music: [10402],
  mystery: [9648],
  romance: [10749],
  "sci-fi": [878],
  "science fiction": [878],
  thriller: [53],
  war: [10752],
  western: [37],
};

const MOOD_GENRE_MAP: Record<string, number[]> = {
  cozy: [35, 10751, 10749],
  scary: [27, 53],
  fun: [35, 28, 12],
  dark: [80, 53, 27],
  inspiring: [18, 36],
  romantic: [10749, 18],
  cerebral: [878, 9648],
  lighthearted: [35, 10751, 16],
  intense: [28, 53, 80],
  nostalgic: [10751, 35, 18],
};

const RUNTIME_PATTERNS: Array<{ pattern: RegExp; minutes: number }> = [
  { pattern: /under\s+(\d+)\s*(hours?|hrs?)/i, minutes: 0 },
  { pattern: /under\s+(\d+)\s*min/i, minutes: 0 },
  { pattern: /short/i, minutes: 100 },
  { pattern: /quick/i, minutes: 90 },
];

export function parseMoodQuery(query: string): MoodFilters {
  const lower = query.toLowerCase();
  const genreIds = new Set<number>();
  const excludeGenreIds = new Set<number>();
  let maxRuntime: number | null = null;
  let mediaType: MoodFilters["mediaType"] = "both";

  for (const [keyword, ids] of Object.entries(MOOD_GENRE_MAP)) {
    if (lower.includes(keyword)) {
      ids.forEach((id) => genreIds.add(id));
    }
  }

  for (const [keyword, ids] of Object.entries(GENRE_MAP)) {
    if (lower.includes(keyword)) {
      ids.forEach((id) => genreIds.add(id));
    }
  }

  for (const { pattern, minutes } of RUNTIME_PATTERNS) {
    const match = lower.match(pattern);
    if (match) {
      if (minutes > 0) {
        maxRuntime = minutes;
      } else {
        const num = parseInt(match[1], 10);
        const unit = match[2]?.toLowerCase() ?? "min";
        maxRuntime = unit.startsWith("h") ? num * 60 : num;
      }
      break;
    }
  }

  if (lower.includes("movie") || lower.includes("film")) mediaType = "movie";
  else if (lower.includes("show") || lower.includes("series") || lower.includes("tv")) mediaType = "tv";

  if (lower.includes("no horror") || lower.includes("not scary")) {
    [27].forEach((id) => excludeGenreIds.add(id));
  }

  if (genreIds.size === 0) {
    [18, 35].forEach((id) => genreIds.add(id));
  }

  return {
    genreIds: [...genreIds],
    excludeGenreIds: [...excludeGenreIds],
    maxRuntime,
    mediaType,
  };
}

export async function discoverByMood(query: string): Promise<{
  titles: Title[];
  filters: MoodFilters;
}> {
  const filters = parseMoodQuery(query);
  const activeGenres = filters.genreIds.filter(
    (id) => !filters.excludeGenreIds.includes(id)
  );

  let titles: Title[] = [];

  if (filters.mediaType === "both" || filters.mediaType === "movie") {
    const movies = await discoverByGenre("movie", activeGenres.slice(0, 3));
    titles.push(...movies);
  }

  if (filters.mediaType === "both" || filters.mediaType === "tv") {
    const shows = await discoverByGenre("tv", activeGenres.slice(0, 3));
    titles.push(...shows);
  }

  if (filters.maxRuntime) {
    titles = titles.filter(
      (t) => !t.runtimeMinutes || t.runtimeMinutes <= filters.maxRuntime!
    );
  }

  titles.sort((a, b) => (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0));

  return { titles: titles.slice(0, 20), filters };
}
