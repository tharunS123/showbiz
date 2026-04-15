"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  externalId: string;
  mediaType: "movie" | "tv";
  listType: "watchlist" | "favorite" | "seen";
  initialRating: number | null;
}

export function RatingStars({
  externalId,
  mediaType,
  listType,
  initialRating,
}: Props) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRate(value: number) {
    const newRating = value === rating ? null : value;
    setRating(newRating);
    startTransition(async () => {
      await fetch("/api/list/rate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId,
          mediaType,
          listType,
          rating: newRating,
          note: null,
        }),
      });
    });
  }

  const display = hover ?? rating ?? 0;

  return (
    <div
      className={cn("flex gap-0.5", isPending && "opacity-50")}
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          onClick={() => handleRate(value)}
          onMouseEnter={() => setHover(value)}
          onMouseLeave={() => setHover(null)}
          disabled={isPending}
          role="radio"
          aria-checked={value === rating}
          aria-label={`${value} star${value > 1 ? "s" : ""}`}
          className="p-0.5 hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <Star
            className={cn(
              "w-4 h-4 transition-colors",
              value <= display
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
}
