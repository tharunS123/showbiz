import { Skeleton } from "@/components/ui/skeleton";
import { CastCarouselSkeleton } from "@/components/ui/cast-carousel";

export default function TvLoading() {
  return (
    <div>
      <Skeleton className="h-64 md:h-[28rem] w-full" />
      <div className="container mx-auto px-4 -mt-32 relative z-10 pb-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="w-48 aspect-[2/3] rounded-lg shrink-0" />
          <div className="space-y-4 flex-1">
            <Skeleton className="h-10 w-64" />
            <div className="flex gap-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-20 w-full max-w-prose" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-20" />
          <CastCarouselSkeleton />
        </div>
      </div>
    </div>
  );
}
