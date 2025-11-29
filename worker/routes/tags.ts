import { Hono } from 'hono';
import type { Bindings, Variables } from '../types/app';
import type { TagCreateInput, TagUpdateInput, TagRow } from '../types';
import { getUserId } from '../utils/auth';
import { errorResponse } from '../utils/helpers';
import { tagRowToResponse } from '../utils/mappers';

const tagsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Get all tags for current user
tagsRoutes.get('/', async (c) => {
  try {
    const userId = getUserId(c);

    const { results } = await c.env.DB.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC')
      .bind(userId)
      .all<TagRow>();

    const tags = results.map(tagRowToResponse);

    return c.json({ tags });
  } catch (error) {
    return errorResponse(c, error, 'Failed to fetch tags');
  }
});

// Create a new tag
tagsRoutes.post('/', async (c) => {
  let userId: string | undefined;
  let body: TagCreateInput | undefined;

  try {
    userId = getUserId(c);
    body = await c.req.json<TagCreateInput>();

    console.log('Creating tag:', { userId, body });

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return c.json({ error: 'Tag name is required' }, 400);
    }

    // Check if tag with this name already exists for user
    const existing = await c.env.DB.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?')
      .bind(userId, body.name.trim())
      .first();

    if (existing) {
      return c.json({ error: 'Tag with this name already exists' }, 409);
    }

    const tagId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `INSERT INTO tags (id, user_id, name, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(tagId, userId, body.name.trim(), body.color ?? '#808080', now, now)
      .run();

    const tag = await c.env.DB.prepare('SELECT * FROM tags WHERE id = ?').bind(tagId).first<TagRow>();

    if (!tag) {
      return c.json({ error: 'Failed to create tag' }, 500);
    }

    return c.json(tagRowToResponse(tag), 201);
  } catch (error) {
    console.error('Request body:', body);
    console.error('User ID:', userId);
    return errorResponse(c, error, 'Failed to create tag');
  }
});

// Update tag
tagsRoutes.patch('/:id', async (c) => {
  let userId: string | undefined;
  let body: TagUpdateInput | undefined;

  try {
    userId = getUserId(c);
    const tagId = c.req.param('id');
    body = await c.req.json<TagUpdateInput>();

    // Check if tag exists and belongs to user
    const existingTag = await c.env.DB.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?')
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
        return c.json({ error: 'Tag with this name already exists' }, 409);
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

    await c.env.DB.prepare(`UPDATE tags SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`)
      .bind(...params)
      .run();

    const updatedTag = await c.env.DB.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?')
      .bind(tagId, userId)
      .first<TagRow>();

    if (!updatedTag) {
      return c.json({ error: 'Failed to update tag' }, 500);
    }

    return c.json(tagRowToResponse(updatedTag));
  } catch (error) {
    console.error('Tag ID:', c.req.param('id'));
    console.error('Update body:', body);
    return errorResponse(c, error, 'Failed to update tag');
  }
});

// Delete tag
tagsRoutes.delete('/:id', async (c) => {
  try {
    const userId = getUserId(c);
    const tagId = c.req.param('id');

    const tag = await c.env.DB.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?')
      .bind(tagId, userId)
      .first<TagRow>();

    if (!tag) {
      return c.json({ error: 'Tag not found' }, 404);
    }

    // Delete tag (CASCADE will delete task_tags entries)
    await c.env.DB.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?').bind(tagId, userId).run();

    return c.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Tag ID:', c.req.param('id'));
    return errorResponse(c, error, 'Failed to delete tag');
  }
});

export default tagsRoutes;

