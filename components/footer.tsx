import { TMDbAttribution } from "@/components/ui/tmdb-attribution";
import { Film } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Film className="w-4 h-4" />
          <span>&copy; {new Date().getFullYear()} Showbiz</span>
        </div>
        <TMDbAttribution />
      </div>
    </footer>
  );
}
