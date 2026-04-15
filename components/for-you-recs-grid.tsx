"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";

interface RecItem {
  title: {
    externalId: string;
    mediaType: string;
    title: string;
    posterPath: string | null;
    ratingAverage: number;
    year: number | null;
  };
  explanation: string;
}

interface Props {
  items: RecItem[];
  recsVersion: string;
}

async function trackInteraction(payload: {
  eventType: "rec_impression" | "rec_click";
  externalId: string;
  mediaType: "movie" | "tv";
  context?: Record<string, unknown>;
}) {
  try {
    await fetch("/api/interaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // best-effort only; do not block UI
  }
}

export function ForYouRecsGrid({ items, recsVersion }: Props) {
  useEffect(() => {
    const toTrack = items.slice(0, 20);
    Promise.allSettled(
      toTrack.map((item, index) =>
        trackInteraction({
          eventType: "rec_impression",
          externalId: item.title.externalId,
          mediaType: item.title.mediaType as "movie" | "tv",
          context: {
            recsVersion,
            position: index + 1,
          },
        })
      )
    );
  }, [items, recsVersion]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, index) => (
        <Link
          key={item.title.externalId}
          href={`/${item.title.mediaType}/${item.title.externalId}`}
          className="flex gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors group"
          onClick={() => {
            void trackInteraction({
              eventType: "rec_click",
              externalId: item.title.externalId,
              mediaType: item.title.mediaType as "movie" | "tv",
              context: {
                recsVersion,
                position: index + 1,
              },
            });
          }}
        >
          <div className="relative w-20 aspect-[2/3] rounded-lg overflow-hidden bg-muted shrink-0">
            {item.title.posterPath && (
              <Image
                src={`https://image.tmdb.org/t/p/w154${item.title.posterPath}`}
                alt={item.title.title}
                fill
                className="object-cover"
                sizes="80px"
              />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="font-semibold truncate group-hover:text-primary transition-colors">
              {item.title.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.title.year} · {item.title.ratingAverage?.toFixed(1)}/10
            </p>
            <p className="text-sm text-muted-foreground leading-snug">
              {item.explanation}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
