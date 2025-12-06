// API client for task sharing

import { fetchWithAuth } from './config';

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

// Share a task
export const shareTask = async (input: ShareTaskInput): Promise<{ message: string; shareId: string }> => {
  return fetchWithAuth(`/api/protected/tasks/${input.task_id}/share`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
};

// Get shared tasks (tasks shared WITH me)
export const getSharedTasks = async (): Promise<{ tasks: SharedTask[] }> => {
  return fetchWithAuth('/api/protected/tasks/shared-tasks');
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

