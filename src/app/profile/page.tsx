"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ProfileHeader from "@/components/profile/ProfileHeader";
import StatsRow from "@/components/profile/StatsRow";
import OverviewTab from "@/components/profile/OverviewTab";
import AchievementsTab from "@/components/profile/AchievementsTab";
import BookmarksTab from "@/components/profile/BookmarksTab";
import SettingsTab from "@/components/profile/SettingsTab";
import type { Profile, Stats, Badge, Achievement, Bookmark } from "@/components/profile/types";

export default function ProfilePageWrapper() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProfilePage />
    </Suspense>
  );
}

function Spinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent" />
    </div>
  );
}

const VALID_TABS = ["overview", "achievements", "bookmarks", "settings"] as const;
type Tab = (typeof VALID_TABS)[number];

function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bmHasMore, setBmHasMore] = useState(false);
  const [bmLoading, setBmLoading] = useState(false);
  const [bmTotal, setBmTotal] = useState(0);
  const [error, setError] = useState("");

  const paramTab = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(paramTab && VALID_TABS.includes(paramTab) ? paramTab : "overview");

  useEffect(() => {
    const newTab = paramTab && VALID_TABS.includes(paramTab) ? paramTab : "overview";
    setTab(newTab);
  }, [paramTab]);

  const fetchProfile = useCallback(async () => {
    try {
      const [profRes, statsRes, bmRes] = await Promise.all([
        fetch("/api/profile", { credentials: "same-origin" }),
        fetch("/api/profile/stats", { credentials: "same-origin" }),
        fetch("/api/bookmarks", { credentials: "same-origin" }),
      ]);

      if (profRes.status === 401 || statsRes.status === 401) {
        router.push("/");
        return;
      }
      if (!profRes.ok || !statsRes.ok) {
        setError(`Failed to load profile (${profRes.status}, ${statsRes.status})`);
        return;
      }

      const profData = await profRes.json();
      const statsData = await statsRes.json();
      const bmData = bmRes.ok ? await bmRes.json() : { bookmarks: [] };

      if (profData.profile) setProfile(profData.profile);
      if (statsData.stats) {
        setStats(statsData.stats);
        setBadges(statsData.all_badges);
        setAchievements(statsData.achievements);
      }
      if (bmData.bookmarks) {
        setBookmarks(bmData.bookmarks);
        setBmHasMore(bmData.hasMore ?? false);
        setBmTotal(bmData.total ?? 0);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError("Failed to load profile data.");
    }
  }, [router]);

  useEffect(() => {
    if (!loading && !user) { router.push("/"); return; }
    if (user) fetchProfile();
  }, [user, loading, router, fetchProfile]);

  // --- Callbacks passed to child components ---

  const saveProfile = async (data: { name: string; bio: string; avatar: string; theme: string }): Promise<boolean> => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      setProfile(json.profile);
      applyTheme(data.theme);
      return true;
    }
    return false;
  };

  // Returns null on success, error string on failure
  const changePassword = async (currentPw: string, newPw: string): Promise<string | null> => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    if (res.ok) return null;
    const data = await res.json();
    return data.error || "Failed to change password";
  };

  const deleteAccount = async () => {
    await fetch("/api/profile", { method: "DELETE", credentials: "same-origin" });
    logout();
    router.push("/");
  };

  const deleteBookmark = async (id: number) => {
    await fetch("/api/bookmarks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id }),
    });
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    setBmTotal((prev) => Math.max(0, prev - 1));
  };

  const loadMoreBookmarks = async () => {
    setBmLoading(true);
    try {
      const res = await fetch(`/api/bookmarks?offset=${bookmarks.length}`, { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        setBookmarks((prev) => [...prev, ...data.bookmarks]);
        setBmHasMore(data.hasMore ?? false);
      }
    } catch { /* ignore */ }
    setBmLoading(false);
  };

  // --- Render ---

  if (loading || (!profile && !error)) return <Spinner />;

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={fetchProfile} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700">Retry</button>
      </div>
    );
  }

  if (!profile || !stats) return <Spinner />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <ProfileHeader
        name={profile.name}
        email={profile.email}
        bio={profile.bio}
        avatar={profile.avatar}
        createdAt={profile.created_at}
      />
      <StatsRow stats={stats} />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        {VALID_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-white text-zinc-900 shadow dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab stats={stats} badges={badges} achievements={achievements} />}
      {tab === "achievements" && <AchievementsTab badges={badges} achievements={achievements} />}
      {tab === "bookmarks" && (
        <BookmarksTab
          bookmarks={bookmarks}
          hasMore={bmHasMore}
          total={bmTotal}
          onDelete={deleteBookmark}
          onLoadMore={loadMoreBookmarks}
          loadingMore={bmLoading}
        />
      )}
      {tab === "settings" && (
        <SettingsTab
          profile={profile}
          onSave={saveProfile}
          onChangePassword={changePassword}
          onDeleteAccount={deleteAccount}
        />
      )}
    </div>
  );
}

function applyTheme(theme: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("theme", theme);
  const html = document.documentElement;
  html.classList.remove("light", "dark");
  if (theme === "dark") html.classList.add("dark");
  else if (theme === "light") html.classList.add("light");
}
