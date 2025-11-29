import type { VerifyFirebaseAuthEnv } from '@hono/firebase-auth';

// Bindings for Cloudflare Workers environment
export type Bindings = {
  DB: D1Database;
} & VerifyFirebaseAuthEnv;

// Variables stored in Hono context
export type Variables = {
  userId?: string;
};

