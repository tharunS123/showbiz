import { Skeleton } from "@/components/ui/skeleton";

export default function PersonLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        <Skeleton className="w-48 h-72 rounded-lg shrink-0" />
        <div className="space-y-4 flex-1">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-32 w-full max-w-prose" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
