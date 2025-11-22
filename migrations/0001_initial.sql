-- Migration number: 0001 	 2025-11-09T11:27:00.000Z
-- Начальная миграция: создание таблицы для версии приложения

CREATE TABLE IF NOT EXISTS app_version (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    build_number INTEGER NOT NULL,
    release_date TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Создадим индекс для быстрого поиска активной версии
CREATE INDEX IF NOT EXISTS idx_app_version_is_active ON app_version(is_active);

-- Вставим тестовую запись с начальной версией (только если таблица пустая)
INSERT OR IGNORE INTO app_version (version, build_number, release_date, description) 
VALUES ('1.0.0', 1, datetime('now'), 'Начальная версия приложения');


