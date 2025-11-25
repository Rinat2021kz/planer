-- Migration number: 0006 	 2025-11-25T00:00:00.000Z

-- Create recurrences table
CREATE TABLE IF NOT EXISTS recurrences (
    id TEXT PRIMARY KEY,                          -- UUID
    user_id TEXT NOT NULL,                        -- Firebase UID (owner)
    
    -- Recurrence type
    type TEXT NOT NULL,                           -- daily, weekly, monthly, yearly, custom, workdays, weekends
    
    -- For custom recurrence
    interval INTEGER DEFAULT 1,                   -- Every N units
    interval_unit TEXT,                           -- days, weeks, months, years
    
    -- For weekly recurrence (which days of week)
    weekdays TEXT,                                -- JSON array: ["monday", "wednesday", "friday"]
    
    -- For monthly recurrence
    month_day INTEGER,                            -- Day of month (1-31)
    month_week INTEGER,                           -- Week of month (1-5, -1 for last)
    month_weekday TEXT,                           -- Day of week for monthly (monday, tuesday, etc)
    
    -- End conditions
    end_type TEXT NOT NULL DEFAULT 'never',       -- never, date, count
    end_date TEXT,                                -- ISO 8601 datetime
    end_count INTEGER,                            -- Number of occurrences
    
    -- Start date
    start_date TEXT NOT NULL,                     -- ISO 8601 datetime (when to start generating)
    
    -- Template for generated tasks
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER,                     -- How long task takes (for calculating deadline)
    priority TEXT NOT NULL DEFAULT 'medium',
    
    -- Tracking
    occurrences_generated INTEGER DEFAULT 0,      -- How many instances created so far
    last_generated_at TEXT,                       -- Last time we generated an instance
    
    -- Soft delete
    is_active INTEGER DEFAULT 1,                  -- Active or paused
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for recurrences table
CREATE INDEX IF NOT EXISTS idx_recurrences_user_id ON recurrences(user_id);
CREATE INDEX IF NOT EXISTS idx_recurrences_is_active ON recurrences(is_active);
CREATE INDEX IF NOT EXISTS idx_recurrences_type ON recurrences(type);

-- Add foreign key to tasks table for recurrence_id
-- (field already exists, just document the relationship)
-- When a task is created from a recurrence, it will have recurrence_id set
