import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import {
  VerifyFirebaseAuthConfig,
  VerifyFirebaseAuthEnv,
  verifyFirebaseAuth,
  getFirebaseToken,
} from '@hono/firebase-auth';

// Type definitions
type Bindings = {
  DB: D1Database;
} & VerifyFirebaseAuthEnv;

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

// Firebase Auth configuration
const firebaseAuthConfig: VerifyFirebaseAuthConfig = {
  projectId: 'planer-8edbd',
  authorizationHeaderKey: 'Authorization',
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
  credentials: true,
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

// Public endpoints (no authentication required)
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Public endpoint: Get current active app version
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

// Public endpoint: Get all versions
app.get('/api/versions', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, version, build_number, release_date, description, is_active, created_at FROM app_version ORDER BY created_at DESC"
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

// Apply Firebase Auth middleware to all protected routes
app.use('/api/protected/*', verifyFirebaseAuth(firebaseAuthConfig));

// Email verification check middleware
app.use('/api/protected/*', async (c, next) => {
  const idToken = getFirebaseToken(c);
  
  // Check if email is verified
  if (!idToken?.email_verified) {
    return c.json(
      {
        error: 'Email not verified',
        message: 'Please verify your email address before accessing this resource.',
      },
      403
    );
  }
  
  await next();
});

// Protected endpoint example
app.get('/api/protected', (c) => {
  const idToken = getFirebaseToken(c);
  return c.json({
    name: "Rinat",
    message: "API is running",
    email: idToken?.email,
    userId: idToken?.uid,
  });
});

// Protected endpoint: User profile
app.get('/api/protected/profile', (c) => {
  const idToken = getFirebaseToken(c);
  return c.json({
    uid: idToken?.uid,
    email: idToken?.email,
    emailVerified: idToken?.email_verified,
    name: idToken?.name,
    picture: idToken?.picture,
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
