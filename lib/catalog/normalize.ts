import type {
  Title,
  Person,
  Credit,
  FilmographyItem,
  TMDbMovie,
  TMDbTv,
  TMDbPerson,
  TMDbCastMember,
  TMDbCrewMember,
  TMDbVideo,
  TMDbSearchResult,
  TMDbPersonCreditsResponse,
} from "./types";

function extractYear(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null;
  const year = new Date(dateStr).getFullYear();
  return isNaN(year) ? null : year;
}

function extractTrailerKey(videos?: TMDbVideo[]): string | null {
  if (!videos || videos.length === 0) return null;
  const trailer = videos.find(
    (v) => v.type === "Trailer" && v.site === "YouTube"
  );
  if (trailer) return trailer.key;
  const teaser = videos.find(
    (v) => v.type === "Teaser" && v.site === "YouTube"
  );
  return teaser?.key ?? null;
}

export function normalizeMovie(raw: TMDbMovie): Title {
  return {
    externalId: String(raw.id),
    mediaType: "movie",
    title: raw.title,
    year: extractYear(raw.release_date),
    overview: raw.overview ?? "",
    genres: raw.genres ?? [],
    runtimeMinutes: raw.runtime ?? null,
    seasonCount: null,
    episodeCount: null,
    status: null,
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    ratingAverage: raw.vote_average ?? 0,
    ratingCount: raw.vote_count ?? 0,
    trailerKey: extractTrailerKey(raw.videos?.results),
  };
}

export function normalizeTv(raw: TMDbTv): Title {
  return {
    externalId: String(raw.id),
    mediaType: "tv",
    title: raw.name,
    year: extractYear(raw.first_air_date),
    overview: raw.overview ?? "",
    genres: raw.genres ?? [],
    runtimeMinutes: raw.episode_run_time?.[0] ?? null,
    seasonCount: raw.number_of_seasons ?? null,
    episodeCount: raw.number_of_episodes ?? null,
    status: raw.status ?? null,
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    ratingAverage: raw.vote_average ?? 0,
    ratingCount: raw.vote_count ?? 0,
    trailerKey: extractTrailerKey(raw.videos?.results),
  };
}

export function normalizePerson(raw: TMDbPerson): Person {
  return {
    externalId: String(raw.id),
    name: raw.name,
    bio: raw.biography || null,
    profilePath: raw.profile_path ?? null,
    knownForDepartment: raw.known_for_department ?? null,
  };
}

export function normalizeCast(members: TMDbCastMember[]): Credit[] {
  return members.map((m) => ({
    person: {
      externalId: String(m.id),
      name: m.name,
      profilePath: m.profile_path ?? null,
    },
    role: "cast" as const,
    character: m.character || null,
    job: null,
    department: null,
    ordering: m.order,
  }));
}

export function normalizeCrew(members: TMDbCrewMember[]): Credit[] {
  return members.map((m, i) => ({
    person: {
      externalId: String(m.id),
      name: m.name,
      profilePath: m.profile_path ?? null,
    },
    role: "crew" as const,
    character: null,
    job: m.job || null,
    department: m.department || null,
    ordering: i,
  }));
}

export function normalizeSearchResult(raw: TMDbSearchResult): Title | null {
  if (raw.media_type !== "movie" && raw.media_type !== "tv") return null;
  return {
    externalId: String(raw.id),
    mediaType: raw.media_type,
    title: raw.title ?? raw.name ?? "Unknown",
    year: extractYear(raw.release_date ?? raw.first_air_date),
    overview: raw.overview ?? "",
    genres: [],
    runtimeMinutes: null,
    seasonCount: null,
    episodeCount: null,
    status: null,
    posterPath: raw.poster_path ?? null,
    backdropPath: null,
    ratingAverage: raw.vote_average ?? 0,
    ratingCount: raw.vote_count ?? 0,
    trailerKey: null,
  };
}

export function normalizeMovieListItem(
  raw: TMDbMovie & { genre_ids?: number[] }
): Title {
  return {
    externalId: String(raw.id),
    mediaType: "movie",
    title: raw.title,
    year: extractYear(raw.release_date),
    overview: raw.overview ?? "",
    genres:
      raw.genres ?? raw.genre_ids?.map((id) => ({ id, name: "" })) ?? [],
    runtimeMinutes: null,
    seasonCount: null,
    episodeCount: null,
    status: null,
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    ratingAverage: raw.vote_average ?? 0,
    ratingCount: raw.vote_count ?? 0,
    trailerKey: null,
  };
}

export function normalizeTvListItem(
  raw: TMDbTv & { genre_ids?: number[] }
): Title {
  return {
    externalId: String(raw.id),
    mediaType: "tv",
    title: raw.name,
    year: extractYear(raw.first_air_date),
    overview: raw.overview ?? "",
    genres:
      raw.genres ?? raw.genre_ids?.map((id) => ({ id, name: "" })) ?? [],
    runtimeMinutes: null,
    seasonCount: null,
    episodeCount: null,
    status: null,
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    ratingAverage: raw.vote_average ?? 0,
    ratingCount: raw.vote_count ?? 0,
    trailerKey: null,
  };
}

export function normalizePersonCredits(
  raw: TMDbPersonCreditsResponse
): FilmographyItem[] {
  const items: FilmographyItem[] = [];

  for (const c of raw.cast) {
    items.push({
      externalId: String(c.id),
      mediaType: c.media_type,
      title: c.title ?? c.name ?? "Unknown",
      year: extractYear(c.release_date ?? c.first_air_date),
      posterPath: c.poster_path ?? null,
      character: c.character || null,
      job: null,
      department: null,
    });
  }

  for (const c of raw.crew) {
    if (items.some((i) => i.externalId === String(c.id))) continue;
    items.push({
      externalId: String(c.id),
      mediaType: c.media_type,
      title: c.title ?? c.name ?? "Unknown",
      year: extractYear(c.release_date ?? c.first_air_date),
      posterPath: c.poster_path ?? null,
      character: null,
      job: c.job || null,
      department: c.department || null,
    });
  }

  items.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  return items;
}
