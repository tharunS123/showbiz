import { describe, it, expect } from "vitest";
import {
  normalizeMovie,
  normalizeTv,
  normalizePerson,
  normalizeCast,
  normalizeCrew,
  normalizeSearchResult,
  normalizePersonCredits,
} from "../normalize";
import type {
  TMDbMovie,
  TMDbTv,
  TMDbPerson,
  TMDbCastMember,
  TMDbCrewMember,
  TMDbSearchResult,
  TMDbPersonCreditsResponse,
} from "../types";

describe("normalizeMovie", () => {
  const raw: TMDbMovie = {
    id: 550,
    title: "Fight Club",
    original_title: "Fight Club",
    release_date: "1999-10-15",
    overview: "A ticking-Loss disillusioned man forms an underground fight club.",
    genres: [
      { id: 18, name: "Drama" },
      { id: 53, name: "Thriller" },
    ],
    runtime: 139,
    poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdrop_path: "/hZkgoQYus5dXo3H8T7Uef6DNknx.jpg",
    vote_average: 8.4,
    vote_count: 26000,
    videos: {
      results: [
        { key: "abc123", site: "YouTube", type: "Trailer", official: true },
      ],
    },
  };

  it("normalizes movie data correctly", () => {
    const result = normalizeMovie(raw);
    expect(result.externalId).toBe("550");
    expect(result.mediaType).toBe("movie");
    expect(result.title).toBe("Fight Club");
    expect(result.year).toBe(1999);
    expect(result.genres).toHaveLength(2);
    expect(result.runtimeMinutes).toBe(139);
    expect(result.posterPath).toBe("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg");
    expect(result.ratingAverage).toBe(8.4);
    expect(result.trailerKey).toBe("abc123");
    expect(result.seasonCount).toBeNull();
    expect(result.episodeCount).toBeNull();
  });

  it("handles missing release date", () => {
    const result = normalizeMovie({ ...raw, release_date: "" });
    expect(result.year).toBeNull();
  });

  it("handles missing poster", () => {
    const result = normalizeMovie({ ...raw, poster_path: null });
    expect(result.posterPath).toBeNull();
  });

  it("handles no trailer", () => {
    const result = normalizeMovie({ ...raw, videos: undefined });
    expect(result.trailerKey).toBeNull();
  });
});

describe("normalizeTv", () => {
  const raw: TMDbTv = {
    id: 1399,
    name: "Breaking Bad",
    original_name: "Breaking Bad",
    first_air_date: "2008-01-20",
    overview: "Walter White turns to a life of crime.",
    genres: [{ id: 18, name: "Drama" }],
    number_of_seasons: 5,
    number_of_episodes: 62,
    episode_run_time: [45],
    status: "Ended",
    poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    vote_average: 8.9,
    vote_count: 12000,
  };

  it("normalizes TV data correctly", () => {
    const result = normalizeTv(raw);
    expect(result.externalId).toBe("1399");
    expect(result.mediaType).toBe("tv");
    expect(result.title).toBe("Breaking Bad");
    expect(result.year).toBe(2008);
    expect(result.seasonCount).toBe(5);
    expect(result.episodeCount).toBe(62);
    expect(result.status).toBe("Ended");
  });
});

describe("normalizePerson", () => {
  const raw: TMDbPerson = {
    id: 287,
    name: "Brad Pitt",
    biography: "William Bradley Pitt is an actor and film producer.",
    profile_path: "/kU3B75TyRiCgE270EyZnHjfivoq.jpg",
    known_for_department: "Acting",
  };

  it("normalizes person data correctly", () => {
    const result = normalizePerson(raw);
    expect(result.externalId).toBe("287");
    expect(result.name).toBe("Brad Pitt");
    expect(result.knownForDepartment).toBe("Acting");
  });
});

describe("normalizeCast", () => {
  const cast: TMDbCastMember[] = [
    {
      id: 819,
      name: "Edward Norton",
      profile_path: "/5XBzD5WuTyVQZeS4VI25z2moMeY.jpg",
      character: "The Narrator",
      order: 0,
    },
  ];

  it("normalizes cast members", () => {
    const result = normalizeCast(cast);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("cast");
    expect(result[0].character).toBe("The Narrator");
    expect(result[0].person.name).toBe("Edward Norton");
  });
});

describe("normalizeCrew", () => {
  const crew: TMDbCrewMember[] = [
    {
      id: 7467,
      name: "David Fincher",
      profile_path: "/tpEczFclQZeKAiCeKZZ0adRvtfz.jpg",
      job: "Director",
      department: "Directing",
    },
  ];

  it("normalizes crew members", () => {
    const result = normalizeCrew(crew);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("crew");
    expect(result[0].job).toBe("Director");
  });
});

describe("normalizeSearchResult", () => {
  it("normalizes a movie search result", () => {
    const raw: TMDbSearchResult = {
      id: 550,
      media_type: "movie",
      title: "Fight Club",
      release_date: "1999-10-15",
      overview: "A man forms a fight club.",
      poster_path: "/poster.jpg",
      vote_average: 8.4,
      vote_count: 26000,
    };
    const result = normalizeSearchResult(raw);
    expect(result).not.toBeNull();
    expect(result!.mediaType).toBe("movie");
    expect(result!.title).toBe("Fight Club");
  });

  it("returns null for person results", () => {
    const raw: TMDbSearchResult = {
      id: 287,
      media_type: "person",
      name: "Brad Pitt",
      poster_path: null,
    };
    expect(normalizeSearchResult(raw)).toBeNull();
  });
});

describe("normalizePersonCredits", () => {
  const raw: TMDbPersonCreditsResponse = {
    id: 287,
    cast: [
      {
        id: 550,
        media_type: "movie",
        title: "Fight Club",
        release_date: "1999-10-15",
        poster_path: "/poster.jpg",
        character: "Tyler Durden",
      },
    ],
    crew: [
      {
        id: 502,
        media_type: "movie",
        title: "Some Film",
        release_date: "2020-05-10",
        poster_path: null,
        job: "Producer",
        department: "Production",
      },
    ],
  };

  it("combines and sorts credits by year descending", () => {
    const result = normalizePersonCredits(raw);
    expect(result).toHaveLength(2);
    expect(result[0].year).toBe(2020);
    expect(result[1].year).toBe(1999);
  });
});
