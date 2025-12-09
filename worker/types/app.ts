import type { VerifyFirebaseAuthEnv } from '@hono/firebase-auth';

// Bindings for Cloudflare Workers environment
export type Bindings = {
  DB: D1Database;
  FIREBASE_PROJECT_ID: string;
  PUBLIC_JWK_CACHE_KEY: string;
} & VerifyFirebaseAuthEnv;

// Variables stored in Hono context
export type Variables = {
  userId?: string;
};

