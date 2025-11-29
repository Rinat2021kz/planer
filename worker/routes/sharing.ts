import { Hono } from 'hono';
import type { Bindings, Variables } from '../types/app';
import type { ShareTaskInput, TaskShareRow, TaskRow } from '../types';
import { getUserId } from '../utils/auth';
import { errorResponse } from '../utils/helpers';
import { taskRowToResponse } from '../utils/mappers';

const sharingRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Share a task with another user
sharingRoutes.post('/:taskId/share', async (c) => {
  let userId: string | undefined;
  let body: ShareTaskInput | undefined;

  try {
    userId = getUserId(c);
    const taskId = c.req.param('taskId');
    body = await c.req.json<ShareTaskInput>();

    // Verify task belongs to user
    const task = await c.env.DB.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?')
      .bind(taskId, userId)
      .first();

    if (!task) {
      return c.json({ error: 'Task not found or not owned by you' }, 404);
    }

    // Find user by email
    const targetUser = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
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
    console.error('Request body:', body);
    console.error('User ID:', userId);
    return errorResponse(c, error, 'Failed to share task');
  }
});

// Get shared tasks (tasks shared WITH current user)
sharingRoutes.get('/shared-tasks', async (c) => {
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

    const tasks = results.map((row) => ({
      ...taskRowToResponse(row),
      permission: row.permission,
      ownerId: row.owner_id,
      ownerEmail: row.owner_email,
    }));

    return c.json({ tasks });
  } catch (error) {
    return errorResponse(c, error, 'Failed to fetch shared tasks');
  }
});

// Get shares for a specific task (who has access)
sharingRoutes.get('/:taskId/shares', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('taskId');

    // Verify task belongs to user
    const task = await c.env.DB.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?')
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

    const shares = results.map((row) => ({
      id: row.id,
      userId: row.shared_with_id,
      email: row.email,
      displayName: row.display_name,
      permission: row.permission,
      createdAt: row.created_at,
    }));

    return c.json({ shares });
  } catch (error) {
    return errorResponse(c, error, 'Failed to fetch task shares');
  }
});

// Remove share
sharingRoutes.delete('/:taskId/shares/:shareId', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('taskId');
    const shareId = c.req.param('shareId');

    // Verify task belongs to user
    const task = await c.env.DB.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?')
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
    return errorResponse(c, error, 'Failed to remove share');
  }
});

export default sharingRoutes;

