import type { Badge, Achievement, Stats } from "./types";

interface Props {
  stats: Stats;
  badges: Badge[];
  achievements: Achievement[];
}

export default function OverviewTab({ stats, badges, achievements }: Props) {
  const pct = stats.total_tutorials > 0 ? (stats.completed_count / stats.total_tutorials) * 100 : 0;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Tutorial Progress</h2>
      <div className="mb-3 h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full rounded-full bg-cyan-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        {stats.completed_count} of {stats.total_tutorials} tutorials completed
      </p>

      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Recent Badges</h2>
      {achievements.length === 0 ? (
        <p className="text-sm text-zinc-400">No badges yet — keep learning!</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {achievements.slice(0, 4).map((a) => {
            const badge = badges.find((b) => b.key === a.badge_key);
            return badge ? (
              <div key={a.badge_key} className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                <span className="text-xl">{badge.icon}</span>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{badge.name}</span>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
