-- D1 Database Schema for Kip's Forum

-- 1. Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT, -- JSON array string: '["url1", "url2"]'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  deletion_reason TEXT
);

-- 2. Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 3. Moderation Actions Table (Bans, Mutes, Kicks)
CREATE TABLE IF NOT EXISTS moderation (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  username TEXT,
  action_type TEXT NOT NULL, -- 'ban', 'mute', 'kick', 'delete'
  reason TEXT NOT NULL,
  admin_name TEXT DEFAULT 'Kip',
  expires_at DATETIME, -- NULL for permanent, timestamp for mutes
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);