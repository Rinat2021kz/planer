# База данных D1 - planer-db

## Информация о базе данных

- **Название**: planer-db
- **Database ID**: f4b7c345-8f29-4021-a5f2-8014f2bdd76c
- **Binding**: DB (доступен через `env.DB` в Worker)

## Структура базы данных

### Таблица: app_version

Таблица для хранения информации о версиях приложения.

```sql
CREATE TABLE app_version (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,              -- Версия приложения (например, "1.0.0")
    build_number INTEGER NOT NULL,       -- Номер сборки
    release_date TEXT NOT NULL,          -- Дата релиза
    description TEXT,                    -- Описание версии
    is_active INTEGER DEFAULT 1,         -- Активна ли версия (1 = да, 0 = нет)
    created_at TEXT DEFAULT (datetime('now'))
);
```

## Управление миграциями

### Применить миграции локально (для разработки)
```bash
npm run db:migrate:local
```

### Применить миграции на продакшене
```bash
npm run db:migrate:remote
```

### Создать новую миграцию
```bash
npm run db:migrate:create <имя_миграции>
```

### Выполнить SQL команду локально
```bash
npm run db:execute:local "SELECT * FROM app_version"
```

### Выполнить SQL команду на продакшене
```bash
npm run db:execute:remote "SELECT * FROM app_version"
```

## API Endpoints

### GET /api/version
Получить текущую активную версию приложения.

**Ответ:**
```json
{
  "version": "1.0.0",
  "buildNumber": 1,
  "releaseDate": "2025-11-09T11:27:00.000Z",
  "description": "Начальная версия приложения"
}
```

### GET /api/versions
Получить список всех версий приложения.

**Ответ:**
```json
{
  "versions": [
    {
      "id": 1,
      "version": "1.0.0",
      "buildNumber": 1,
      "releaseDate": "2025-11-09T11:27:00.000Z",
      "description": "Начальная версия приложения",
      "isActive": true,
      "createdAt": "2025-11-09T11:27:00.000Z"
    }
  ]
}
```

## Использование в коде

В worker'е база данных доступна через `env.DB`:

```typescript
// Пример запроса
const result = await env.DB.prepare(
  "SELECT * FROM app_version WHERE is_active = 1"
).first();

// Пример вставки
await env.DB.prepare(
  "INSERT INTO app_version (version, build_number, release_date, description) VALUES (?, ?, ?, ?)"
).bind("1.0.1", 2, new Date().toISOString(), "Обновление").run();
```

## Первые шаги

1. **Применить начальную миграцию локально:**
   ```bash
   npm run db:migrate:local
   ```

2. **Применить миграцию на продакшене:**
   ```bash
   npm run db:migrate:remote
   ```

3. **Проверить работу API:**
   - Запустите dev-сервер: `npm run dev`
   - Откройте: http://localhost:5173/api/version
   - Или: http://localhost:5173/api/versions

## Полезные ссылки

- [Документация Cloudflare D1](https://developers.cloudflare.com/d1/)
- [D1 Client API](https://developers.cloudflare.com/d1/build-with-d1/d1-client-api/)
- [Миграции D1](https://developers.cloudflare.com/d1/learning/using-migrations/)


