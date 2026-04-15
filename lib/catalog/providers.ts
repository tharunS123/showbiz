import { tmdbFetch } from "./client";
import { endpoints } from "./endpoints";
import { TTL } from "@/lib/cache/ttl";

export interface WatchProvider {
  providerId: number;
  providerName: string;
  logoPath: string | null;
  displayPriority: number;
}

export interface WatchProviderResult {
  link: string | null;
  flatrate: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

interface TMDbWatchProviderEntry {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
}

interface TMDbWatchProvidersResponse {
  id: number;
  results: Record<
    string,
    {
      link?: string;
      flatrate?: TMDbWatchProviderEntry[];
      rent?: TMDbWatchProviderEntry[];
      buy?: TMDbWatchProviderEntry[];
    }
  >;
}

function normalizeProvider(raw: TMDbWatchProviderEntry): WatchProvider {
  return {
    providerId: raw.provider_id,
    providerName: raw.provider_name,
    logoPath: raw.logo_path,
    displayPriority: raw.display_priority,
  };
}

export async function getWatchProviders(
  mediaType: "movie" | "tv",
  id: string,
  region = "US"
): Promise<WatchProviderResult | null> {
  try {
    const endpoint =
      mediaType === "movie"
        ? endpoints.movieWatchProviders(id)
        : endpoints.tvWatchProviders(id);

    const data = await tmdbFetch<TMDbWatchProvidersResponse>(
      endpoint,
      undefined,
      TTL.DETAIL
    );

    const regionData = data.results[region];
    if (!regionData) return null;

    return {
      link: regionData.link ?? null,
      flatrate: (regionData.flatrate ?? []).map(normalizeProvider),
      rent: (regionData.rent ?? []).map(normalizeProvider),
      buy: (regionData.buy ?? []).map(normalizeProvider),
    };
  } catch {
    return null;
  }
}
