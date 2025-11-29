import { Hono } from 'hono';
import type { Bindings, Variables } from '../types/app';
import type { TagRow } from '../types';
import { getUserId } from '../utils/auth';
import { errorResponse, checkTaskAccess } from '../utils/helpers';
import { tagRowToResponse } from '../utils/mappers';

const taskTagsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Get tags for a specific task
taskTagsRoutes.get('/:taskId/tags', async (c) => {
  try {
    const userId = getUserId(c);
    const taskId = c.req.param('taskId');

    // Check access (owner or shared with user)
    const access = await checkTaskAccess(c.env.DB, taskId, userId);

    if (!access.canView) {
      return c.json({ error: 'Task not found or access denied' }, 404);
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

    // Check access (owner or edit permission)
    const access = await checkTaskAccess(c.env.DB, taskId, userId);

    if (!access.canEdit) {
      return c.json({ error: 'Task not found or you do not have edit permission' }, 403);
    }

    // Verify all tags: either belong to current user OR already exist on the task
    if (body.tagIds && body.tagIds.length > 0) {
      const placeholders = body.tagIds.map(() => '?').join(',');
      
      // Get existing tags on the task
      const { results: existingTaskTags } = await c.env.DB.prepare(
        `SELECT tag_id FROM task_tags WHERE task_id = ?`
      )
        .bind(taskId)
        .all<{ tag_id: string }>();
      
      const existingTagIds = new Set(existingTaskTags.map(t => t.tag_id));
      
      // Check which tags are new (not already on the task)
      const newTagIds = body.tagIds.filter(tagId => !existingTagIds.has(tagId));
      
      // Verify new tags belong to current user
      if (newTagIds.length > 0) {
        const newTagPlaceholders = newTagIds.map(() => '?').join(',');
        const { results: validNewTags } = await c.env.DB.prepare(
          `SELECT id FROM tags WHERE user_id = ? AND id IN (${newTagPlaceholders})`
        )
          .bind(userId, ...newTagIds)
          .all();

        if (validNewTags.length !== newTagIds.length) {
          return c.json({ error: 'You can only add your own tags to the task' }, 403);
        }
      }
      
      // Verify all requested tags exist in tags table
      const { results: allValidTags } = await c.env.DB.prepare(
        `SELECT id FROM tags WHERE id IN (${placeholders})`
      )
        .bind(...body.tagIds)
        .all();

      if (allValidTags.length !== body.tagIds.length) {
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

    // Check access (owner or edit permission)
    const access = await checkTaskAccess(c.env.DB, taskId, userId);

    if (!access.canEdit) {
      return c.json({ error: 'Task not found or you do not have edit permission' }, 403);
    }

    // Verify tag belongs to user (tags can only be owned by the user adding them)
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

    // Check access (owner or edit permission)
    const access = await checkTaskAccess(c.env.DB, taskId, userId);

    if (!access.canEdit) {
      return c.json({ error: 'Task not found or you do not have edit permission' }, 403);
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

