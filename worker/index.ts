import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import {
  verifyFirebaseAuth,
  getFirebaseToken,
} from '@hono/firebase-auth';
import type {
  VerifyFirebaseAuthConfig,
  VerifyFirebaseAuthEnv,
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

type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  created_at: string;
  last_login_at: string | null;
};

type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_at: string;
  deadline_at: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in_progress' | 'done' | 'skipped' | 'canceled';
  is_archived: number;
  deleted_at: string | null;
  recurrence_id: string | null;
  created_at: string;
  updated_at: string;
};

type TaskCreateInput = {
  title: string;
  description?: string;
  start_at: string;
  deadline_at?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'planned' | 'in_progress' | 'done' | 'skipped' | 'canceled';
};

type TaskUpdateInput = {
  title?: string;
  description?: string;
  start_at?: string;
  deadline_at?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'planned' | 'in_progress' | 'done' | 'skipped' | 'canceled';
  is_archived?: boolean;
};

type TaskResponse = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startAt: string;
  deadlineAt: string | null;
  priority: string;
  status: string;
  isArchived: boolean;
  recurrenceId: string | null;
  createdAt: string;
  updatedAt: string;
};

// Helper function to get userId from context
const getUserId = (c: any): string => {
  const userId = c.get('userId');
  if (!userId) {
    throw new Error('User ID not found in context');
  }
  return userId;
};

