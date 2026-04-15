import Image from "next/image";
import Link from "next/link";
import { profileUrl } from "@/lib/catalog/images";
import type { Credit } from "@/lib/catalog/types";
import { Skeleton } from "./skeleton";

export function CastCarousel({ credits }: { credits: Credit[] }) {
  if (!credits.length) {
    return (
      <p className="text-sm text-muted-foreground">No cast information available.</p>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin" role="list" tabIndex={0} aria-label="Cast members">
      {credits.map((credit) => {
        const src = profileUrl(credit.person.profilePath);
        return (
          <Link
            key={`${credit.person.externalId}-${credit.character ?? credit.ordering}`}
            href={`/person/${credit.person.externalId}`}
            className="flex-shrink-0 w-24 text-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
            role="listitem"
          >
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted mx-auto mb-2">
              {src ? (
                <Image
                  src={src}
                  alt={credit.person.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                  {credit.person.name.charAt(0)}
                </div>
              )}
            </div>
            <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
              {credit.person.name}
            </p>
            {credit.character && (
              <p className="text-xs text-muted-foreground truncate">
                {credit.character}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function CastCarouselSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-24 space-y-2">
          <Skeleton className="w-24 h-24 rounded-full mx-auto" />
          <Skeleton className="h-3 w-3/4 mx-auto" />
          <Skeleton className="h-3 w-1/2 mx-auto" />
        </div>
      ))}
    </div>
  );
}
