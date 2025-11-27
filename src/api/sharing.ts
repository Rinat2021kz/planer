// API client for task sharing

const API_BASE_URL = import.meta.env.DEV 
  ? '' 
  : '';

export type TaskShare = {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  permission: 'view' | 'edit';
  createdAt: string;
};

export type ShareTaskInput = {
  task_id: string;
  shared_with_email: string;
  permission: 'view' | 'edit';
};

export type SharedTask = {
  id: string;
  title: string;
  permission: 'view' | 'edit';
  ownerId: string;
  ownerEmail: string;
  // ... other task fields
};

export type UserSearchResult = {
  id: string;
  email: string;
  displayName: string;
};

// Helper to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('firebaseToken');
};

// Helper to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Share a task
export const shareTask = async (input: ShareTaskInput): Promise<{ message: string; shareId: string }> => {
  return fetchWithAuth(`/api/protected/tasks/${input.task_id}/share`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
};

// Get shared tasks (tasks shared WITH me)
export const getSharedTasks = async (): Promise<{ tasks: SharedTask[] }> => {
  return fetchWithAuth('/api/protected/shared-tasks');
};

// Get shares for a task (who has access to MY task)
export const getTaskShares = async (taskId: string): Promise<{ shares: TaskShare[] }> => {
  return fetchWithAuth(`/api/protected/tasks/${taskId}/shares`);
};

// Remove share
export const removeShare = async (taskId: string, shareId: string): Promise<{ message: string }> => {
  return fetchWithAuth(`/api/protected/tasks/${taskId}/shares/${shareId}`, {
    method: 'DELETE',
  });
};

// Search users by email
export const searchUsers = async (email: string): Promise<{ users: UserSearchResult[] }> => {
  return fetchWithAuth(`/api/protected/users/search?email=${encodeURIComponent(email)}`);
};

