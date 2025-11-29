import type { MiddlewareHandler } from 'hono';
import { getFirebaseToken } from '@hono/firebase-auth';
import type { Bindings, Variables } from '../types/app';

// Email verification check middleware
export const requireEmailVerified = (): MiddlewareHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> => {
  return async (c, next) => {
    const idToken = getFirebaseToken(c);

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
  };
};

// User sync middleware: ensure user exists in D1 and attach userId to context
export const syncUser = (): MiddlewareHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> => {
  return async (c, next) => {
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
        .run();

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
  };
};

