-- Migration number: 0003 	 2025-11-22T09:33:29.575Z

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,                          -- UUID
    user_id TEXT NOT NULL,                        -- Firebase UID (owner)
    title TEXT NOT NULL,
    description TEXT,
    start_at TEXT NOT NULL,                       -- ISO 8601 datetime
    deadline_at TEXT,                             -- ISO 8601 datetime (optional)
    priority TEXT NOT NULL DEFAULT 'medium',      -- low, medium, high, critical
    status TEXT NOT NULL DEFAULT 'planned',       -- planned, in_progress, done, skipped, canceled
    is_archived INTEGER DEFAULT 0,                -- soft delete flag
    deleted_at TEXT,                              -- hard delete timestamp
    recurrence_id TEXT,                           -- FK to recurrences table (will be added later)
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    -- Note: FK for recurrence_id will be added when recurrences table is created
);

-- Indexes for tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_start_at ON tasks(start_at);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_is_archived ON tasks(is_archived);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_id ON tasks(recurrence_id);
