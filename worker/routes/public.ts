import { Hono } from 'hono';
import type { Bindings, Variables } from '../types/app';
import type { AppVersion, CurrentVersionResponse, VersionListResponse } from '../types';

// Public routes
const publicRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Health check
publicRoutes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Get current active app version
publicRoutes.get('/version', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT version, build_number, release_date, description FROM app_version WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).first<AppVersion>();

    if (!result) {
      return c.json({ error: 'Version not found' }, 404);
    }

    const response: CurrentVersionResponse = {
      version: result.version,
      buildNumber: result.build_number,
      releaseDate: result.release_date,
      description: result.description,
    };

    return c.json(response);
  } catch (error) {
    console.error('=== DATABASE ERROR in /api/version ===');
    console.error('Error:', error);
    console.error('====================================');

    return c.json(
      {
        error: 'Database error',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Get all versions
publicRoutes.get('/versions', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, version, build_number, release_date, description, is_active, created_at FROM app_version ORDER BY created_at DESC'
    ).all<AppVersion>();

    const versions: VersionListResponse[] = results.map((row: AppVersion) => ({
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
    console.error('=== DATABASE ERROR in /api/versions ===');
    console.error('Error:', error);
    console.error('======================================');

    return c.json(
      {
        error: 'Database error',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

export default publicRoutes;

