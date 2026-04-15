"use client";

import { useOptimistic, useTransition } from "react";
import { toggleListItem } from "@/app/actions/list";
import { Bookmark, Heart, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type ListStatus = { watchlist: boolean; favorite: boolean; seen: boolean };

interface Props {
  externalId: string;
  mediaType: "movie" | "tv";
  status: ListStatus;
  title: string;
  posterPath: string | null;
}

export function ListToggleButtons({
  externalId,
  mediaType,
  status,
  title,
  posterPath,
}: Props) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [, startTransition] = useTransition();

  function toggle(listType: keyof ListStatus) {
    const next = { ...optimistic, [listType]: !optimistic[listType] };
    startTransition(async () => {
      setOptimistic(next);
      await toggleListItem({
        externalId,
        mediaType,
        listType,
        add: next[listType],
        title,
        posterPath,
      });
    });
  }

  const buttons = [
    {
      key: "watchlist" as const,
      icon: Bookmark,
      label: "Watchlist",
      activeLabel: "Watchlisted",
    },
    {
      key: "favorite" as const,
      icon: Heart,
      label: "Favorite",
      activeLabel: "Favorited",
    },
    {
      key: "seen" as const,
      icon: Eye,
      label: "Seen",
      activeLabel: "Seen",
    },
  ];

  return (
    <div className="flex gap-2">
      {buttons.map(({ key, icon: Icon, label, activeLabel }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          aria-pressed={optimistic[key]}
          aria-label={optimistic[key] ? `Remove from ${label}` : `Add to ${label}`}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
            optimistic[key]
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:bg-muted"
          )}
        >
          <Icon className={cn("w-4 h-4", optimistic[key] && "fill-current")} />
          {optimistic[key] ? activeLabel : label}
        </button>
      ))}
    </div>
  );
}
