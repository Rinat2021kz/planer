-- Migration number: 0007 	 2025-11-25T00:00:00.000Z

-- Create task_shares table for sharing individual tasks
CREATE TABLE IF NOT EXISTS task_shares (
    id TEXT PRIMARY KEY,                          -- UUID
    task_id TEXT NOT NULL,                        -- FK to tasks
    owner_id TEXT NOT NULL,                       -- User who owns the task
    shared_with_id TEXT NOT NULL,                 -- User who has access
    permission TEXT NOT NULL DEFAULT 'view',      -- 'view' or 'edit'
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(task_id, shared_with_id)               -- Can't share same task twice with same user
);

-- Create user_connections table for managing friends/sharing relationships
CREATE TABLE IF NOT EXISTS user_connections (
    id TEXT PRIMARY KEY,                          -- UUID
    user_id TEXT NOT NULL,                        -- First user
    connected_user_id TEXT NOT NULL,              -- Second user
    status TEXT NOT NULL DEFAULT 'pending',       -- 'pending', 'accepted', 'rejected'
    created_by TEXT NOT NULL,                     -- Who initiated the connection
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (connected_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, connected_user_id),
    CHECK (user_id != connected_user_id)          -- Can't connect to yourself
);

-- Indexes for task_shares
CREATE INDEX IF NOT EXISTS idx_task_shares_task_id ON task_shares(task_id);
CREATE INDEX IF NOT EXISTS idx_task_shares_owner_id ON task_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_task_shares_shared_with_id ON task_shares(shared_with_id);

-- Indexes for user_connections
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_connected_user_id ON user_connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);
