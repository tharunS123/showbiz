import { requireUser } from "@/lib/auth";
import { getUserCustomLists } from "@/lib/db/custom-lists";
import { Badge } from "@/components/ui/badge";
import { CustomListForm } from "@/components/custom-list-form";
import Link from "next/link";
import { List, Lock, Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Lists — Showbiz",
};

export default async function CustomListsPage() {
  const user = await requireUser();
  const lists = await getUserCustomLists(user.id);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Custom Lists</h1>
      </div>

      <CustomListForm />

      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <List className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-1">No custom lists yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Create your first list to organize movies and TV shows however you
            like.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/custom/${list.slug}`}
              className="group block rounded-lg border border-border p-5 hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold truncate group-hover:text-primary transition-colors">
                  {list.name}
                </h2>
                <Badge
                  variant={list.is_public ? "secondary" : "outline"}
                  className="shrink-0 text-[10px]"
                >
                  {list.is_public ? (
                    <Globe className="w-3 h-3 mr-1" />
                  ) : (
                    <Lock className="w-3 h-3 mr-1" />
                  )}
                  {list.is_public ? "Public" : "Private"}
                </Badge>
              </div>
              {list.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {list.description}
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Updated{" "}
                {new Date(list.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
