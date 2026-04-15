"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TitleGrid } from "@/components/ui/title-grid";
import { cn } from "@/lib/utils";
import type { Title } from "@/lib/catalog/types";
import { Search, AlertCircle } from "lucide-react";

const SUGGESTIONS = [
  "cozy mystery",
  "intense action under 2 hours",
  "lighthearted comedy",
  "dark thriller series",
] as const;

type MoodFilters = {
  genreIds: number[];
  excludeGenreIds: number[];
  maxRuntime: number | null;
  mediaType: "movie" | "tv" | "both";
};

type MoodResponse = {
  titles: Title[];
  filters: MoodFilters;
};

/** TMDb movie/TV genre id → short label for filter chips */
const GENRE_ID_LABEL: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

function filterChips(filters: MoodFilters): string[] {
  const chips: string[] = [];

  for (const id of filters.genreIds) {
    const label = GENRE_ID_LABEL[id] ?? `Genre ${id}`;
    chips.push(label);
  }

  for (const id of filters.excludeGenreIds) {
    const label = GENRE_ID_LABEL[id] ?? `Genre ${id}`;
    chips.push(`Exclude ${label}`);
  }

  if (filters.maxRuntime != null) {
    chips.push(`< ${filters.maxRuntime} min`);
  }

  if (filters.mediaType === "movie") {
    chips.push("Movies");
  } else if (filters.mediaType === "tv") {
    chips.push("TV series");
  } else {
    chips.push("Movies & TV");
  }

  return chips;
}

function ResultsSkeleton() {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
      aria-hidden
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="w-full aspect-[2/3] rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function MoodSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MoodResponse | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setError("Describe what you are in the mood for to get picks.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/mood?q=${encodeURIComponent(trimmed)}`,
        { method: "GET" }
      );

      if (res.status === 429) {
        setError("Too many requests. Please wait a moment and try again.");
        setData(null);
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Something went wrong. Try again.");
        setData(null);
        return;
      }

      const json = (await res.json()) as MoodResponse;
      setData(json);
    } catch {
      setError("Network error. Check your connection and try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(query);
  };

  const chips = data ? filterChips(data.filters) : [];

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe what you're in the mood for..."
            className={cn(
              "h-12 sm:h-14 text-base sm:text-lg px-4 rounded-xl border-border/80",
              "bg-background/80 backdrop-blur-sm shadow-sm"
            )}
            aria-label="Mood description"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="lg"
            className="h-12 sm:h-14 px-8 shrink-0 rounded-xl gap-2"
            disabled={loading}
          >
            <Search className="w-5 h-5" aria-hidden />
            Discover
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-xs text-muted-foreground w-full text-center sm:w-auto sm:mr-1">
            Try:
          </span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s);
                void runSearch(s);
              }}
              className={cn(
                "inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1.5",
                "text-xs font-medium text-foreground transition-colors",
                "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div
          className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48 mx-auto rounded-full" />
          <ResultsSkeleton />
        </div>
      )}

      {!loading && data && (
        <div className="space-y-4">
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Applied
              </span>
              {chips.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
          <TitleGrid titles={data.titles} />
        </div>
      )}
    </div>
  );
}
