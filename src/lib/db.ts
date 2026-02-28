import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data.db");

// Use globalThis to persist the DB instance across Turbopack hot reloads
const globalDb = globalThis as unknown as { __db?: Database.Database; __dbMigrated?: boolean };

function migrate(db: Database.Database): void {
  if (globalDb.__dbMigrated) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT 'gopher',
      bio TEXT DEFAULT '',
      theme TEXT DEFAULT 'system',
      xp INTEGER DEFAULT 0,
      streak_days INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      streak_last_date TEXT,
      last_active_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tutorial_slug TEXT NOT NULL,
      completed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, tutorial_slug)
    );

    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id TEXT NOT NULL,
      page_slug TEXT NOT NULL,
      viewed_at TEXT DEFAULT (datetime('now')),
      UNIQUE(visitor_id, page_slug)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_key TEXT NOT NULL,
      unlocked_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, badge_key)
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tutorial_slug TEXT NOT NULL,
      snippet TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      detail TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migrate existing users table (add new columns if missing)
  const addCol = (col: string, def: string) => {
    try { db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`); } catch { /* already exists */ }
  };
  addCol("avatar", "TEXT DEFAULT 'gopher'");
  addCol("bio", "TEXT DEFAULT ''");
  addCol("theme", "TEXT DEFAULT 'system'");
  addCol("xp", "INTEGER DEFAULT 0");
  addCol("streak_days", "INTEGER DEFAULT 0");
  addCol("longest_streak", "INTEGER DEFAULT 0");
  addCol("streak_last_date", "TEXT");
  addCol("last_active_at", "TEXT");
  addCol("google_id", "TEXT");

  globalDb.__dbMigrated = true;
}

function getDb(): Database.Database {
  if (!globalDb.__db) {
    try {
      const db = new Database(dbPath);
      db.pragma("journal_mode = WAL");
      db.pragma("foreign_keys = ON");
      globalDb.__db = db;
    } catch (err) {
      console.error("Failed to open database:", err);
      throw new Error("Database connection failed");
    }
  }
  migrate(globalDb.__db);
  return globalDb.__db;
}

// ─── Types ───────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  google_id: string | null;
  avatar: string;
  bio: string;
  theme: string;
  xp: number;
  streak_days: number;
  longest_streak: number;
  streak_last_date: string | null;
  last_active_at: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  detail: string;
  created_at: string;
}

export interface Bookmark {
  id: number;
  user_id: number;
  tutorial_slug: string;
  snippet: string;
  note: string;
  created_at: string;
}

export interface Achievement {
  badge_key: string;
  unlocked_at: string;
}

// ─── Users ───────────────────────────────────────────

export function createUser(name: string, email: string, passwordHash: string): User {
  const db = getDb();
  const stmt = db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
  const result = stmt.run(name, email, passwordHash);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as User;
}

export function createUserWithGoogle(name: string, email: string, googleId: string): User {
  const db = getDb();
  const result = db.prepare(
    "INSERT INTO users (name, email, password_hash, google_id) VALUES (?, ?, ?, ?)"
  ).run(name, email, "GOOGLE_OAUTH", googleId);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as User;
}

export function getUserByGoogleId(googleId: string): User | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE google_id = ?").get(googleId) as User | undefined;
}

export function linkGoogleId(userId: number, googleId: string): void {
  const db = getDb();
  db.prepare("UPDATE users SET google_id = ? WHERE id = ?").run(googleId, userId);
}

export function getUserByEmail(email: string): User | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

const ALLOWED_PROFILE_FIELDS = new Set(["name", "bio", "avatar", "theme"]);

export function updateUserProfile(userId: number, fields: { name?: string; bio?: string; avatar?: string; theme?: string }): void {
  const db = getDb();
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const [key, val] of Object.entries(fields)) {
    if (!ALLOWED_PROFILE_FIELDS.has(key)) continue; // explicit allowlist — prevents SQL injection
    if (val !== undefined) { sets.push(`${key} = ?`); vals.push(val); }
  }
  if (sets.length === 0) return;
  vals.push(userId);
  db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
}

export function updateUserPassword(userId: number, passwordHash: string): void {
  const db = getDb();
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, userId);
}

export function deleteUser(userId: number): void {
  const db = getDb();
  db.prepare("DELETE FROM users WHERE id = ?").run(userId);
}

export function addXp(userId: number, amount: number): void {
  const db = getDb();
  db.prepare("UPDATE users SET xp = xp + ? WHERE id = ?").run(amount, userId);
}

export function updateStreak(userId: number): { streak_days: number; longest_streak: number } {
  const db = getDb();
  const user = getUserById(userId);
  if (!user) return { streak_days: 0, longest_streak: 0 };

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let streak = user.streak_days;
  let longest = user.longest_streak;

  if (user.streak_last_date === today) {
    // Already counted today
    return { streak_days: streak, longest_streak: longest };
  } else if (user.streak_last_date === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  if (streak > longest) longest = streak;

  db.prepare("UPDATE users SET streak_days = ?, longest_streak = ?, streak_last_date = ?, last_active_at = datetime('now') WHERE id = ?").run(streak, longest, today, userId);
  return { streak_days: streak, longest_streak: longest };
}

// ─── Progress ────────────────────────────────────────

export function getProgress(userId: number): string[] {
  const db = getDb();
  const rows = db.prepare("SELECT tutorial_slug FROM progress WHERE user_id = ? ORDER BY completed_at").all(userId) as { tutorial_slug: string }[];
  return rows.map((r) => r.tutorial_slug);
}

export function getProgressCount(userId: number): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as c FROM progress WHERE user_id = ?").get(userId) as { c: number };
  return row.c;
}

export function markComplete(userId: number, tutorialSlug: string): void {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO progress (user_id, tutorial_slug) VALUES (?, ?)").run(userId, tutorialSlug);
}

export function markIncomplete(userId: number, tutorialSlug: string): void {
  const db = getDb();
  db.prepare("DELETE FROM progress WHERE user_id = ? AND tutorial_slug = ?").run(userId, tutorialSlug);
}

// ─── Achievements ────────────────────────────────────

export function getAchievements(userId: number): Achievement[] {
  const db = getDb();
  return db.prepare("SELECT badge_key, unlocked_at FROM achievements WHERE user_id = ? ORDER BY unlocked_at").all(userId) as Achievement[];
}

export function unlockAchievement(userId: number, badgeKey: string): boolean {
  const db = getDb();
  try {
    db.prepare("INSERT INTO achievements (user_id, badge_key) VALUES (?, ?)").run(userId, badgeKey);
    return true; // newly unlocked
  } catch {
    return false; // already had it
  }
}

// ─── Bookmarks ───────────────────────────────────────

export function getBookmarks(userId: number, limit: number = 50, offset: number = 0): Bookmark[] {
  const db = getDb();
  return db.prepare("SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?").all(userId, limit, offset) as Bookmark[];
}

export function getBookmarkTotal(userId: number): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as c FROM bookmarks WHERE user_id = ?").get(userId) as { c: number };
  return row.c;
}

export function getBookmarkCount(userId: number): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as c FROM bookmarks WHERE user_id = ?").get(userId) as { c: number };
  return row.c;
}

export function addBookmark(userId: number, tutorialSlug: string, snippet: string, note: string): Bookmark {
  const db = getDb();
  const result = db.prepare("INSERT INTO bookmarks (user_id, tutorial_slug, snippet, note) VALUES (?, ?, ?, ?)").run(userId, tutorialSlug, snippet, note);
  return db.prepare("SELECT * FROM bookmarks WHERE id = ?").get(result.lastInsertRowid) as Bookmark;
}

export function deleteBookmark(userId: number, bookmarkId: number): void {
  const db = getDb();
  db.prepare("DELETE FROM bookmarks WHERE id = ? AND user_id = ?").run(bookmarkId, userId);
}

// ─── Activity Log ────────────────────────────────────

export function logActivity(userId: number, action: string, detail: string = ""): void {
  const db = getDb();
  db.prepare("INSERT INTO activity_log (user_id, action, detail) VALUES (?, ?, ?)").run(userId, action, detail);
}

export function getActivityCount(userId: number): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as c FROM activity_log WHERE user_id = ?").get(userId) as { c: number };
  return row.c;
}

export function getRecentActivity(userId: number, limit = 10): ActivityLog[] {
  const db = getDb();
  return db.prepare(
    "SELECT id, action, detail, created_at FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
  ).all(userId, limit) as ActivityLog[];
}

// ─── Password Reset Tokens ───────────────────────────

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  used: number;
  created_at: string;
}

export function createPasswordResetToken(userId: number, token: string, expiresAt: string): void {
  const db = getDb();
  // Invalidate any previous unused tokens for this user
  db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0").run(userId);
  db.prepare("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)").run(userId, token, expiresAt);
}

export function getPasswordResetToken(token: string): PasswordResetToken | undefined {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime('now')"
  ).get(token) as PasswordResetToken | undefined;
}

export function markResetTokenUsed(tokenId: number): void {
  const db = getDb();
  db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE id = ?").run(tokenId);
}

// ─── Anonymous page view tracking ────────────────────

export function recordPageView(visitorId: string, pageSlug: string): void {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO page_views (visitor_id, page_slug) VALUES (?, ?)").run(visitorId, pageSlug);
}

export function getPageViewCount(visitorId: string): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM page_views WHERE visitor_id = ?").get(visitorId) as { count: number };
  return row.count;
}

export function clearPageViews(visitorId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM page_views WHERE visitor_id = ?").run(visitorId);
}
