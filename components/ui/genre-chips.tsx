import type { Genre } from "@/lib/catalog/types";

export function GenreChips({ genres }: { genres: Genre[] }) {
  if (!genres.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((g) => (
        <span
          key={g.id}
          className="rounded-full border border-border px-3 py-0.5 text-xs font-medium"
        >
          {g.name}
        </span>
      ))}
    </div>
  );
}
