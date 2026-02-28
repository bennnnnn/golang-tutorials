interface Stats {
  xp: number;
  streak_days: number;
  longest_streak: number;
  completed_count: number;
  total_tutorials: number;
  activity_count: number;
}

export default function StatsRow({ stats }: { stats: Stats }) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label="XP" value={stats.xp.toString()} icon="⭐" />
      <StatCard label="Streak" value={`${stats.streak_days}d`} icon="🔥" sub={`Best: ${stats.longest_streak}d`} />
      <StatCard label="Completed" value={`${stats.completed_count}/${stats.total_tutorials}`} icon="✅" />
      <StatCard label="Activities" value={stats.activity_count.toString()} icon="📊" />
    </div>
  );
}

function StatCard({ label, value, icon, sub }: { label: string; value: string; icon: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
      {sub && <p className="text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}
