import { notFound } from "next/navigation";
import { getMovie, getMovieCredits, getSimilarMovies } from "@/lib/catalog/movie";
import { getWatchProviders } from "@/lib/catalog/providers";
import { getCurrentUser } from "@/lib/auth";
import { getUserListStatus } from "@/lib/db/list";
import { Backdrop } from "@/components/ui/backdrop";
import { Poster } from "@/components/ui/poster";
import { FactsGrid } from "@/components/ui/facts-grid";
import { GenreChips } from "@/components/ui/genre-chips";
import { CastCarousel } from "@/components/ui/cast-carousel";
import { TitleRow } from "@/components/ui/title-row";
import { ListToggleButtons } from "@/components/list-toggle-buttons";
import { AddToCustomList } from "@/components/add-to-custom-list";
import { WatchProviders } from "@/components/ui/watch-providers";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovie(id);
  return {
    title: movie ? `${movie.title} (${movie.year}) — Showbiz` : "Movie — Showbiz",
    description: movie?.overview,
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params;
  const [movie, credits, similar, user, watchProviders] = await Promise.all([
    getMovie(id),
    getMovieCredits(id),
    getSimilarMovies(id),
    getCurrentUser(),
    getWatchProviders("movie", id),
  ]);

  if (!movie) notFound();

  const listStatus = user
    ? await getUserListStatus(user.id, id, "movie")
    : null;

  const facts = [
    { label: "Year", value: movie.year?.toString() ?? null },
    {
      label: "Runtime",
      value: movie.runtimeMinutes ? `${movie.runtimeMinutes} min` : null,
    },
    {
      label: "Rating",
      value: movie.ratingAverage
        ? `${movie.ratingAverage.toFixed(1)} / 10`
        : null,
    },
    {
      label: "Votes",
      value: movie.ratingCount ? movie.ratingCount.toLocaleString() : null,
    },
  ];

  const directors =
    credits?.crew.filter((c) => c.job === "Director") ?? [];

  return (
    <div>
      <Backdrop path={movie.backdropPath} alt={movie.title} />

      <div className="container mx-auto px-4 -mt-32 relative z-10 pb-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-6">
          <Poster path={movie.posterPath} title={movie.title} size="lg" />
          <div className="space-y-4 flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">{movie.title}</h1>
            <FactsGrid facts={facts} />
            <GenreChips genres={movie.genres} />
            {directors.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Directed by{" "}
                {directors.map((d) => d.person.name).join(", ")}
              </p>
            )}
            {listStatus && (
              <div className="flex flex-wrap items-center gap-2">
                <ListToggleButtons
                  externalId={id}
                  mediaType="movie"
                  status={listStatus}
                  title={movie.title}
                  posterPath={movie.posterPath}
                />
                <AddToCustomList
                  externalId={id}
                  mediaType="movie"
                  title={movie.title}
                  posterPath={movie.posterPath}
                />
              </div>
            )}
            <p className="text-muted-foreground max-w-prose leading-relaxed line-clamp-6 md:line-clamp-none">
              {movie.overview}
            </p>
          </div>
        </div>

        {watchProviders && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Where to Watch</h2>
            <WatchProviders providers={watchProviders} />
          </section>
        )}

        {movie.trailerKey && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Trailer</h2>
            <div className="aspect-video max-w-2xl rounded-lg overflow-hidden bg-muted">
              <iframe
                src={`https://www.youtube.com/embed/${movie.trailerKey}`}
                title={`${movie.title} trailer`}
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

        <TitleRow label="More Like This" titles={similar} />
      </div>
    </div>
  );
}
