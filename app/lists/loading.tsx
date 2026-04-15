import { Skeleton } from "@/components/ui/skeleton";

export default function ListsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      <Skeleton className="h-9 w-40" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-7 w-32" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
