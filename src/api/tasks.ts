// API client for tasks

const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8787' 
  : '';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'planned' | 'in_progress' | 'done' | 'skipped' | 'canceled';

export type Task = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startAt: string;
  deadlineAt: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  isArchived: boolean;
  recurrenceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  start_at: string;
  deadline_at?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  start_at?: string;
  deadline_at?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  is_archived?: boolean;
};

export type TasksFilter = {
  from?: string;
  to?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  archived?: 'true' | 'false';
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

// Create a new task
export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  return fetchWithAuth('/api/protected/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
};

// Get tasks with filters
export const getTasks = async (filters?: TasksFilter): Promise<{ tasks: Task[] }> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value);
      }
    });
  }

  const url = `/api/protected/tasks${params.toString() ? `?${params.toString()}` : ''}`;
  return fetchWithAuth(url);
};

// Get single task by ID
export const getTask = async (id: string): Promise<Task> => {
  return fetchWithAuth(`/api/protected/tasks/${id}`);
};

// Update task
export const updateTask = async (id: string, input: UpdateTaskInput): Promise<Task> => {
  return fetchWithAuth(`/api/protected/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
};

// Archive task (soft delete)
export const archiveTask = async (id: string): Promise<{ message: string }> => {
  return fetchWithAuth(`/api/protected/tasks/${id}`, {
    method: 'DELETE',
  });
};

// Permanently delete task
export const permanentlyDeleteTask = async (id: string): Promise<{ message: string }> => {
  return fetchWithAuth(`/api/protected/tasks/${id}/permanent`, {
    method: 'DELETE',
  });
};

