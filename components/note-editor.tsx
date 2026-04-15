"use client";

import { useState, useTransition, useRef } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Check, Loader2 } from "lucide-react";

interface Props {
  externalId: string;
  mediaType: "movie" | "tv";
  listType: "watchlist" | "favorite" | "seen";
  initialNote: string | null;
}

export function NoteEditor({
  externalId,
  mediaType,
  listType,
  initialNote,
}: Props) {
  const [note, setNote] = useState(initialNote ?? "");
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function save() {
    setEditing(false);
    startTransition(async () => {
      await fetch("/api/list/rate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId,
          mediaType,
          listType,
          rating: null,
          note: note.trim() || null,
        }),
      });
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    }
    if (e.key === "Escape") {
      setEditing(false);
      setNote(initialNote ?? "");
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setEditing(true);
          setTimeout(() => textareaRef.current?.focus(), 0);
        }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Pencil className="w-3 h-3" />
        )}
        {note ? (
          <span className="truncate max-w-[150px]">{note}</span>
        ) : (
          <span>Add note</span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-start gap-1">
      <textarea
        ref={textareaRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        maxLength={500}
        rows={2}
        placeholder="Personal note..."
        className={cn(
          "flex-1 text-xs rounded-md border border-input bg-background px-2 py-1",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          "resize-none"
        )}
      />
      <button
        onClick={save}
        className="p-1 text-primary hover:text-primary/80"
        aria-label="Save note"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
