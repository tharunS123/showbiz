import { TitleCard } from "./title-card";
import type { Title } from "@/lib/catalog/types";

interface TitleRowProps {
  label?: string;
  titles: Title[];
  className?: string;
}

export function TitleRow({ 
  label, 
  titles, 
  className = "" 
}: TitleRowProps) {
  if (!titles.length) return null;

  return (
    <section className={className}>
      {label && (
        <h2 className="text-2xl font-bold text-center mb-8 md:text-left md:mb-6">
          {label}
        </h2>
      )}
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-hide">
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
