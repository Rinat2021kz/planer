// Error response helper
export const errorResponse = (
  c: any,
  error: Error | unknown,
  message: string,
  statusCode: number = 500
) => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  console.error(`=== ERROR: ${message} ===`);
  console.error('Error:', errorObj);
  console.error('Error message:', errorObj.message);
  console.error('Error stack:', errorObj.stack);
  console.error('===========================');

  return c.json(
    {
      error: message,
      message: errorObj.message,
      stack: errorObj.stack,
    },
    statusCode as any
  );
};

// Validate required fields helper
export const validateRequired = (
  fields: Record<string, any>,
  requiredFields: string[]
): string | null => {
  for (const field of requiredFields) {
    if (!fields[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
};

// Check resource ownership helper
export const checkOwnership = async (
  db: D1Database,
  table: string,
  resourceId: string,
  userId: string,
  additionalWhere: string = ''
): Promise<boolean> => {
  const whereClause = `id = ? AND user_id = ?${additionalWhere ? ' AND ' + additionalWhere : ''}`;
  const result = await db
    .prepare(`SELECT id FROM ${table} WHERE ${whereClause}`)
    .bind(resourceId, userId)
    .first();

  return result !== null;
};

