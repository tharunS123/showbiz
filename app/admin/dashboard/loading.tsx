export default function AdminDashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 animate-pulse">
      {/* Heading skeleton */}
      <div className="h-8 w-56 rounded bg-muted" />
      <div className="mt-2 h-4 w-44 rounded bg-muted" />

      {/* Metric cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-3 h-8 w-20 rounded bg-muted" />
            <div className="mt-2 h-3 w-32 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="mt-10">
        <div className="h-6 w-40 rounded bg-muted" />
        <div className="mt-1 h-4 w-32 rounded bg-muted" />
        <div className="mt-4 h-[300px] rounded-lg border border-border bg-card" />
      </div>

      {/* Second chart skeleton */}
      <div className="mt-10">
        <div className="h-6 w-48 rounded bg-muted" />
        <div className="mt-1 h-4 w-24 rounded bg-muted" />
        <div className="mt-4 h-[300px] rounded-lg border border-border bg-card" />
      </div>

      {/* List depth skeleton */}
      <div className="mt-10">
        <div className="h-6 w-44 rounded bg-muted" />
        <div className="mt-1 h-4 w-56 rounded bg-muted" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="mt-3 h-8 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="mt-10 mb-12">
        <div className="h-6 w-36 rounded bg-muted" />
        <div className="mt-1 h-4 w-48 rounded bg-muted" />
        <div className="mt-4 rounded-lg border border-border overflow-hidden">
          <div className="h-10 bg-muted/50" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-border px-4 py-3"
            >
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-5 w-12 rounded-full bg-muted" />
              <div className="ml-auto h-4 w-10 rounded bg-muted" />
              <div className="h-4 w-8 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
