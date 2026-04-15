"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const TMDB_GENRES: { id: number; name: string }[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

const CONTENT_RATINGS = ["G", "PG", "PG-13", "R", "NC-17"] as const;

type PreferencesShape = {
  excluded_genres: number[];
  max_content_rating: string | null;
  hide_spoilers: boolean;
};

function parsePreferences(json: unknown): PreferencesShape | null {
  if (!json || typeof json !== "object") return null;
  const prefs = (json as { preferences?: unknown }).preferences;
  if (!prefs || typeof prefs !== "object") return null;
  const p = prefs as Record<string, unknown>;
  const excluded = p.excluded_genres;
  if (!Array.isArray(excluded) || !excluded.every((x) => typeof x === "number")) {
    return null;
  }
  const max = p.max_content_rating;
  if (max !== null && max !== undefined && typeof max !== "string") {
    return null;
  }
  if (typeof p.hide_spoilers !== "boolean") return null;
  return {
    excluded_genres: excluded,
    max_content_rating: max === undefined ? null : (max as string | null),
    hide_spoilers: p.hide_spoilers,
  };
}

export function PreferencesForm() {
  const baseId = useId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [excludedGenres, setExcludedGenres] = useState<number[]>([]);
  const [maxContentRating, setMaxContentRating] = useState<string>("");
  const [hideSpoilers, setHideSpoilers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/preferences", { cache: "no-store" });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg =
          typeof errBody?.error === "string"
            ? errBody.error
            : `Could not load preferences (${res.status})`;
        setFetchError(msg);
        return;
      }
      const data = await res.json();
      const prefs = parsePreferences(data);
      if (!prefs) {
        setFetchError("Unexpected response from server.");
        return;
      }
      setExcludedGenres([...prefs.excluded_genres]);
      setMaxContentRating(prefs.max_content_rating ?? "");
      setHideSpoilers(prefs.hide_spoilers);
    } catch {
      setFetchError("Network error while loading preferences.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleGenre = (id: number) => {
    setExcludedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
    setSuccess(null);
    setSubmitError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSubmitError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          excluded_genres: excludedGenres,
          max_content_rating: maxContentRating === "" ? null : maxContentRating,
          hide_spoilers: hideSpoilers,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data?.error === "string"
            ? data.error
            : `Save failed (${res.status})`;
        setSubmitError(msg);
        return;
      }
      const prefs = parsePreferences({ preferences: data.preferences });
      if (prefs) {
        setExcludedGenres([...prefs.excluded_genres]);
        setMaxContentRating(prefs.max_content_rating ?? "");
        setHideSpoilers(prefs.hide_spoilers);
      }
      setSuccess("Your preferences were saved.");
    } catch {
      setSubmitError("Network error while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-10" aria-busy="true" aria-live="polite" aria-label="Loading preferences">
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-10 w-full max-w-xs rounded-md" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-full max-w-sm rounded-md" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {(fetchError || submitError || success) && (
        <div className="space-y-2">
          {fetchError && (
            <div
              role="alert"
              className="flex flex-col gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{fetchError}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-destructive/40"
                onClick={() => void load()}
              >
                Try again
              </Button>
            </div>
          )}
          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{submitError}</span>
            </div>
          )}
          {success && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>{success}</span>
            </div>
          )}
        </div>
      )}

      <section
        aria-labelledby={`${baseId}-genres-heading`}
        className="space-y-3"
      >
        <div>
          <h2 id={`${baseId}-genres-heading`} className="text-lg font-semibold">
            Excluded Genres
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Checked genres are excluded from your recommendations.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {TMDB_GENRES.map(({ id, name }) => {
            const inputId = `${baseId}-genre-${id}`;
            const checked = excludedGenres.includes(id);
            return (
              <label
                key={id}
                htmlFor={inputId}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                  "border-border hover:bg-muted/50",
                  checked && "border-primary/60 bg-primary/10"
                )}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleGenre(id)}
                  className="h-4 w-4 shrink-0 rounded border-input accent-primary"
                />
                <span className="truncate">{name}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby={`${baseId}-rating-heading`}
        className="space-y-3"
      >
        <div>
          <h2 id={`${baseId}-rating-heading`} className="text-lg font-semibold">
            Max Content Rating
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Titles above this rating won&apos;t be recommended. Choose &quot;No limit&quot; for
            any rating.
          </p>
        </div>
        <select
          id={`${baseId}-rating`}
          value={maxContentRating}
          onChange={(e) => {
            setMaxContentRating(e.target.value);
            setSuccess(null);
            setSubmitError(null);
          }}
          className={cn(
            "flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          <option value="">No limit</option>
          {CONTENT_RATINGS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </section>

      <section
        aria-labelledby={`${baseId}-spoilers-heading`}
        className="space-y-3"
      >
        <div>
          <h2 id={`${baseId}-spoilers-heading`} className="text-lg font-semibold">
            Hide Spoilers
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reduce plot details in summaries and explanations where supported.
          </p>
        </div>
        <label
          htmlFor={`${baseId}-spoilers`}
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 max-w-sm hover:bg-muted/40"
        >
          <input
            id={`${baseId}-spoilers`}
            type="checkbox"
            checked={hideSpoilers}
            onChange={(e) => {
              setHideSpoilers(e.target.checked);
              setSuccess(null);
              setSubmitError(null);
            }}
            className="h-4 w-4 shrink-0 rounded border-input accent-primary"
          />
          <span className="text-sm font-medium">Hide spoilers</span>
        </label>
      </section>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}
