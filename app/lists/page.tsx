import { requireUser } from "@/lib/auth";
import { getUserList } from "@/lib/db/list";
import { posterUrl } from "@/lib/catalog/images";
import Image from "next/image";
import Link from "next/link";
import { getUserCustomLists } from "@/lib/db/custom-lists";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/rating-stars";
import { NoteEditor } from "@/components/note-editor";
import { Bookmark, Heart, Eye, ListPlus, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import type { ListType } from "@/lib/db/types";

export const metadata: Metadata = {
  title: "My Lists — Showbiz",
};

export default async function ListsPage() {
  const user = await requireUser();

  const [watchlist, favorites, seen, customLists] = await Promise.all([
    getUserList(user.id, "watchlist"),
    getUserList(user.id, "favorite"),
    getUserList(user.id, "seen"),
    getUserCustomLists(user.id),
  ]);

  const sections: { title: string; listType: ListType; icon: typeof Bookmark; items: typeof watchlist }[] = [
    { title: "Watchlist", listType: "watchlist", icon: Bookmark, items: watchlist },
    { title: "Favorites", listType: "favorite", icon: Heart, items: favorites },
    { title: "Seen", listType: "seen", icon: Eye, items: seen },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      <h1 className="text-3xl font-bold">My Lists</h1>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">
              Custom Lists{" "}
              <span className="text-muted-foreground font-normal text-base">
                ({customLists.length})
              </span>
            </h2>
          </div>
          <Link href="/lists/custom">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        {customLists.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No custom lists yet.{" "}
            <Link href="/lists/custom" className="text-primary hover:underline">
              Create one
            </Link>{" "}
            to organize titles your way.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customLists.slice(0, 6).map((list) => (
              <Link
                key={list.id}
                href={`/lists/custom/${list.slug}`}
                className="block rounded-lg border border-border p-4 hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium truncate">{list.name}</p>
                {list.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {list.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {sections.map(({ title, listType, icon: Icon, items }) => (
        <section key={title}>
          <div className="flex items-center gap-2 mb-4">
            <Icon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">
              {title}{" "}
              <span className="text-muted-foreground font-normal text-base">
                ({items.length})
              </span>
            </h2>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No items in your {title.toLowerCase()} yet. Browse movies and TV
              shows to start adding!
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map((item) => {
                const src = posterUrl(item.poster_path, "w342");
                return (
                  <div key={item.id} className="space-y-1.5">
                    <Link
                      href={`/${item.media_type}/${item.external_id}`}
                      className="group block"
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                        {src ? (
                          <Image
                            src={src}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground text-xs p-2 text-center">
                            {item.title}
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                    </Link>
                    <RatingStars
                      externalId={item.external_id}
                      mediaType={item.media_type}
                      listType={listType}
                      initialRating={item.rating}
                    />
                    <NoteEditor
                      externalId={item.external_id}
                      mediaType={item.media_type}
                      listType={listType}
                      initialNote={item.note}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
