import { Compass } from "lucide-react";
import type { Metadata } from "next";
import { MoodSearch } from "@/components/mood-search";

export const metadata: Metadata = {
  title: "Discover — Showbiz",
};

export default function DiscoverPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2 max-w-2xl">
        <div className="flex items-center gap-3">
          <Compass className="w-8 h-8 text-primary shrink-0" aria-hidden />
          <h1 className="text-3xl font-bold tracking-tight">Discover</h1>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Describe your mood in plain language — we&apos;ll translate it into genres,
          runtime, and format, then surface titles that match how you want to feel.
        </p>
      </header>

      <MoodSearch />
    </div>
  );
}
