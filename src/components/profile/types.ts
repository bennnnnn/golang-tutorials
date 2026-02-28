export interface Profile {
  id: number;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  theme: string;
  xp: number;
  streak_days: number;
  longest_streak: number;
  created_at: string;
  last_active_at: string | null;
  is_google: boolean;
}

export interface Stats {
  xp: number;
  streak_days: number;
  longest_streak: number;
  completed_count: number;
  total_tutorials: number;
  activity_count: number;
  created_at: string;
  last_active_at: string | null;
}

export interface Badge {
  key: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface Achievement {
  badge_key: string;
  unlocked_at: string;
}

export interface Bookmark {
  id: number;
  tutorial_slug: string;
  snippet: string;
  note: string;
  created_at: string;
}

export interface ActivityItem {
  id: number;
  action: string;
  detail: string;
  created_at: string;
}
