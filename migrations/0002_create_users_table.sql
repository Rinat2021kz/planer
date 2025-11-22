-- Migration number: 0002 	 2025-11-13T15:30:03.220Z

-- Create users table to store basic profile information linked to Firebase UID
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,              -- Firebase UID
    email TEXT NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    last_login_at TEXT
);

-- Index for faster lookup by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
