export type MediaType = "movie" | "tv";

export interface Genre {
  id: number;
  name: string;
}

export interface Title {
  externalId: string;
  mediaType: MediaType;
  title: string;
  year: number | null;
  overview: string;
  genres: Genre[];
  runtimeMinutes: number | null;
  seasonCount: number | null;
  episodeCount: number | null;
  status: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  ratingAverage: number;
  ratingCount: number;
  trailerKey: string | null;
}

export interface Person {
  externalId: string;
  name: string;
  bio: string | null;
  profilePath: string | null;
  knownForDepartment: string | null;
}

export interface Credit {
  person: Pick<Person, "externalId" | "name" | "profilePath">;
  role: "cast" | "crew";
  character: string | null;
  job: string | null;
  department: string | null;
  ordering: number;
}

export interface FilmographyItem {
  externalId: string;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  character: string | null;
  job: string | null;
  department: string | null;
}

// TMDb raw response types

export interface TMDbMovie {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  overview: string;
  genres?: { id: number; name: string }[];
  genre_ids?: number[];
  runtime: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  videos?: { results: TMDbVideo[] };
}

export interface TMDbTv {
  id: number;
  name: string;
  original_name: string;
  first_air_date: string;
  overview: string;
  genres?: { id: number; name: string }[];
  genre_ids?: number[];
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  episode_run_time?: number[];
  status: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  videos?: { results: TMDbVideo[] };
}

export interface TMDbPerson {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  known_for_department: string | null;
}

export interface TMDbCastMember {
  id: number;
  name: string;
  profile_path: string | null;
  character: string;
  order: number;
}

export interface TMDbCrewMember {
  id: number;
  name: string;
  profile_path: string | null;
  job: string;
  department: string;
}

export interface TMDbVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TMDbSearchResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path: string | null;
  profile_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  known_for_department?: string;
}

export interface TMDbPagedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDbCreditsResponse {
  id: number;
  cast: TMDbCastMember[];
  crew: TMDbCrewMember[];
}

export interface TMDbPersonCreditsResponse {
  id: number;
  cast: Array<{
    id: number;
    media_type: "movie" | "tv";
    title?: string;
    name?: string;
    release_date?: string;
    first_air_date?: string;
    poster_path: string | null;
    character: string;
  }>;
  crew: Array<{
    id: number;
    media_type: "movie" | "tv";
    title?: string;
    name?: string;
    release_date?: string;
    first_air_date?: string;
    poster_path: string | null;
    job: string;
    department: string;
  }>;
}
