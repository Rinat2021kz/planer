import { Hono } from 'hono';
import type { Bindings, Variables } from '../types/app';
import type { RecurrenceCreateInput, RecurrenceUpdateInput, RecurrenceRow } from '../types';
import { getUserId } from '../utils/auth';
import { errorResponse } from '../utils/helpers';
import { recurrenceRowToResponse } from '../utils/mappers';

const recurrencesRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Get all recurrences for current user
recurrencesRoutes.get('/', async (c) => {
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
    return errorResponse(c, error, 'Failed to fetch recurrences');
  }
});

// Get single recurrence by ID
recurrencesRoutes.get('/:id', async (c) => {
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
    return errorResponse(c, error, 'Failed to fetch recurrence');
  }
});

// Create a new recurrence
recurrencesRoutes.post('/', async (c) => {
  let userId: string | undefined;
  let body: RecurrenceCreateInput | undefined;

  try {
    userId = getUserId(c);
    body = await c.req.json<RecurrenceCreateInput>();

    console.log('Creating recurrence:', { userId, body });

    // Validate required fields
    if (!body.title || !body.start_date) {
      return c.json({ error: 'Title and start_date are required' }, 400);
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
    console.error('Request body:', body);
    console.error('User ID:', userId);
    return errorResponse(c, error, 'Failed to create recurrence');
  }
});

// Update recurrence
recurrencesRoutes.patch('/:id', async (c) => {
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
    console.error('Update body:', body);
    return errorResponse(c, error, 'Failed to update recurrence');
  }
});

// Delete recurrence
recurrencesRoutes.delete('/:id', async (c) => {
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
    await c.env.DB.prepare('DELETE FROM recurrences WHERE id = ? AND user_id = ?')
      .bind(recurrenceId, userId)
      .run();

    return c.json({ message: 'Recurrence deleted successfully' });
  } catch (error) {
    return errorResponse(c, error, 'Failed to delete recurrence');
  }
});

export default recurrencesRoutes;

