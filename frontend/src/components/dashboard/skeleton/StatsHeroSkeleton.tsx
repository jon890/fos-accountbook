export function StatsHeroSkeleton() {
  return (
    <>
      <div className="rounded-[var(--radius-xl)] p-5 md:p-6 mb-4 bg-bg-muted animate-pulse">
        <div className="h-3.5 w-28 rounded bg-bg-muted/60 mb-3" />
        <div className="h-10 w-48 rounded bg-bg-muted/60 mb-4" />
        <div className="h-1.5 w-full rounded-full bg-bg-muted/60 mb-2" />
        <div className="flex justify-between">
          <div className="h-3 w-36 rounded bg-bg-muted/60" />
          <div className="h-3 w-16 rounded bg-bg-muted/60" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-bg-elev rounded-[var(--radius-lg)] p-4 md:px-6 md:py-5 animate-pulse"
          >
            <div className="h-3 w-20 rounded bg-bg-muted mb-2" />
            <div className="h-6 w-28 rounded bg-bg-muted" />
          </div>
        ))}
      </div>
    </>
  );
}
