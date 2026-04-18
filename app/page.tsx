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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 pt-16">
            <div className="container mx-auto">
              <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">
                Trending This Week
              </p>
              <h1 className="text-4xl md:text-6xl font-bold text-white max-w-xl mb-4 drop-shadow-lg">
                {hero.title}
              </h1>
              <p className="text-sm text-muted-foreground/90 max-w-lg line-clamp-3 mb-6">
                {hero.overview}
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link href={`/${hero.mediaType}/${hero.externalId}`} className="flex items-center gap-3 px-6 py-3">
                  <Button className="w-auto">
                    View Details
                  </Button>
                </Link>
                <Link href="/for-you" className="flex items-center gap-3 px-6 py-3 border border-primary/50 hover:border-primary/75 transition-all duration-300">
                  <Button variant="outline" className="w-auto gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Get Recommendations
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-12 space-y-16">
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-center md:text-left">
            Trending This Week
          </h2>
          <TitleRow label="" titles={trending} className="overflow-x-auto scrollbar-hide" />
        </section>
        
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-center md:text-left">
            Popular Movies
          </h2>
          <TitleRow label="" titles={popularMovies} className="overflow-x-auto scrollbar-hide" />
        </section>
        
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-center md:text-left">
            Popular TV Shows
          </h2>
          <TitleRow label="" titles={popularTv} className="overflow-x-auto scrollbar-hide" />
        </section>
        
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-center md:text-left">
            Top Rated Movies
          </h2>
          <TitleRow label="" titles={topRated} className="overflow-x-auto scrollbar-hide" />
        </section>
      </div>
    </div>
  );
}
