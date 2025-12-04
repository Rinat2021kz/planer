// API client for tags

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export type Tag = {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateTagInput = {
  name: string;
  color?: string;
};

export type UpdateTagInput = {
  name?: string;
  color?: string;
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

// Get all tags
export const getTags = async (): Promise<{ tags: Tag[] }> => {
  return fetchWithAuth('/api/protected/tags');
};

// Create tag
export const createTag = async (input: CreateTagInput): Promise<Tag> => {
  return fetchWithAuth('/api/protected/tags', {
    method: 'POST',
    body: JSON.stringify(input),
  });
};

// Update tag
export const updateTag = async (id: string, input: UpdateTagInput): Promise<Tag> => {
  return fetchWithAuth(`/api/protected/tags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
};

// Delete tag
export const deleteTag = async (id: string): Promise<{ message: string }> => {
  return fetchWithAuth(`/api/protected/tags/${id}`, {
    method: 'DELETE',
  });
};

// Get tags for a task
export const getTaskTags = async (taskId: string): Promise<{ tags: Tag[] }> => {
  return fetchWithAuth(`/api/protected/tasks/${taskId}/tags`);
};

// Set tags for a task (replaces all)
export const setTaskTags = async (taskId: string, tagIds: string[]): Promise<{ message: string }> => {
  return fetchWithAuth(`/api/protected/tasks/${taskId}/tags`, {
    method: 'PUT',
    body: JSON.stringify({ tagIds }),
  });
};

// Add a tag to a task
export const addTagToTask = async (taskId: string, tagId: string): Promise<{ message: string }> => {
  return fetchWithAuth(`/api/protected/tasks/${taskId}/tags/${tagId}`, {
    method: 'POST',
  });
};

// Remove a tag from a task
export const removeTagFromTask = async (taskId: string, tagId: string): Promise<{ message: string }> => {
  return fetchWithAuth(`/api/protected/tasks/${taskId}/tags/${tagId}`, {
    method: 'DELETE',
  });
};