// Helper function to convert TaskRow to TaskResponse
const taskRowToResponse = (row: TaskRow): TaskResponse => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  description: row.description,
  startAt: row.start_at,
  deadlineAt: row.deadline_at,
  priority: row.priority,
  status: row.status,
  isArchived: row.is_archived === 1,
  recurrenceId: row.recurrence_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

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
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Error:', err);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Request path:', c.req.path);
  console.error('Request method:', c.req.method);
  console.error('===========================');
  
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
      stack: err.stack,
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
    console.error('=== DATABASE ERROR in /api/version ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('====================================');
    
    return c.json(
      { 
        error: "Database error", 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
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
    console.error('=== DATABASE ERROR in /api/versions ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('======================================');
    
    return c.json(
      { 
        error: "Database error", 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
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

// User sync middleware: ensure user exists in D1 and attach userId to context
app.use('/api/protected/*', async (c, next) => {
  const idToken = getFirebaseToken(c);

  if (!idToken?.uid) {
    console.error('=== USER SYNC ERROR: Missing UID ===');
    console.error('idToken:', idToken);
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Missing or invalid Firebase user identifier.',
      },
      401
    );
  }

  const userId = idToken.uid;
  c.set('userId', userId);

  try {
    const now = new Date().toISOString();

    console.log('Syncing user:', { userId, email: idToken.email });

    await c.env.DB.prepare(
      `INSERT INTO users (id, email, display_name, photo_url, created_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         display_name = excluded.display_name,
         photo_url = excluded.photo_url,
         last_login_at = excluded.last_login_at`
    )
      .bind(
        userId,
        idToken.email ?? null,
        idToken.name ?? null,
        idToken.picture ?? null,
        now,
        now
      )
      .run<UserRow>();
      
    console.log('User synced successfully:', userId);
  } catch (error) {
    console.error('=== USER SYNC ERROR ===');
    console.error('Error syncing user:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('User data:', { userId, email: idToken.email });
    console.error('======================');
    
    return c.json(
      {
        error: 'Failed to sync user profile',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }

  await next();
});

// Protected endpoint example
app.get('/api/protected', (c) => {
  const userId = getUserId(c);
  const idToken = getFirebaseToken(c);
  return c.json({
    name: "Rinat",
    message: "API is running",
    email: idToken?.email,
    userId: userId,
  });
});

// Protected endpoint: User profile
app.get('/api/protected/profile', (c) => {
  const userId = getUserId(c);
  const idToken = getFirebaseToken(c);
  return c.json({
    uid: userId,
    email: idToken?.email,
    emailVerified: idToken?.email_verified,
    name: idToken?.name,
    picture: idToken?.picture,
  });
});

// ===== TASKS ENDPOINTS =====

// Create task
app.post('/api/protected/tasks', async (c) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json<TaskCreateInput>();

    console.log('Creating task:', { userId, body });

    // Validate required fields
    if (!body.title || !body.start_at) {
      return c.json(
        { error: 'Missing required fields: title, start_at' },
        400
      );
    }

    // Generate UUID using Web Crypto API
    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Convert start_at to ISO format if needed (from datetime-local format)
    let startAt = body.start_at;
    if (!startAt.includes('T') || !startAt.includes(':')) {
      startAt = new Date(startAt).toISOString();
    } else if (!startAt.endsWith('Z') && !startAt.includes('+')) {
      // If it's datetime-local format (YYYY-MM-DDTHH:mm), convert to ISO
      startAt = new Date(startAt).toISOString();
    }

    // Same for deadline_at
    let deadlineAt = body.deadline_at;
    if (deadlineAt && (!deadlineAt.endsWith('Z') && !deadlineAt.includes('+'))) {
      deadlineAt = new Date(deadlineAt).toISOString();
    }

    console.log('Inserting task:', {
      taskId,
      userId,
      title: body.title,
      startAt,
      deadlineAt,
    });

    const result = await c.env.DB.prepare(
      `INSERT INTO tasks (id, user_id, title, description, start_at, deadline_at, priority, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        taskId,
        userId,
        body.title,
        body.description ?? null,
        startAt,
        deadlineAt ?? null,
        body.priority ?? 'medium',
        body.status ?? 'planned',
        now,
        now
      )
      .run();

    console.log('Insert result:', result);

    const task = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?')
      .bind(taskId)
      .first<TaskRow>();

    console.log('Retrieved task:', task);

    if (!task) {
      return c.json({ error: 'Failed to create task' }, 500);
    }

    return c.json(taskRowToResponse(task), 201);
  } catch (error) {
    console.error('=== ERROR CREATING TASK ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Request body:', body);
    console.error('User ID:', userId);
    console.error('==========================');
    
    return c.json(
      {
        error: 'Failed to create task',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Get tasks with filters
app.get('/api/protected/tasks', async (c) => {
  try {
    const userId = getUserId(c);
    const { from, to, status, priority, archived } = c.req.query();

    let query = 'SELECT * FROM tasks WHERE user_id = ? AND deleted_at IS NULL';
    const params: any[] = [userId];

    // Filter by archived status
    if (archived === 'true') {
      query += ' AND is_archived = 1';
    } else if (archived === 'false') {
      query += ' AND is_archived = 0';
    } else {
      // Default: only non-archived
      query += ' AND is_archived = 0';
    }

    // Filter by date range
    if (from) {
      query += ' AND start_at >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND start_at <= ?';
      params.push(to);
    }

    // Filter by status
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Filter by priority
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY start_at ASC';

    const { results } = await c.env.DB.prepare(query)
      .bind(...params)
      .all<TaskRow>();

    const tasks = results.map(taskRowToResponse);

    return c.json({ tasks });
  } catch (error) {
    console.error('=== ERROR FETCHING TASKS ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Query params:', c.req.query());
    console.error('User ID:', getUserId(c));
    console.error('===========================');
    
    return c.json(
      {
        error: 'Failed to fetch tasks',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Get single task by ID
app.get('/api/protected/tasks/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('id');

    const task = await c.env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
    )
      .bind(taskId, userId)
      .first<TaskRow>();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    return c.json(taskRowToResponse(task));
  } catch (error) {
    console.error('=== ERROR FETCHING TASK ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Task ID:', c.req.param('id'));
    console.error('User ID:', getUserId(c));
    console.error('==========================');
    
    return c.json(
      {
        error: 'Failed to fetch task',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Update task
app.patch('/api/protected/tasks/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('id');
    const body = await c.req.json<TaskUpdateInput>();

    // Check if task exists and belongs to user
    const existingTask = await c.env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
    )
      .bind(taskId, userId)
      .first<TaskRow>();

    if (!existingTask) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      params.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      params.push(body.description);
    }
    if (body.start_at !== undefined) {
      updates.push('start_at = ?');
      params.push(body.start_at);
    }
    if (body.deadline_at !== undefined) {
      updates.push('deadline_at = ?');
      params.push(body.deadline_at);
    }
    if (body.priority !== undefined) {
      updates.push('priority = ?');
      params.push(body.priority);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      params.push(body.status);
    }
    if (body.is_archived !== undefined) {
      updates.push('is_archived = ?');
      params.push(body.is_archived ? 1 : 0);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());

    params.push(taskId, userId);

    await c.env.DB.prepare(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    )
      .bind(...params)
      .run();

    const updatedTask = await c.env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?'
    )
      .bind(taskId, userId)
      .first<TaskRow>();

    if (!updatedTask) {
      return c.json({ error: 'Failed to update task' }, 500);
    }

    return c.json(taskRowToResponse(updatedTask));
  } catch (error) {
    console.error('=== ERROR UPDATING TASK ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Task ID:', c.req.param('id'));
    console.error('User ID:', getUserId(c));
    console.error('Update body:', body);
    console.error('==========================');
    
    return c.json(
      {
        error: 'Failed to update task',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Soft delete (archive) task
app.delete('/api/protected/tasks/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('id');

    const task = await c.env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
    )
      .bind(taskId, userId)
      .first<TaskRow>();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Soft delete: set is_archived = 1
    await c.env.DB.prepare(
      'UPDATE tasks SET is_archived = 1, updated_at = ? WHERE id = ? AND user_id = ?'
    )
      .bind(new Date().toISOString(), taskId, userId)
      .run();

    return c.json({ message: 'Task archived successfully' });
  } catch (error) {
    console.error('=== ERROR ARCHIVING TASK ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Task ID:', c.req.param('id'));
    console.error('User ID:', getUserId(c));
    console.error('===========================');
    
    return c.json(
      {
        error: 'Failed to archive task',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Hard delete task (only for archived tasks)
app.delete('/api/protected/tasks/:id/permanent', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('id');

    const task = await c.env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ? AND is_archived = 1 AND deleted_at IS NULL'
    )
      .bind(taskId, userId)
      .first<TaskRow>();

    if (!task) {
      return c.json(
        { error: 'Task not found or not archived' },
        404
      );
    }

    // Hard delete: set deleted_at timestamp
    await c.env.DB.prepare(
      'UPDATE tasks SET deleted_at = ? WHERE id = ? AND user_id = ?'
    )
      .bind(new Date().toISOString(), taskId, userId)
      .run();

    return c.json({ message: 'Task permanently deleted' });
  } catch (error) {
    console.error('=== ERROR PERMANENTLY DELETING TASK ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Task ID:', c.req.param('id'));
    console.error('User ID:', getUserId(c));
    console.error('======================================');
    
    return c.json(
      {
        error: 'Failed to permanently delete task',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
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
