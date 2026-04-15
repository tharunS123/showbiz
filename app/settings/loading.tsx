import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-md shrink-0" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="space-y-10" aria-busy="true" aria-label="Loading settings">
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-full" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-10 w-full max-w-xs rounded-md" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-12 w-full max-w-sm rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}
