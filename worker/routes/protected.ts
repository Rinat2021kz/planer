import { Hono } from 'hono';
import { getFirebaseToken } from '@hono/firebase-auth';
import type { Bindings, Variables } from '../types/app';
import { getUserId } from '../utils/auth';

// Protected routes (basic user info)
const protectedRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Basic protected endpoint
protectedRoutes.get('/', (c) => {
  const userId = getUserId(c);
  const idToken = getFirebaseToken(c);
  return c.json({
    name: 'Rinat',
    message: 'API is running',
    email: idToken?.email,
    userId: userId,
  });
});

// User profile
protectedRoutes.get('/profile', (c) => {
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

// Search users by email (for sharing)
protectedRoutes.get('/users/search', async (c) => {
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

    const users = results.map((row) => ({
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

export default protectedRoutes;

