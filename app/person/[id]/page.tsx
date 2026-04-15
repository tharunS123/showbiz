import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPerson, getPersonCredits } from "@/lib/catalog/person";
import { profileUrl, posterUrl } from "@/lib/catalog/images";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const person = await getPerson(id);
  return {
    title: person ? `${person.name} — Showbiz` : "Person — Showbiz",
    description: person?.bio?.slice(0, 160),
  };
}

export default async function PersonDetailPage({ params }: Props) {
  const { id } = await params;
  const [person, filmography] = await Promise.all([
    getPerson(id),
    getPersonCredits(id),
  ]);

  if (!person) notFound();

  const photo = profileUrl(person.profilePath, "h632");

  const movieCredits = filmography.filter((f) => f.mediaType === "movie");
  const tvCredits = filmography.filter((f) => f.mediaType === "tv");

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="shrink-0">
          <div className="relative w-48 h-72 rounded-lg overflow-hidden bg-muted">
            {photo ? (
              <Image
                src={photo}
                alt={person.name}
                fill
                className="object-cover"
                sizes="192px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
                {person.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4 flex-1">
          <h1 className="text-3xl font-bold">{person.name}</h1>
          {person.knownForDepartment && (
            <p className="text-sm text-muted-foreground">
              Known for: {person.knownForDepartment}
            </p>
          )}
          {person.bio && (
            <p className="text-muted-foreground leading-relaxed max-w-prose whitespace-pre-line">
              {person.bio}
            </p>
          )}
        </div>
      </div>

      {movieCredits.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Movies ({movieCredits.length})
          </h2>
          <div className="space-y-2">
            {movieCredits.map((item) => (
              <Link
                key={item.externalId}
                href={`/movie/${item.externalId}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
              >
                <div className="relative w-10 aspect-[2/3] rounded bg-muted shrink-0 overflow-hidden">
                  {item.posterPath && (
                    <Image
                      src={posterUrl(item.posterPath, "w154")!}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.year ?? "TBA"}
                    {item.character && ` · ${item.character}`}
                    {item.job && ` · ${item.job}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {tvCredits.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">
            TV Shows ({tvCredits.length})
          </h2>
          <div className="space-y-2">
            {tvCredits.map((item) => (
              <Link
                key={item.externalId}
                href={`/tv/${item.externalId}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
              >
                <div className="relative w-10 aspect-[2/3] rounded bg-muted shrink-0 overflow-hidden">
                  {item.posterPath && (
                    <Image
                      src={posterUrl(item.posterPath, "w154")!}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.year ?? "TBA"}
                    {item.character && ` · ${item.character}`}
                    {item.job && ` · ${item.job}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
