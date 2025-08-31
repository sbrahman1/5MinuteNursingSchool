CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  cover_key TEXT,
  pdf_key TEXT NOT NULL,
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_published INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_posts_published
ON posts(is_published, published_at DESC);
