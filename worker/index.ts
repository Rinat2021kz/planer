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
  tags?: TagResponse[];
};

type TagRow = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

type TagCreateInput = {
  name: string;
  color?: string;
};

type TagUpdateInput = {
  name?: string;
  color?: string;
};

type TagResponse = {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'workdays' | 'weekends';
type RecurrenceEndType = 'never' | 'date' | 'count';

type RecurrenceRow = {
  id: string;
  user_id: string;
  type: RecurrenceType;
  interval: number;
  interval_unit: string | null;
  weekdays: string | null;
  month_day: number | null;
  month_week: number | null;
  month_weekday: string | null;
  end_type: RecurrenceEndType;
  end_date: string | null;
  end_count: number | null;
  start_date: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  priority: string;
  occurrences_generated: number;
  last_generated_at: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

type RecurrenceCreateInput = {
  type: RecurrenceType;
  interval?: number;
  interval_unit?: 'hours' | 'days' | 'weeks' | 'months' | 'years';
  weekdays?: string[]; // ["monday", "wednesday", "friday"]
  month_day?: number;
  month_week?: number; // 1-5 for "1st-5th", -1 for "last"
  month_weekday?: string; // 'monday', 'tuesday', etc.
  end_type?: RecurrenceEndType;
  end_date?: string;
  end_count?: number;
  start_date: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
};

type RecurrenceUpdateInput = {
  type?: RecurrenceType;
  interval?: number;
  interval_unit?: 'hours' | 'days' | 'weeks' | 'months' | 'years';
  weekdays?: string[];
  month_day?: number;
  month_week?: number;
  month_weekday?: string;
  end_type?: RecurrenceEndType;
  end_date?: string;
  end_count?: number;
  start_date?: string;
  title?: string;
  description?: string;
  duration_minutes?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  is_active?: boolean;
};

type RecurrenceResponse = {
  id: string;
  userId: string;
  type: RecurrenceType;
  interval: number;
  intervalUnit: string | null;
  weekdays: string[] | null;
  monthDay: number | null;
  monthWeek: number | null;
  monthWeekday: string | null;
  endType: RecurrenceEndType;
  endDate: string | null;
  endCount: number | null;
  startDate: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  priority: string;
  occurrencesGenerated: number;
  lastGeneratedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type TaskShareRow = {
  id: string;
  task_id: string;
  owner_id: string;
  shared_with_id: string;
  permission: 'view' | 'edit';
  created_at: string;
  updated_at: string;
};

// type UserConnectionRow = {
//   id: string;
//   user_id: string;
//   connected_user_id: string;
//   status: 'pending' | 'accepted' | 'rejected';
//   created_by: string;
//   created_at: string;
//   updated_at: string;
// };

type ShareTaskInput = {
  task_id: string;
  shared_with_email: string; // Email of user to share with
  permission: 'view' | 'edit';
};

// type ConnectionRequestInput = {
//   connected_user_email: string;
// };

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

// Helper function to convert TagRow to TagResponse
const tagRowToResponse = (row: TagRow): TagResponse => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  color: row.color,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Helper function to convert RecurrenceRow to RecurrenceResponse
const recurrenceRowToResponse = (row: RecurrenceRow): RecurrenceResponse => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  interval: row.interval,
  intervalUnit: row.interval_unit,
  weekdays: row.weekdays ? JSON.parse(row.weekdays) : null,
  monthDay: row.month_day,
  monthWeek: row.month_week,
  monthWeekday: row.month_weekday,
  endType: row.end_type,
  endDate: row.end_date,
  endCount: row.end_count,
  startDate: row.start_date,
  title: row.title,
  description: row.description,
  durationMinutes: row.duration_minutes,
  priority: row.priority,
  occurrencesGenerated: row.occurrences_generated,
  lastGeneratedAt: row.last_generated_at,
  isActive: row.is_active === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Helper function to generate tasks from recurrences
const generateTasksFromRecurrence = async (
  db: D1Database,
  recurrence: RecurrenceRow,
  fromDate: Date,
  toDate: Date
): Promise<void> => {
  // Calculate which dates in the range should have tasks
  const dates: Date[] = [];
  const currentDate = new Date(fromDate);
  
  while (currentDate <= toDate) {
    const shouldGenerate = shouldGenerateTaskOnDate(recurrence, currentDate);
    
    if (shouldGenerate) {
      // Check if task already exists for this date
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const existing = await db.prepare(
        `SELECT id FROM tasks WHERE recurrence_id = ? AND start_at >= ? AND start_at <= ?`
      )
        .bind(recurrence.id, startOfDay.toISOString(), endOfDay.toISOString())
        .first();
      
      if (!existing) {
        dates.push(new Date(currentDate));
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Create tasks for dates
  for (const date of dates) {
    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Set time from recurrence start_date
    const startTime = new Date(recurrence.start_date);
    date.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    
    let deadlineAt: string | null = null;
    if (recurrence.duration_minutes) {
      const deadline = new Date(date);
      deadline.setMinutes(deadline.getMinutes() + recurrence.duration_minutes);
      deadlineAt = deadline.toISOString();
    }
    
    await db.prepare(
      `INSERT INTO tasks (id, user_id, title, description, start_at, deadline_at, priority, status, recurrence_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        taskId,
        recurrence.user_id,
        recurrence.title,
        recurrence.description,
        date.toISOString(),
        deadlineAt,
        recurrence.priority,
        'planned',
        recurrence.id,
        now,
        now
      )
      .run();
  }
  
  // Update recurrence stats
  if (dates.length > 0) {
    await db.prepare(
      `UPDATE recurrences SET occurrences_generated = occurrences_generated + ?, last_generated_at = ?, updated_at = ? WHERE id = ?`
    )
      .bind(dates.length, new Date().toISOString(), new Date().toISOString(), recurrence.id)
      .run();
  }
};

const shouldGenerateTaskOnDate = (recurrence: RecurrenceRow, date: Date): boolean => {
  const recurrenceStart = new Date(recurrence.start_date);
  
  // Check if before start date
  if (date < recurrenceStart) {
    return false;
  }
  
  // Check end conditions
  if (recurrence.end_type === 'date' && recurrence.end_date) {
    if (date > new Date(recurrence.end_date)) {
      return false;
    }
  }
  
  if (recurrence.end_type === 'count' && recurrence.end_count) {
    if (recurrence.occurrences_generated >= recurrence.end_count) {
      return false;
    }
  }
  
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  switch (recurrence.type) {
    case 'daily':
      return true;
    
    case 'workdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday-Friday
    
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6; // Saturday-Sunday
    
    case 'weekly': {
      if (!recurrence.weekdays) return false;
      const weekdays: string[] = JSON.parse(recurrence.weekdays);
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      return weekdays.includes(dayNames[dayOfWeek]);
    }
    
    case 'monthly': {
      // Support for specific day of month (e.g., 15th)
      if (recurrence.month_day) {
        return date.getDate() === recurrence.month_day;
      }
      
      // Support for "nth weekday" pattern (e.g., "2nd Monday")
      if (recurrence.month_week !== null && recurrence.month_weekday) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDayIndex = dayNames.indexOf(recurrence.month_weekday.toLowerCase());
        
        if (targetDayIndex === -1 || dayOfWeek !== targetDayIndex) {
          return false;
        }
        
        // Calculate which occurrence of this weekday in the month
        const dayOfMonth = date.getDate();
        const weekInMonth = Math.ceil(dayOfMonth / 7);
        
        // Support -1 for "last occurrence"
        if (recurrence.month_week === -1) {
          // Check if this is the last occurrence of this weekday
          const nextWeek = new Date(date);
          nextWeek.setDate(date.getDate() + 7);
          return nextWeek.getMonth() !== date.getMonth();
        }
        
        return weekInMonth === recurrence.month_week;
      }
      
      return false;
    }
    
    case 'yearly': {
      const startMonth = recurrenceStart.getMonth();
      const startDay = recurrenceStart.getDate();
      return date.getMonth() === startMonth && date.getDate() === startDay;
    }
    
    case 'custom': {
      if (!recurrence.interval_unit) return false;
      
      switch (recurrence.interval_unit) {
        case 'hours': {
          const hoursDiff = Math.floor((date.getTime() - recurrenceStart.getTime()) / (1000 * 60 * 60));
          // Check if the hour matches and we're on the same or later date
          return hoursDiff >= 0 && hoursDiff % recurrence.interval === 0;
        }
        case 'days': {
          const daysDiff = Math.floor((date.getTime() - recurrenceStart.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff % recurrence.interval === 0;
        }
        case 'weeks': {
          const daysDiff = Math.floor((date.getTime() - recurrenceStart.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff % (recurrence.interval * 7) === 0;
        }
        case 'months': {
          const monthsDiff = (date.getFullYear() - recurrenceStart.getFullYear()) * 12 + 
                           (date.getMonth() - recurrenceStart.getMonth());
          return monthsDiff % recurrence.interval === 0 && date.getDate() === recurrenceStart.getDate();
        }
        case 'years': {
          const yearsDiff = date.getFullYear() - recurrenceStart.getFullYear();
          return yearsDiff % recurrence.interval === 0 && 
                 date.getMonth() === recurrenceStart.getMonth() && 
                 date.getDate() === recurrenceStart.getDate();
        }
        default:
          return false;
      }
    }
    
    default:
      return false;
  }
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
  let userId: string | undefined;
  let body: TaskCreateInput | undefined;
  
  try {
    userId = getUserId(c);
    body = await c.req.json<TaskCreateInput>();

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
    const { from, to, status, priority, archived, search, tags } = c.req.query();

    // Generate tasks from active recurrences for the requested date range
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      
      const { results: activeRecurrences } = await c.env.DB.prepare(
        'SELECT * FROM recurrences WHERE user_id = ? AND is_active = 1'
      )
        .bind(userId)
        .all<RecurrenceRow>();
      
      for (const recurrence of activeRecurrences) {
        await generateTasksFromRecurrence(c.env.DB, recurrence, fromDate, toDate);
      }
    }

    let query = 'SELECT DISTINCT t.* FROM tasks t';
    const params: any[] = [];

    // Join with task_tags if filtering by tags
    if (tags) {
      query += ' INNER JOIN task_tags tt ON t.id = tt.task_id';
    }

    query += ' WHERE t.user_id = ? AND t.deleted_at IS NULL';
    params.push(userId);

    // Filter by archived status
    if (archived === 'true') {
      query += ' AND t.is_archived = 1';
    } else if (archived === 'false') {
      query += ' AND t.is_archived = 0';
    } else {
      // Default: only non-archived
      query += ' AND t.is_archived = 0';
    }

    // Filter by date range
    if (from) {
      query += ' AND t.start_at >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND t.start_at <= ?';
      params.push(to);
    }

    // Filter by status
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    // Filter by priority
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    // Search by title
    if (search) {
      query += ' AND t.title LIKE ?';
      params.push(`%${search}%`);
    }

    // Filter by tags (comma-separated tag IDs)
    if (tags) {
      const tagIds = tags.split(',').filter(id => id.trim());
      if (tagIds.length > 0) {
        const placeholders = tagIds.map(() => '?').join(',');
        query += ` AND tt.tag_id IN (${placeholders})`;
        params.push(...tagIds);
      }
    }

    query += ' ORDER BY t.start_at ASC';

    const { results } = await c.env.DB.prepare(query)
      .bind(...params)
      .all<TaskRow>();

    const tasks = results.map(taskRowToResponse);

    // Fetch tags for each task
    for (const task of tasks) {
      const { results: tagResults } = await c.env.DB.prepare(
        `SELECT t.* FROM tags t
         INNER JOIN task_tags tt ON t.id = tt.tag_id
         WHERE tt.task_id = ?
         ORDER BY t.name ASC`
      )
        .bind(task.id)
        .all<TagRow>();

      task.tags = tagResults.map(tagRowToResponse);
    }

    return c.json({ tasks });
  } catch (error) {
    console.error('=== ERROR FETCHING TASKS ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Query params:', c.req.query());
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

    const taskResponse = taskRowToResponse(task);

    // Fetch tags for task
    const { results: tagResults } = await c.env.DB.prepare(
      `SELECT t.* FROM tags t
       INNER JOIN task_tags tt ON t.id = tt.tag_id
       WHERE tt.task_id = ?
       ORDER BY t.name ASC`
    )
      .bind(taskId)
      .all<TagRow>();

    taskResponse.tags = tagResults.map(tagRowToResponse);

    return c.json(taskResponse);
  } catch (error) {
    console.error('=== ERROR FETCHING TASK ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Task ID:', c.req.param('id'));
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
  let userId: string | undefined;
  let body: TaskUpdateInput | undefined;
  
  try {
    userId = getUserId(c);
    const taskId = c.req.param('id');
    body = await c.req.json<TaskUpdateInput>();

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
    console.error('User ID:', userId);
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

// ===== TAGS ENDPOINTS =====

// Get all tags for current user
app.get('/api/protected/tags', async (c) => {
  try {
    const userId = getUserId(c);

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC'
    )
      .bind(userId)
      .all<TagRow>();

    const tags = results.map(tagRowToResponse);

    return c.json({ tags });
  } catch (error) {
    console.error('=== ERROR FETCHING TAGS ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('==========================');
    
    return c.json(
      {
        error: 'Failed to fetch tags',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Create a new tag
app.post('/api/protected/tags', async (c) => {
  let userId: string | undefined;
  let body: TagCreateInput | undefined;
  
  try {
    userId = getUserId(c);
    body = await c.req.json<TagCreateInput>();

    console.log('Creating tag:', { userId, body });

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return c.json(
        { error: 'Tag name is required' },
        400
      );
    }

    // Check if tag with this name already exists for user
    const existing = await c.env.DB.prepare(
      'SELECT id FROM tags WHERE user_id = ? AND name = ?'
    )
      .bind(userId, body.name.trim())
      .first();

    if (existing) {
      return c.json(
        { error: 'Tag with this name already exists' },
        409
      );
    }

    const tagId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `INSERT INTO tags (id, user_id, name, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        tagId,
        userId,
        body.name.trim(),
        body.color ?? '#808080',
        now,
        now
      )
      .run();

    const tag = await c.env.DB.prepare('SELECT * FROM tags WHERE id = ?')
      .bind(tagId)
      .first<TagRow>();

    if (!tag) {
      return c.json({ error: 'Failed to create tag' }, 500);
    }

    return c.json(tagRowToResponse(tag), 201);
  } catch (error) {
    console.error('=== ERROR CREATING TAG ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Request body:', body);
    console.error('User ID:', userId);
    console.error('=========================');
    
    return c.json(
      {
        error: 'Failed to create tag',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Update tag
app.patch('/api/protected/tags/:id', async (c) => {
  let userId: string | undefined;
  let body: TagUpdateInput | undefined;
  
  try {
    userId = getUserId(c);
    const tagId = c.req.param('id');
    body = await c.req.json<TagUpdateInput>();

    // Check if tag exists and belongs to user
    const existingTag = await c.env.DB.prepare(
      'SELECT * FROM tags WHERE id = ? AND user_id = ?'
    )
      .bind(tagId, userId)
      .first<TagRow>();

    if (!existingTag) {
      return c.json({ error: 'Tag not found' }, 404);
    }

    // If updating name, check for duplicates
    if (body.name && body.name.trim() !== existingTag.name) {
      const duplicate = await c.env.DB.prepare(
        'SELECT id FROM tags WHERE user_id = ? AND name = ? AND id != ?'
      )
        .bind(userId, body.name.trim(), tagId)
        .first();

      if (duplicate) {
        return c.json(
          { error: 'Tag with this name already exists' },
          409
        );
      }
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (body.name !== undefined && body.name.trim()) {
      updates.push('name = ?');
      params.push(body.name.trim());
    }
    if (body.color !== undefined) {
      updates.push('color = ?');
      params.push(body.color);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());

    params.push(tagId, userId);

    await c.env.DB.prepare(
      `UPDATE tags SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    )
      .bind(...params)
      .run();

    const updatedTag = await c.env.DB.prepare(
      'SELECT * FROM tags WHERE id = ? AND user_id = ?'
    )
      .bind(tagId, userId)
      .first<TagRow>();

    if (!updatedTag) {
      return c.json({ error: 'Failed to update tag' }, 500);
    }

    return c.json(tagRowToResponse(updatedTag));
  } catch (error) {
    console.error('=== ERROR UPDATING TAG ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Tag ID:', c.req.param('id'));
    console.error('User ID:', userId);
    console.error('Update body:', body);
    console.error('=========================');
    
    return c.json(
      {
        error: 'Failed to update tag',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Delete tag
app.delete('/api/protected/tags/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const tagId = c.req.param('id');

    const tag = await c.env.DB.prepare(
      'SELECT * FROM tags WHERE id = ? AND user_id = ?'
    )
      .bind(tagId, userId)
      .first<TagRow>();

    if (!tag) {
      return c.json({ error: 'Tag not found' }, 404);
    }

    // Delete tag (CASCADE will delete task_tags entries)
    await c.env.DB.prepare(
      'DELETE FROM tags WHERE id = ? AND user_id = ?'
    )
      .bind(tagId, userId)
      .run();

    return c.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('=== ERROR DELETING TAG ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Tag ID:', c.req.param('id'));
    console.error('=========================');
    
    return c.json(
      {
        error: 'Failed to delete tag',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Get tags for a specific task
app.get('/api/protected/tasks/:taskId/tags', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('taskId');

    // Verify task belongs to user
    const task = await c.env.DB.prepare(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?'
    )
      .bind(taskId, userId)
      .first();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Get tags for task
    const { results } = await c.env.DB.prepare(
      `SELECT t.* FROM tags t
       INNER JOIN task_tags tt ON t.id = tt.tag_id
       WHERE tt.task_id = ?
       ORDER BY t.name ASC`
    )
      .bind(taskId)
      .all<TagRow>();

    const tags = results.map(tagRowToResponse);

    return c.json({ tags });
  } catch (error) {
    console.error('=== ERROR FETCHING TASK TAGS ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Task ID:', c.req.param('taskId'));
    console.error('===============================');
    
    return c.json(
      {
        error: 'Failed to fetch task tags',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Set tags for a task (replaces all existing tags)
app.put('/api/protected/tasks/:taskId/tags', async (c) => {
  let userId: string | undefined;
  let body: { tagIds: string[] } | undefined;
  
  try {
    userId = getUserId(c);
    const taskId = c.req.param('taskId');
    body = await c.req.json<{ tagIds: string[] }>();

    // Verify task belongs to user
    const task = await c.env.DB.prepare(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?'
    )
      .bind(taskId, userId)
      .first();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Verify all tags belong to user
    if (body.tagIds && body.tagIds.length > 0) {
      const placeholders = body.tagIds.map(() => '?').join(',');
      const { results } = await c.env.DB.prepare(
        `SELECT id FROM tags WHERE user_id = ? AND id IN (${placeholders})`
      )
        .bind(userId, ...body.tagIds)
        .all();

      if (results.length !== body.tagIds.length) {
        return c.json({ error: 'One or more tags not found' }, 404);
      }
    }

    // Delete existing task_tags
    await c.env.DB.prepare('DELETE FROM task_tags WHERE task_id = ?')
      .bind(taskId)
      .run();

    // Insert new task_tags
    if (body.tagIds && body.tagIds.length > 0) {
      const now = new Date().toISOString();
      const statements = body.tagIds.map(tagId =>
        c.env.DB.prepare(
          'INSERT INTO task_tags (task_id, tag_id, created_at) VALUES (?, ?, ?)'
        ).bind(taskId, tagId, now)
      );

      await c.env.DB.batch(statements);
    }

    return c.json({ message: 'Task tags updated successfully' });
  } catch (error) {
    console.error('=== ERROR UPDATING TASK TAGS ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Task ID:', c.req.param('taskId'));
    console.error('User ID:', userId);
    console.error('Request body:', body);
    console.error('===============================');
    
    return c.json(
      {
        error: 'Failed to update task tags',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Add a single tag to a task
app.post('/api/protected/tasks/:taskId/tags/:tagId', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('taskId');
    const tagId = c.req.param('tagId');

    // Verify task belongs to user
    const task = await c.env.DB.prepare(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?'
    )
      .bind(taskId, userId)
      .first();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Verify tag belongs to user
    const tag = await c.env.DB.prepare(
      'SELECT id FROM tags WHERE id = ? AND user_id = ?'
    )
      .bind(tagId, userId)
      .first();

    if (!tag) {
      return c.json({ error: 'Tag not found' }, 404);
    }

    // Check if already linked
    const existing = await c.env.DB.prepare(
      'SELECT 1 FROM task_tags WHERE task_id = ? AND tag_id = ?'
    )
      .bind(taskId, tagId)
      .first();

    if (existing) {
      return c.json({ message: 'Tag already linked to task' });
    }

    // Link tag to task
    await c.env.DB.prepare(
      'INSERT INTO task_tags (task_id, tag_id, created_at) VALUES (?, ?, ?)'
    )
      .bind(taskId, tagId, new Date().toISOString())
      .run();

    return c.json({ message: 'Tag added to task successfully' });
  } catch (error) {
    console.error('=== ERROR ADDING TAG TO TASK ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Task ID:', c.req.param('taskId'));
    console.error('Tag ID:', c.req.param('tagId'));
    console.error('===============================');
    
    return c.json(
      {
        error: 'Failed to add tag to task',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Remove a tag from a task
app.delete('/api/protected/tasks/:taskId/tags/:tagId', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('taskId');
    const tagId = c.req.param('tagId');

    // Verify task belongs to user
    const task = await c.env.DB.prepare(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?'
    )
      .bind(taskId, userId)
      .first();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Remove link
    await c.env.DB.prepare(
      'DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?'
    )
      .bind(taskId, tagId)
      .run();

    return c.json({ message: 'Tag removed from task successfully' });
  } catch (error) {
    console.error('=== ERROR REMOVING TAG FROM TASK ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Task ID:', c.req.param('taskId'));
    console.error('Tag ID:', c.req.param('tagId'));
    console.error('===================================');
    
    return c.json(
      {
        error: 'Failed to remove tag from task',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// ===== RECURRENCES ENDPOINTS =====

// Get all recurrences for current user
app.get('/api/protected/recurrences', async (c) => {
  try {
    const userId = getUserId(c);

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM recurrences WHERE user_id = ? ORDER BY created_at DESC'
    )
      .bind(userId)
      .all<RecurrenceRow>();

    const recurrences = results.map(recurrenceRowToResponse);

    return c.json({ recurrences });
  } catch (error) {
    console.error('=== ERROR FETCHING RECURRENCES ===');
    console.error('Error:', error);
    console.error('====================================');
    
    return c.json(
      {
        error: 'Failed to fetch recurrences',
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// Get single recurrence by ID
app.get('/api/protected/recurrences/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const recurrenceId = c.req.param('id');

    const recurrence = await c.env.DB.prepare(
      'SELECT * FROM recurrences WHERE id = ? AND user_id = ?'
    )
      .bind(recurrenceId, userId)
      .first<RecurrenceRow>();

    if (!recurrence) {
      return c.json({ error: 'Recurrence not found' }, 404);
    }

    return c.json(recurrenceRowToResponse(recurrence));
  } catch (error) {
    console.error('=== ERROR FETCHING RECURRENCE ===');
    console.error('Error:', error);
    console.error('==================================');
    
    return c.json(
      {
        error: 'Failed to fetch recurrence',
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// Create a new recurrence
app.post('/api/protected/recurrences', async (c) => {
  let userId: string | undefined;
  let body: RecurrenceCreateInput | undefined;
  
  try {
    userId = getUserId(c);
    body = await c.req.json<RecurrenceCreateInput>();

    console.log('Creating recurrence:', { userId, body });

    // Validate required fields
    if (!body.title || !body.start_date) {
      return c.json(
        { error: 'Title and start_date are required' },
        400
      );
    }

    const recurrenceId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `INSERT INTO recurrences (
        id, user_id, type, interval, interval_unit, weekdays,
        month_day, month_week, month_weekday,
        end_type, end_date, end_count, start_date,
        title, description, duration_minutes, priority,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        recurrenceId,
        userId,
        body.type,
        body.interval ?? 1,
        body.interval_unit ?? null,
        body.weekdays ? JSON.stringify(body.weekdays) : null,
        body.month_day ?? null,
        body.month_week ?? null,
        body.month_weekday ?? null,
        body.end_type ?? 'never',
        body.end_date ?? null,
        body.end_count ?? null,
        body.start_date,
        body.title,
        body.description ?? null,
        body.duration_minutes ?? null,
        body.priority ?? 'medium',
        now,
        now
      )
      .run();

    const recurrence = await c.env.DB.prepare('SELECT * FROM recurrences WHERE id = ?')
      .bind(recurrenceId)
      .first<RecurrenceRow>();

    if (!recurrence) {
      return c.json({ error: 'Failed to create recurrence' }, 500);
    }

    return c.json(recurrenceRowToResponse(recurrence), 201);
  } catch (error) {
    console.error('=== ERROR CREATING RECURRENCE ===');
    console.error('Error:', error);
    console.error('Request body:', body);
    console.error('User ID:', userId);
    console.error('=================================');
    
    return c.json(
      {
        error: 'Failed to create recurrence',
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// Update recurrence
app.patch('/api/protected/recurrences/:id', async (c) => {
  let userId: string | undefined;
  let body: RecurrenceUpdateInput | undefined;
  
  try {
    userId = getUserId(c);
    const recurrenceId = c.req.param('id');
    body = await c.req.json<RecurrenceUpdateInput>();

    // Check if recurrence exists and belongs to user
    const existingRecurrence = await c.env.DB.prepare(
      'SELECT * FROM recurrences WHERE id = ? AND user_id = ?'
    )
      .bind(recurrenceId, userId)
      .first<RecurrenceRow>();

    if (!existingRecurrence) {
      return c.json({ error: 'Recurrence not found' }, 404);
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (body.type !== undefined) {
      updates.push('type = ?');
      params.push(body.type);
    }
    if (body.interval !== undefined) {
      updates.push('interval = ?');
      params.push(body.interval);
    }
    if (body.interval_unit !== undefined) {
      updates.push('interval_unit = ?');
      params.push(body.interval_unit);
    }
    if (body.weekdays !== undefined) {
      updates.push('weekdays = ?');
      params.push(body.weekdays.length > 0 ? JSON.stringify(body.weekdays) : null);
    }
    if (body.month_day !== undefined) {
      updates.push('month_day = ?');
      params.push(body.month_day);
    }
    if (body.month_week !== undefined) {
      updates.push('month_week = ?');
      params.push(body.month_week);
    }
    if (body.month_weekday !== undefined) {
      updates.push('month_weekday = ?');
      params.push(body.month_weekday);
    }
    if (body.end_type !== undefined) {
      updates.push('end_type = ?');
      params.push(body.end_type);
    }
    if (body.end_date !== undefined) {
      updates.push('end_date = ?');
      params.push(body.end_date);
    }
    if (body.end_count !== undefined) {
      updates.push('end_count = ?');
      params.push(body.end_count);
    }
    if (body.start_date !== undefined) {
      updates.push('start_date = ?');
      params.push(body.start_date);
    }
    if (body.title !== undefined) {
      updates.push('title = ?');
      params.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      params.push(body.description);
    }
    if (body.duration_minutes !== undefined) {
      updates.push('duration_minutes = ?');
      params.push(body.duration_minutes);
    }
    if (body.priority !== undefined) {
      updates.push('priority = ?');
      params.push(body.priority);
    }
    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(body.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());

    params.push(recurrenceId, userId);

    await c.env.DB.prepare(
      `UPDATE recurrences SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    )
      .bind(...params)
      .run();

    const updatedRecurrence = await c.env.DB.prepare(
      'SELECT * FROM recurrences WHERE id = ? AND user_id = ?'
    )
      .bind(recurrenceId, userId)
      .first<RecurrenceRow>();

    if (!updatedRecurrence) {
      return c.json({ error: 'Failed to update recurrence' }, 500);
    }

    return c.json(recurrenceRowToResponse(updatedRecurrence));
  } catch (error) {
    console.error('=== ERROR UPDATING RECURRENCE ===');
    console.error('Error:', error);
    console.error('Update body:', body);
    console.error('=================================');
    
    return c.json(
      {
        error: 'Failed to update recurrence',
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// Delete recurrence
app.delete('/api/protected/recurrences/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const recurrenceId = c.req.param('id');

    const recurrence = await c.env.DB.prepare(
      'SELECT * FROM recurrences WHERE id = ? AND user_id = ?'
    )
      .bind(recurrenceId, userId)
      .first<RecurrenceRow>();

    if (!recurrence) {
      return c.json({ error: 'Recurrence not found' }, 404);
    }

    // Delete recurrence
    await c.env.DB.prepare(
      'DELETE FROM recurrences WHERE id = ? AND user_id = ?'
    )
      .bind(recurrenceId, userId)
      .run();

    return c.json({ message: 'Recurrence deleted successfully' });
  } catch (error) {
    console.error('=== ERROR DELETING RECURRENCE ===');
    console.error('Error:', error);
    console.error('=================================');
    
    return c.json(
      {
        error: 'Failed to delete recurrence',
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// ===== SHARING ENDPOINTS =====

// Share a task with another user
app.post('/api/protected/tasks/:taskId/share', async (c) => {
  let userId: string | undefined;
  let body: ShareTaskInput | undefined;
  
  try {
    userId = getUserId(c);
    const taskId = c.req.param('taskId');
    body = await c.req.json<ShareTaskInput>();

    // Verify task belongs to user
    const task = await c.env.DB.prepare(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?'
    )
      .bind(taskId, userId)
      .first();

    if (!task) {
      return c.json({ error: 'Task not found or not owned by you' }, 404);
    }

    // Find user by email
    const targetUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    )
      .bind(body.shared_with_email)
      .first<{ id: string }>();

    if (!targetUser) {
      return c.json({ error: 'User with this email not found' }, 404);
    }

    if (targetUser.id === userId) {
      return c.json({ error: 'Cannot share task with yourself' }, 400);
    }

    // Check if already shared
    const existing = await c.env.DB.prepare(
      'SELECT id FROM task_shares WHERE task_id = ? AND shared_with_id = ?'
    )
      .bind(taskId, targetUser.id)
      .first();

    if (existing) {
      return c.json({ error: 'Task already shared with this user' }, 409);
    }

    const shareId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `INSERT INTO task_shares (id, task_id, owner_id, shared_with_id, permission, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(shareId, taskId, userId, targetUser.id, body.permission, now, now)
      .run();

    return c.json({ message: 'Task shared successfully', shareId }, 201);
  } catch (error) {
    console.error('=== ERROR SHARING TASK ===');
    console.error('Error:', error);
    console.error('Request body:', body);
    console.error('User ID:', userId);
    console.error('==========================');
    
    return c.json(
      {
        error: 'Failed to share task',
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// Get shared tasks (tasks shared WITH current user)
app.get('/api/protected/shared-tasks', async (c) => {
  try {
    const userId = getUserId(c);

    const { results } = await c.env.DB.prepare(
      `SELECT t.*, ts.permission, ts.owner_id, u.email as owner_email
       FROM tasks t
       INNER JOIN task_shares ts ON t.id = ts.task_id
       LEFT JOIN users u ON ts.owner_id = u.id
       WHERE ts.shared_with_id = ? AND t.deleted_at IS NULL
       ORDER BY t.start_at ASC`
    )
      .bind(userId)
      .all<TaskRow & { permission: string; owner_id: string; owner_email: string }>();

    const tasks = results.map(row => ({
      ...taskRowToResponse(row),
      permission: row.permission,
      ownerId: row.owner_id,
      ownerEmail: row.owner_email,
    }));

    return c.json({ tasks });
  } catch (error) {
    console.error('=== ERROR FETCHING SHARED TASKS ===');
    console.error('Error:', error);
    console.error('===================================');
    
    return c.json(
      {
        error: 'Failed to fetch shared tasks',
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// Get shares for a specific task (who has access)
app.get('/api/protected/tasks/:taskId/shares', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('taskId');

    // Verify task belongs to user
    const task = await c.env.DB.prepare(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?'
    )
      .bind(taskId, userId)
      .first();

    if (!task) {
      return c.json({ error: 'Task not found or not owned by you' }, 404);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT ts.*, u.email, u.display_name
       FROM task_shares ts
       LEFT JOIN users u ON ts.shared_with_id = u.id
       WHERE ts.task_id = ?
       ORDER BY ts.created_at DESC`
    )
      .bind(taskId)
      .all<TaskShareRow & { email: string; display_name: string }>();

    const shares = results.map(row => ({
      id: row.id,
      userId: row.shared_with_id,
      email: row.email,
      displayName: row.display_name,
      permission: row.permission,
      createdAt: row.created_at,
    }));

    return c.json({ shares });
  } catch (error) {
    console.error('=== ERROR FETCHING TASK SHARES ===');
    console.error('Error:', error);
    console.error('==================================');
    
    return c.json(
      {
        error: 'Failed to fetch task shares',
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// Remove share
app.delete('/api/protected/tasks/:taskId/shares/:shareId', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('taskId');
    const shareId = c.req.param('shareId');

    // Verify task belongs to user
    const task = await c.env.DB.prepare(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?'
    )
      .bind(taskId, userId)
      .first();

    if (!task) {
      return c.json({ error: 'Task not found or not owned by you' }, 404);
    }

    await c.env.DB.prepare(
      'DELETE FROM task_shares WHERE id = ? AND task_id = ? AND owner_id = ?'
    )
      .bind(shareId, taskId, userId)
      .run();

    return c.json({ message: 'Share removed successfully' });
  } catch (error) {
    console.error('=== ERROR REMOVING SHARE ===');
    console.error('Error:', error);
    console.error('============================');
    
    return c.json(
      {
        error: 'Failed to remove share',
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// Search users by email (for sharing)
app.get('/api/protected/users/search', async (c) => {
  try {
    const userId = getUserId(c);
    const { email } = c.req.query();

    if (!email || email.length < 3) {
      return c.json({ users: [] });
    }

    const { results } = await c.env.DB.prepare(
      `SELECT id, email, display_name FROM users 
       WHERE email LIKE ? AND id != ?
       LIMIT 10`
    )
      .bind(`%${email}%`, userId)
      .all<{ id: string; email: string; display_name: string }>();

    const users = results.map(row => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
    }));

    return c.json({ users });
  } catch (error) {
    console.error('=== ERROR SEARCHING USERS ===');
    console.error('Error:', error);
    console.error('=============================');
    
    return c.json(
      {
        error: 'Failed to search users',
        message: error instanceof Error ? error.message : String(error),
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
