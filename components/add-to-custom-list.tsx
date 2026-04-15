"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ListPlus, Check, Loader2 } from "lucide-react";

interface CustomList {
  id: string;
  name: string;
}

interface Props {
  externalId: string;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
}

export function AddToCustomList({
  externalId,
  mediaType,
  title,
  posterPath,
}: Props) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function fetchLists() {
    setLoading(true);
    try {
      const res = await fetch("/api/custom-lists");
      if (!res.ok) return;
      const data = await res.json();
      setLists(data.lists ?? []);
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
      fetchLists();
    }
  }

  function handleAdd(listId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/custom-lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId,
          mediaType,
          title,
          posterPath,
        }),
      });

      if (res.ok) {
        setAddedTo((prev) => new Set(prev).add(listId));
      }
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <ListPlus className="w-4 h-4 mr-1.5" />
        Add to List
      </Button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-64 rounded-lg border border-border bg-popover p-2 shadow-lg",
            "right-0 sm:left-0 sm:right-auto"
          )}
          role="listbox"
          aria-label="Your custom lists"
        >
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : lists.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 px-2 text-center">
              No custom lists yet.
              <br />
              Create one from your{" "}
              <Link href="/lists/custom" className="text-primary hover:underline">
                lists page
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-1">
              {lists.map((list) => {
                const added = addedTo.has(list.id);
                return (
                  <li key={list.id}>
                    <button
                      onClick={() => !added && handleAdd(list.id)}
                      disabled={isPending || added}
                      role="option"
                      aria-selected={added}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                        added
                          ? "bg-primary/10 text-primary cursor-default"
                          : "hover:bg-muted cursor-pointer"
                      )}
                    >
                      <span className="truncate">{list.name}</span>
                      {added && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
