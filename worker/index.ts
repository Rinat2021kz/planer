import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Type definitions
type Bindings = {
  DB: D1Database;
};

type Variables = {
  userId?: string;
};

type AppVersion = {
  id: number;
  version: string;
  build_number: number;
  release_date: string;
  description: string | null;
  is_active: number;
  created_at: string;
};

type CurrentVersionResponse = {
  version: string;
  buildNumber: number;
  releaseDate: string;
  description: string | null;
};

type VersionListResponse = {
  id: number;
  version: string;
  buildNumber: number;
  releaseDate: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
};

// Initialize Hono app
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Error handling middleware
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Get current active app version
app.get('/api/version', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT version, build_number, release_date, description FROM app_version WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1"
    ).first<AppVersion>();

    if (!result) {
      return c.json({ error: "Version not found" }, 404);
    }

    const response: CurrentVersionResponse = {
      version: result.version,
      buildNumber: result.build_number,
      releaseDate: result.release_date,
      description: result.description,
    };

    return c.json(response);
  } catch (error) {
    console.error('Database error in /api/version:', error);
    return c.json(
      { 
        error: "Database error", 
        message: error instanceof Error ? error.message : String(error) 
      },
      500
    );
  }
});

// Get all versions
app.get('/api/versions', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, version, build_number, release_date, description, is_active, created_at FROM app_version ORDER BY created_at DESC"
    ).all<AppVersion>();

    const versions: VersionListResponse[] = results.map((row) => ({
      id: row.id,
      version: row.version,
      buildNumber: row.build_number,
      releaseDate: row.release_date,
      description: row.description,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
    }));

    return c.json({ versions });
  } catch (error) {
    console.error('Database error in /api/versions:', error);
    return c.json(
      { 
        error: "Database error", 
        message: error instanceof Error ? error.message : String(error) 
      },
      500
    );
  }
});

// Legacy test endpoint
app.get('/api/*', (c) => {
  return c.json({
    name: "Rinat",
    message: "API is running",
  });
});

// 404 handler
app.notFound((c) => {
  return c.json(
    { 
      error: "Not found",
      path: c.req.path,
    }, 
    404
  );
});

export default app;
