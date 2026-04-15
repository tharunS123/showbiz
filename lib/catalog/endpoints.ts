const BASE = "https://api.themoviedb.org/3";

export const endpoints = {
  movie: (id: string) => `${BASE}/movie/${id}`,
  movieCredits: (id: string) => `${BASE}/movie/${id}/credits`,
  movieSimilar: (id: string) => `${BASE}/movie/${id}/similar`,
  movieVideos: (id: string) => `${BASE}/movie/${id}/videos`,

  tv: (id: string) => `${BASE}/tv/${id}`,
  tvCredits: (id: string) => `${BASE}/tv/${id}/credits`,
  tvSimilar: (id: string) => `${BASE}/tv/${id}/similar`,
  tvVideos: (id: string) => `${BASE}/tv/${id}/videos`,

  person: (id: string) => `${BASE}/person/${id}`,
  personCombinedCredits: (id: string) =>
    `${BASE}/person/${id}/combined_credits`,

  searchMulti: `${BASE}/search/multi`,

  trending: (type: "movie" | "tv" | "all", window: "day" | "week") =>
    `${BASE}/trending/${type}/${window}`,

  popular: (type: "movie" | "tv") => `${BASE}/${type}/popular`,
  topRated: (type: "movie" | "tv") => `${BASE}/${type}/top_rated`,

  discover: (type: "movie" | "tv") => `${BASE}/discover/${type}`,

  genreList: (type: "movie" | "tv") => `${BASE}/genre/${type}/list`,

  movieWatchProviders: (id: string) => `${BASE}/movie/${id}/watch/providers`,
  tvWatchProviders: (id: string) => `${BASE}/tv/${id}/watch/providers`,
} as const;
