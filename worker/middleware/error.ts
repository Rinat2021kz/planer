import type { ErrorHandler } from 'hono';

// Global error handler
export const errorHandler: ErrorHandler = (err, c) => {
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Error:', err);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Request path:', c.req.path);
  console.error('Request method:', c.req.method);
  console.error('===========================');

  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
      stack: err.stack,
    },
    500
  );
};

