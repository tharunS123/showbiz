import { getTrending, getPopular, getTopRated } from "@/lib/catalog/trending";
import { TitleRow } from "@/components/ui/title-row";
import { Backdrop } from "@/components/ui/backdrop";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default async function HomePage() {
  const [trending, popularMovies, popularTv, topRated] = await Promise.all([
    getTrending("all", "week"),
    getPopular("movie"),
    getPopular("tv"),
    getTopRated("movie"),
  ]);

  const hero = trending[0];

  return (
    <div>
      {hero && (
        <div className="relative">
          <Backdrop path={hero.backdropPath} alt={hero.title} />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="container mx-auto">
              <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">
                Trending This Week
              </p>
              <h1 className="text-3xl md:text-5xl font-bold max-w-xl mb-3">
                {hero.title}
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg line-clamp-2 mb-4">
                {hero.overview}
              </p>
              <div className="flex gap-3">
                <Link href={`/${hero.mediaType}/${hero.externalId}`}>
                  <Button>View Details</Button>
                </Link>
                <Link href="/for-you">
                  <Button variant="outline" className="gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Get Recommendations
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 space-y-10">
        <TitleRow label="Trending" titles={trending} />
        <TitleRow label="Popular Movies" titles={popularMovies} />
        <TitleRow label="Popular TV Shows" titles={popularTv} />
        <TitleRow label="Top Rated" titles={topRated} />
      </div>
    </div>
  );
}
