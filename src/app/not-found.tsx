import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <span className="text-6xl">🐹</span>
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Page Not Found
      </h2>
      <p className="text-sm text-zinc-500">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-cyan-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
