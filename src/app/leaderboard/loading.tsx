export default function LeaderboardLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-6 py-12">
      <div className="mb-6 h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-32 mb-8 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-5 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
