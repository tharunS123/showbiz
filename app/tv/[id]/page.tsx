import { notFound } from "next/navigation";
import { getTv, getTvCredits, getSimilarShows } from "@/lib/catalog/tv";
import { getWatchProviders } from "@/lib/catalog/providers";
import { getCurrentUser } from "@/lib/auth";
import { getUserListStatus } from "@/lib/db/list";
import { Backdrop } from "@/components/ui/backdrop";
import { Poster } from "@/components/ui/poster";
import { FactsGrid } from "@/components/ui/facts-grid";
import { GenreChips } from "@/components/ui/genre-chips";
import { CastCarousel } from "@/components/ui/cast-carousel";
import { TitleRow } from "@/components/ui/title-row";
import { WatchProviders } from "@/components/ui/watch-providers";
import { ListToggleButtons } from "@/components/list-toggle-buttons";
import { AddToCustomList } from "@/components/add-to-custom-list";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const show = await getTv(id);
  return {
    title: show ? `${show.title} (${show.year}) — Showbiz` : "TV Show — Showbiz",
    description: show?.overview,
  };
}

export default async function TvDetailPage({ params }: Props) {
  const { id } = await params;
  const [show, credits, similar, user, watchProviders] = await Promise.all([
    getTv(id),
    getTvCredits(id),
    getSimilarShows(id),
    getCurrentUser(),
    getWatchProviders("tv", id),
  ]);

  if (!show) notFound();

  const listStatus = user
    ? await getUserListStatus(user.id, id, "tv")
    : null;

  const facts = [
    { label: "First Aired", value: show.year?.toString() ?? null },
    {
      label: "Seasons",
      value: show.seasonCount?.toString() ?? null,
    },
    {
      label: "Episodes",
      value: show.episodeCount?.toString() ?? null,
    },
    { label: "Status", value: show.status },
    {
      label: "Rating",
      value: show.ratingAverage
        ? `${show.ratingAverage.toFixed(1)} / 10`
        : null,
    },
  ];

  return (
    <div>
      <Backdrop path={show.backdropPath} alt={show.title} />

      <div className="container mx-auto px-4 -mt-32 relative z-10 pb-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-6">
          <Poster path={show.posterPath} title={show.title} size="lg" />
          <div className="space-y-4 flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">{show.title}</h1>
            <FactsGrid facts={facts} />
            <GenreChips genres={show.genres} />
            {listStatus && (
              <div className="flex flex-wrap items-center gap-2">
                <ListToggleButtons
                  externalId={id}
                  mediaType="tv"
                  status={listStatus}
                  title={show.title}
                  posterPath={show.posterPath}
                />
                <AddToCustomList
                  externalId={id}
                  mediaType="tv"
                  title={show.title}
                  posterPath={show.posterPath}
                />
              </div>
            )}
            <p className="text-muted-foreground max-w-prose leading-relaxed">
              {show.overview}
            </p>
          </div>
        </div>

        {watchProviders && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Where to Watch</h2>
            <WatchProviders providers={watchProviders} />
          </section>
        )}

        {show.trailerKey && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Trailer</h2>
            <div className="aspect-video max-w-2xl rounded-lg overflow-hidden bg-muted">
              <iframe
                src={`https://www.youtube.com/embed/${show.trailerKey}`}
                title={`${show.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </section>
        )}

        {credits && credits.cast.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Cast</h2>
            <CastCarousel credits={credits.cast} />
          </section>
        )}

        <TitleRow label="Similar Shows" titles={similar} />
      </div>
    </div>
  );
}
