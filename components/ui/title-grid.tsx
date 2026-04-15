import { TitleCard } from "./title-card";
import type { Title } from "@/lib/catalog/types";

export function TitleGrid({ titles }: { titles: Title[] }) {
  if (!titles.length) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nothing to show here yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {titles.map((title) => (
        <TitleCard key={`${title.mediaType}-${title.externalId}`} title={title} />
      ))}
    </div>
  );
}
