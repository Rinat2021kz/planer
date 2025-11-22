-- Migration number: 0004 	 2025-11-22T10:40:00.000Z
-- Fix tasks table to remove FK constraint to non-existent recurrences table

-- Drop existing tasks table
DROP TABLE IF EXISTS tasks;

-- Recreate tasks table without recurrence FK
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_at TEXT NOT NULL,
    deadline_at TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'planned',
    is_archived INTEGER DEFAULT 0,
    deleted_at TEXT,
    recurrence_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Recreate indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_start_at ON tasks(start_at);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_is_archived ON tasks(is_archived);
CREATE INDEX idx_tasks_recurrence_id ON tasks(recurrence_id);
