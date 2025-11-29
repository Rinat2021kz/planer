// Get userId from context
export const getUserId = (c: any): string => {
  const userId = c.get('userId');
  if (!userId) {
    throw new Error('User ID not found in context');
  }
  return userId;
};

