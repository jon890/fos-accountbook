export function DashboardHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between pt-2 pb-4 md:pb-6 animate-pulse">
      <div>
        <div className="h-3.5 w-20 bg-bg-muted rounded mb-1.5" />
        <div className="h-7 md:h-8 w-36 md:w-44 bg-bg-muted rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="size-9 rounded-full bg-bg-muted" />
        <div className="flex">
          <div className="size-8 rounded-full bg-bg-muted" />
          <div className="size-8 rounded-full bg-bg-muted -ml-2" />
        </div>
      </div>
    </div>
  );
}
