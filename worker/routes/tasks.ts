import { Hono } from 'hono';
import type { Bindings, Variables } from '../types/app';
import type { TaskCreateInput, TaskUpdateInput, TaskRow, TagRow } from '../types';
import { getUserId } from '../utils/auth';
import { errorResponse } from '../utils/helpers';
import { taskRowToResponse, tagRowToResponse } from '../utils/mappers';
import { generateTasksFromRecurrence, MAX_RECURRENCE_GENERATION_DAYS } from '../services/recurrence';
import type { RecurrenceRow } from '../types';

const tasksRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Create task
tasksRoutes.post('/', async (c) => {
  let userId: string | undefined;
  let body: TaskCreateInput | undefined;

  try {
    userId = getUserId(c);
    body = await c.req.json<TaskCreateInput>();

    console.log('Creating task:', { userId, body });

    // Validate required fields
    if (!body.title || !body.start_at) {
      return c.json({ error: 'Missing required fields: title, start_at' }, 400);
    }

    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Convert start_at to ISO format if needed
    let startAt = body.start_at;
    if (!startAt.includes('T') || !startAt.includes(':')) {
      startAt = new Date(startAt).toISOString();
    } else if (!startAt.endsWith('Z') && !startAt.includes('+')) {
      startAt = new Date(startAt).toISOString();
    }

    // Same for deadline_at
    let deadlineAt = body.deadline_at;
    if (deadlineAt && !deadlineAt.endsWith('Z') && !deadlineAt.includes('+')) {
      deadlineAt = new Date(deadlineAt).toISOString();
    }

    console.log('Inserting task:', { taskId, userId, title: body.title, startAt, deadlineAt });

    await c.env.DB.prepare(
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

    const task = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first<TaskRow>();

    if (!task) {
      return c.json({ error: 'Failed to create task' }, 500);
    }

    return c.json(taskRowToResponse(task), 201);
  } catch (error) {
    console.error('=== ERROR CREATING TASK ===');
    console.error('Request body:', body);
    console.error('User ID:', userId);
    return errorResponse(c, error, 'Failed to create task');
  }
});

// Get tasks with filters
tasksRoutes.get('/', async (c) => {
  try {
    const userId = getUserId(c);
    const { from, to, status, priority, archived, search, tags } = c.req.query();

    // Generate tasks from active recurrences for the requested date range
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      const limitedToDate = new Date(fromDate);
      limitedToDate.setDate(limitedToDate.getDate() + Math.max(0, MAX_RECURRENCE_GENERATION_DAYS - 1));
      const recurrenceToDate = toDate < limitedToDate ? toDate : limitedToDate;

      const { results: activeRecurrences } = await c.env.DB.prepare(
        'SELECT * FROM recurrences WHERE user_id = ? AND is_active = 1'
      )
        .bind(userId)
        .all<RecurrenceRow>();

      for (const recurrence of activeRecurrences) {
        await generateTasksFromRecurrence(c.env.DB, recurrence, fromDate, recurrenceToDate);
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

    // Filter by tags
    if (tags) {
      const tagIds = tags.split(',').filter((id) => id.trim());
      if (tagIds.length > 0) {
        const placeholders = tagIds.map(() => '?').join(',');
        query += ` AND tt.tag_id IN (${placeholders})`;
        params.push(...tagIds);
      }
    }

    query += ' ORDER BY t.start_at ASC';

    const { results } = await c.env.DB.prepare(query).bind(...params).all<TaskRow>();

    const tasks = results.map(taskRowToResponse);

    // Fetch tags for all tasks in batches
    if (tasks.length > 0) {
      const taskIdToTags = new Map<string, any[]>();
      const taskIds = tasks.map((task) => task.id);
      const batchSize = 100;

      for (let i = 0; i < taskIds.length; i += batchSize) {
        const batchIds = taskIds.slice(i, i + batchSize);
        const placeholders = batchIds.map(() => '?').join(',');

        const { results: tagResults } = await c.env.DB.prepare(
          `SELECT tt.task_id, t.* FROM tags t
           INNER JOIN task_tags tt ON t.id = tt.tag_id
           WHERE tt.task_id IN (${placeholders})
           ORDER BY t.name ASC`
        )
          .bind(...batchIds)
          .all<TagRow & { task_id: string }>();

        for (const row of tagResults) {
          const taskTags = taskIdToTags.get(row.task_id) ?? [];
          taskTags.push(tagRowToResponse(row));
          taskIdToTags.set(row.task_id, taskTags);
        }
      }

      for (const task of tasks) {
        if (taskIdToTags.has(task.id)) {
          task.tags = taskIdToTags.get(task.id);
        }
      }
    }

    return c.json({ tasks });
  } catch (error) {
    console.error('Query params:', c.req.query());
    return errorResponse(c, error, 'Failed to fetch tasks');
  }
});

// Get single task by ID
tasksRoutes.get('/:id', async (c) => {
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
    console.error('Task ID:', c.req.param('id'));
    return errorResponse(c, error, 'Failed to fetch task');
  }
});

// Update task
tasksRoutes.patch('/:id', async (c) => {
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

    await c.env.DB.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`)
      .bind(...params)
      .run();

    const updatedTask = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
      .bind(taskId, userId)
      .first<TaskRow>();

    if (!updatedTask) {
      return c.json({ error: 'Failed to update task' }, 500);
    }

    return c.json(taskRowToResponse(updatedTask));
  } catch (error) {
    console.error('Task ID:', c.req.param('id'));
    console.error('Update body:', body);
    return errorResponse(c, error, 'Failed to update task');
  }
});

// Soft delete (archive) task
tasksRoutes.delete('/:id', async (c) => {
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

    await c.env.DB.prepare('UPDATE tasks SET is_archived = 1, updated_at = ? WHERE id = ? AND user_id = ?')
      .bind(new Date().toISOString(), taskId, userId)
      .run();

    return c.json({ message: 'Task archived successfully' });
  } catch (error) {
    console.error('Task ID:', c.req.param('id'));
    return errorResponse(c, error, 'Failed to archive task');
  }
});

// Hard delete task (only for archived tasks)
tasksRoutes.delete('/:id/permanent', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('id');

    const task = await c.env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ? AND is_archived = 1 AND deleted_at IS NULL'
    )
      .bind(taskId, userId)
      .first<TaskRow>();

    if (!task) {
      return c.json({ error: 'Task not found or not archived' }, 404);
    }

    await c.env.DB.prepare('UPDATE tasks SET deleted_at = ? WHERE id = ? AND user_id = ?')
      .bind(new Date().toISOString(), taskId, userId)
      .run();

    return c.json({ message: 'Task permanently deleted' });
  } catch (error) {
    console.error('Task ID:', c.req.param('id'));
    return errorResponse(c, error, 'Failed to permanently delete task');
  }
});

export default tasksRoutes;

