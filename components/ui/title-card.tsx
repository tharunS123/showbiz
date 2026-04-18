import Link from "next/link";
import { Poster } from "./poster";
import { Badge } from "./badge";
import { Star } from "lucide-react";
import type { Title } from "@/lib/catalog/types";

export function TitleCard({ title }: { title: Title }) {
  const href = `/${title.mediaType}/${title.externalId}`;

  return (
    <Link href={href} className="group block w-32 sm:w-36 flex-shrink-0 rounded-lg overflow-hidden hover:-translate-y-1 transition-transform duration-300">
      <div className="relative">
        <Poster path={title.posterPath} title={title.title} size="md" className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black/60 pointer-events-none" />
        <Badge
          variant="secondary"
          className="absolute top-3 left-3 text-[11px] font-medium uppercase backdrop-blur-sm"
        >
          {title.mediaType === "tv" ? "TV" : "Film"}
        </Badge>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-transparent to-black/80">
        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1.5 group-hover:text-primary/90 transition-colors duration-300">
          {title.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
          {title.year && <span>{title.year}</span>}
          {title.ratingAverage > 0 && (
            <>
              <span className="mx-1">·</span>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-1">{title.ratingAverage.toFixed(1)}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
