import { Hono } from 'hono';
import type { Bindings, Variables } from '../types/app';
import type { TagRow } from '../types';
import { getUserId } from '../utils/auth';
import { errorResponse } from '../utils/helpers';
import { tagRowToResponse } from '../utils/mappers';

const taskTagsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Get tags for a specific task
taskTagsRoutes.get('/:taskId/tags', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('taskId');

    // Verify task belongs to user
    const task = await c.env.DB.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?')
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
    console.error('Task ID:', c.req.param('taskId'));
    return errorResponse(c, error, 'Failed to fetch task tags');
  }
});

// Set tags for a task (replaces all existing tags)
taskTagsRoutes.put('/:taskId/tags', async (c) => {
  let userId: string | undefined;
  let body: { tagIds: string[] } | undefined;

  try {
    userId = getUserId(c);
    const taskId = c.req.param('taskId');
    body = await c.req.json<{ tagIds: string[] }>();

    // Verify task belongs to user
    const task = await c.env.DB.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?')
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
    await c.env.DB.prepare('DELETE FROM task_tags WHERE task_id = ?').bind(taskId).run();

    // Insert new task_tags
    if (body.tagIds && body.tagIds.length > 0) {
      const now = new Date().toISOString();
      const statements = body.tagIds.map((tagId) =>
        c.env.DB.prepare('INSERT INTO task_tags (task_id, tag_id, created_at) VALUES (?, ?, ?)').bind(
          taskId,
          tagId,
          now
        )
      );

      await c.env.DB.batch(statements);
    }

    return c.json({ message: 'Task tags updated successfully' });
  } catch (error) {
    console.error('Task ID:', c.req.param('taskId'));
    console.error('Request body:', body);
    return errorResponse(c, error, 'Failed to update task tags');
  }
});

// Add a single tag to a task
taskTagsRoutes.post('/:taskId/tags/:tagId', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('taskId');
    const tagId = c.req.param('tagId');

    // Verify task belongs to user
    const task = await c.env.DB.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?')
      .bind(taskId, userId)
      .first();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Verify tag belongs to user
    const tag = await c.env.DB.prepare('SELECT id FROM tags WHERE id = ? AND user_id = ?')
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
    console.error('Task ID:', c.req.param('taskId'));
    console.error('Tag ID:', c.req.param('tagId'));
    return errorResponse(c, error, 'Failed to add tag to task');
  }
});

// Remove a tag from a task
taskTagsRoutes.delete('/:taskId/tags/:tagId', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('taskId');
    const tagId = c.req.param('tagId');

    // Verify task belongs to user
    const task = await c.env.DB.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?')
      .bind(taskId, userId)
      .first();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Remove link
    await c.env.DB.prepare('DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?')
      .bind(taskId, tagId)
      .run();

    return c.json({ message: 'Tag removed from task successfully' });
  } catch (error) {
    console.error('Task ID:', c.req.param('taskId'));
    console.error('Tag ID:', c.req.param('tagId'));
    return errorResponse(c, error, 'Failed to remove tag from task');
  }
});

export default taskTagsRoutes;

