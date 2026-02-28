export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-6 py-12">
      <div className="mb-8 flex items-start gap-5">
        <div className="h-16 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-72 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="mb-2 h-6 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 flex-1 rounded-md bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        ))}
      </div>
    </div>
  );
}
