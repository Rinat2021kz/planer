import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { verifyFirebaseAuth } from '@hono/firebase-auth';
import type { VerifyFirebaseAuthConfig } from '@hono/firebase-auth';
import type { Bindings, Variables } from './types/app';
import { errorHandler } from './middleware/error';
import { requireEmailVerified, syncUser } from './middleware/auth';
import publicRoutes from './routes/public';
import protectedRoutes from './routes/protected';
import tasksRoutes from './routes/tasks';
import tagsRoutes from './routes/tags';
import taskTagsRoutes from './routes/task-tags';
import recurrencesRoutes from './routes/recurrences';
import sharingRoutes from './routes/sharing';

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
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Error handling middleware
app.onError(errorHandler);

// Public routes
app.route('/api', publicRoutes);

// Apply Firebase Auth middleware to all protected routes
app.use('/api/protected/*', verifyFirebaseAuth(firebaseAuthConfig));

// Email verification and user sync middleware for protected routes
app.use('/api/protected/*', requireEmailVerified());
app.use('/api/protected/*', syncUser());

// Protected routes
app.route('/api/protected', protectedRoutes);
app.route('/api/protected/tasks', tasksRoutes);
app.route('/api/protected/tasks', taskTagsRoutes);
app.route('/api/protected/tasks', sharingRoutes);
app.route('/api/protected/tags', tagsRoutes);
app.route('/api/protected/recurrences', recurrencesRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not found',
      path: c.req.path,
    },
    404
  );
});

export default app;
