import { searchMulti } from "@/lib/catalog/search";
import { TitleGrid } from "@/components/ui/title-grid";
import { SearchInput } from "@/components/ui/search-input";
import { Search } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q;
  return {
    title: q ? `"${q}" — Search — Showbiz` : "Search — Showbiz",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q ?? "";
  const page = Number(params.page ?? "1");

  const data = query
    ? await searchMulti(query, page)
    : { results: [], totalPages: 0, totalResults: 0 };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="max-w-xl mx-auto">
        <Suspense>
          <SearchInput className="w-full" />
        </Suspense>
      </div>

      {query ? (
        <>
          <p className="text-sm text-muted-foreground">
            {data.totalResults} result{data.totalResults !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
          {data.results.length > 0 ? (
            <TitleGrid titles={data.results} />
          ) : (
            <div className="text-center py-16 space-y-3">
              <Search className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm text-muted-foreground">
                Try a different search term or browse our trending titles.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 space-y-3">
          <Search className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-lg font-medium">Search movies & TV shows</p>
          <p className="text-sm text-muted-foreground">
            Type in the search box above to find titles.
          </p>
        </div>
      )}
    </div>
  );
}
