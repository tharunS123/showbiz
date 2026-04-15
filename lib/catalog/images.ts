const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(
  path: string | null,
  size: "w154" | "w342" | "w500" | "original" = "w342"
): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

export function backdropUrl(
  path: string | null,
  size: "w780" | "w1280" | "original" = "w1280"
): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

export function profileUrl(
  path: string | null,
  size: "w185" | "h632" | "original" = "w185"
): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}
