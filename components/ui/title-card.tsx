import Link from "next/link";
import { Poster } from "./poster";
import { Badge } from "./badge";
import { Star } from "lucide-react";
import type { Title } from "@/lib/catalog/types";

export function TitleCard({ title }: { title: Title }) {
  const href = `/${title.mediaType}/${title.externalId}`;

  return (
    <Link href={href} className="group block w-32 sm:w-36 flex-shrink-0">
      <div className="relative">
        <Poster path={title.posterPath} title={title.title} size="md" className="w-full" />
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 text-[10px] uppercase"
        >
          {title.mediaType === "tv" ? "TV" : "Film"}
        </Badge>
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {title.title}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {title.year && <span>{title.year}</span>}
          {title.ratingAverage > 0 && (
            <>
              <span>·</span>
              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
              <span>{title.ratingAverage.toFixed(1)}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
