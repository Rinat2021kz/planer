// API client for tasks

import type { Tag } from './tags';
import { fetchWithAuth } from './config';

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
  tags?: Tag[];
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
  search?: string;
  tags?: string; // Comma-separated tag IDs
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

// Restore task from archive
export const unarchiveTask = async (id: string): Promise<Task> => {
  return updateTask(id, { is_archived: false });
};

// Permanently delete task
export const permanentlyDeleteTask = async (id: string): Promise<{ message: string }> => {
  return fetchWithAuth(`/api/protected/tasks/${id}/permanent`, {
    method: 'DELETE',
  });
};

// Duplicate task
export const duplicateTask = async (id: string): Promise<Task> => {
  return fetchWithAuth(`/api/protected/tasks/${id}/duplicate`, {
    method: 'POST',
  });
};

