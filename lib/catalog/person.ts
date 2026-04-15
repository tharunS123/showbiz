import { tmdbFetch } from "./client";
import { endpoints } from "./endpoints";
import { normalizePerson, normalizePersonCredits } from "./normalize";
import { TTL } from "@/lib/cache/ttl";
import type { TMDbPerson, TMDbPersonCreditsResponse, Person, FilmographyItem } from "./types";
import { unstable_cache } from "next/cache";

export const getPerson = unstable_cache(
  async (id: string): Promise<Person | null> => {
    try {
      const data = await tmdbFetch<TMDbPerson>(
        endpoints.person(id),
        undefined,
        TTL.PERSON
      );
      return normalizePerson(data);
    } catch {
      return null;
    }
  },
  ["person-detail"],
  { revalidate: TTL.PERSON }
);

export const getPersonCredits = unstable_cache(
  async (id: string): Promise<FilmographyItem[]> => {
    try {
      const data = await tmdbFetch<TMDbPersonCreditsResponse>(
        endpoints.personCombinedCredits(id),
        undefined,
        TTL.PERSON
      );
      return normalizePersonCredits(data);
    } catch {
      return [];
    }
  },
  ["person-credits"],
  { revalidate: TTL.PERSON }
);
