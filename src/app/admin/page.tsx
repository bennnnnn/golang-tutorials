"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/api-client";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  xp: number;
  streak_days: number;
  created_at: string;
  last_active_at: string | null;
  is_admin: number;
  completed_count: number;
  bookmark_count: number;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/"); return; }

    fetch("/api/admin/users", { credentials: "same-origin" })
      .then(async (res) => {
        if (res.status === 403) { router.push("/"); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setUsers(data.users ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setFetching(false));
  }, [user, loading, router]);

  async function resetProgress(userId: number) {
    if (!confirm("Reset all progress for this user? This cannot be undone.")) return;
    setResetting(userId);
    try {
      const res = await apiFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_progress", userId }),
      });
      if (!res.ok) throw new Error("Failed");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, completed_count: 0, xp: 0, streak_days: 0 } : u
        )
      );
    } catch {
      alert("Failed to reset progress.");
    } finally {
      setResetting(null);
    }
  }

  const filtered = query.trim()
    ? users.filter((u) =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      )
    : users;

  if (loading || fetching) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-6 py-12">
        <div className="mb-6 h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Admin</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {users.length} total users
          </p>
        </div>
      </div>

      {/* Stats summary */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Users",    value: users.length },
          { label: "Total XP Given", value: users.reduce((s, u) => s + u.xp, 0).toLocaleString() },
          { label: "Completions",    value: users.reduce((s, u) => s + u.completed_count, 0) },
          { label: "Bookmarks",      value: users.reduce((s, u) => s + u.bookmark_count, 0) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name or email…"
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </div>

      {/* User table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">User</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">XP</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Done</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Streak</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Joined</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Last Active</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((u) => (
              <tr key={u.id} className="bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
                        {u.name}
                        {u.is_admin === 1 && (
                          <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                            admin
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300">{u.xp}</td>
                <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{u.completed_count}</td>
                <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{u.streak_days}d</td>
                <td className="px-4 py-3 text-right text-zinc-500">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3 text-right text-zinc-500">{formatDate(u.last_active_at)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => resetProgress(u.id)}
                    disabled={resetting === u.id}
                    className="rounded-md border border-orange-300 px-2.5 py-1 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-50 disabled:opacity-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
                  >
                    {resetting === u.id ? "Resetting…" : "Reset Progress"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-600">
        To grant admin access, set <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">is_admin = 1</code> directly in the database for the user.
      </p>
    </div>
  );
}
