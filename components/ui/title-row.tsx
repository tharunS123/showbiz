import { TitleCard } from "./title-card";
import type { Title } from "@/lib/catalog/types";

interface TitleRowProps {
  label: string;
  titles: Title[];
}

export function TitleRow({ label, titles }: TitleRowProps) {
  if (!titles.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{label}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {titles.map((title) => (
          <TitleCard
            key={`${title.mediaType}-${title.externalId}`}
            title={title}
          />
        ))}
      </div>
    </section>
  );
}
