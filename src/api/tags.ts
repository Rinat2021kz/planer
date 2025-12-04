// API client for tags

import { fetchWithAuth } from './config';

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

