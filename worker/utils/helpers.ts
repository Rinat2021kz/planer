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

// Task access permission types
export type TaskAccessLevel = 'none' | 'view' | 'edit' | 'owner';

// Task access info
export type TaskAccessInfo = {
  hasAccess: boolean;
  accessLevel: TaskAccessLevel;
  isOwner: boolean;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

// Check task access with sharing permissions
export const checkTaskAccess = async (
  db: D1Database,
  taskId: string,
  userId: string
): Promise<TaskAccessInfo> => {
  // Check if user is the owner
  const ownerTask = await db
    .prepare('SELECT id, user_id FROM tasks WHERE id = ? AND deleted_at IS NULL')
    .bind(taskId)
    .first<{ id: string; user_id: string }>();

  if (!ownerTask) {
    return {
      hasAccess: false,
      accessLevel: 'none',
      isOwner: false,
      canView: false,
      canEdit: false,
      canDelete: false,
    };
  }

  const isOwner = ownerTask.user_id === userId;

  if (isOwner) {
    return {
      hasAccess: true,
      accessLevel: 'owner',
      isOwner: true,
      canView: true,
      canEdit: true,
      canDelete: true,
    };
  }

  // Check if task is shared with user
  const share = await db
    .prepare('SELECT permission FROM task_shares WHERE task_id = ? AND shared_with_id = ?')
    .bind(taskId, userId)
    .first<{ permission: 'view' | 'edit' }>();

  if (!share) {
    return {
      hasAccess: false,
      accessLevel: 'none',
      isOwner: false,
      canView: false,
      canEdit: false,
      canDelete: false,
    };
  }

  const canEdit = share.permission === 'edit';

  return {
    hasAccess: true,
    accessLevel: share.permission,
    isOwner: false,
    canView: true,
    canEdit: canEdit,
    canDelete: false, // Only owner can delete
  };
};

