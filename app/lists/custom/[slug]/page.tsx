import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getCustomListBySlug,
  getCustomListItems,
} from "@/lib/db/custom-lists";
import { posterUrl } from "@/lib/catalog/images";
import { Badge } from "@/components/ui/badge";
import { CopyLinkButton } from "@/components/copy-link-button";
import Image from "next/image";
import Link from "next/link";
import { Lock, Globe, Film } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const list = await getCustomListBySlug(slug);
  if (!list) return { title: "List Not Found — Showbiz" };
  const description = list.description || `Explore ${list.name} on Showbiz.`;
  return {
    title: `${list.name} — Showbiz`,
    description,
    openGraph: {
      title: `${list.name} — Showbiz`,
      description,
    },
  };
}

export default async function CustomListDetailPage({ params }: Props) {
  const { slug } = await params;
  const list = await getCustomListBySlug(slug);
  if (!list) notFound();

  if (!list.is_public) {
    const user = await getCurrentUser();
    if (!user || user.id !== list.user_id) notFound();
  }

  const items = await getCustomListItems(list.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = `${appUrl}/lists/custom/${list.slug}`;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-3xl font-bold">{list.name}</h1>
          <Badge
            variant={list.is_public ? "secondary" : "outline"}
            className="text-[10px]"
          >
            {list.is_public ? (
              <Globe className="w-3 h-3 mr-1" />
            ) : (
              <Lock className="w-3 h-3 mr-1" />
            )}
            {list.is_public ? "Public" : "Private"}
          </Badge>
          {list.is_public && <CopyLinkButton url={shareUrl} />}
        </div>
        {list.description && (
          <p className="text-muted-foreground max-w-2xl">{list.description}</p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Film className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-1">This list is empty</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Browse movies and TV shows, then use the &ldquo;Add to List&rdquo;
            button to add them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => {
            const src = posterUrl(item.poster_path, "w342");
            const href = `/${item.media_type}/${item.external_id}`;

            return (
              <Link key={item.id} href={href} className="group">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                  {src ? (
                    <Image
                      src={src}
                      alt={`${item.title} poster`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs p-2 text-center">
                      {item.title}
                    </div>
                  )}
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 text-[10px] uppercase"
                  >
                    {item.media_type === "tv" ? "TV" : "Film"}
                  </Badge>
                </div>
                <p className="mt-1.5 text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                {item.note && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.note}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
