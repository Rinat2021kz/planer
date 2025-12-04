// API client for recurrences

import { fetchWithAuth } from './config';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'workdays' | 'weekends';
export type RecurrenceEndType = 'never' | 'date' | 'count';

export type Recurrence = {
  id: string;
  userId: string;
  type: RecurrenceType;
  interval: number;
  intervalUnit: string | null;
  weekdays: string[] | null;
  monthDay: number | null;
  monthWeek: number | null;
  monthWeekday: string | null;
  endType: RecurrenceEndType;
  endDate: string | null;
  endCount: number | null;
  startDate: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  priority: string;
  occurrencesGenerated: number;
  lastGeneratedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateRecurrenceInput = {
  type: RecurrenceType;
  interval?: number;
  interval_unit?: 'hours' | 'days' | 'weeks' | 'months' | 'years';
  weekdays?: string[];
  month_day?: number;
  month_week?: number; // 1-5 for "1st, 2nd, 3rd, 4th, 5th", -1 for "last"
  month_weekday?: string; // 'monday', 'tuesday', etc.
  end_type?: RecurrenceEndType;
  end_date?: string;
  end_count?: number;
  start_date: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
};

export type UpdateRecurrenceInput = {
  type?: RecurrenceType;
  interval?: number;
  interval_unit?: 'hours' | 'days' | 'weeks' | 'months' | 'years';
  weekdays?: string[];
  month_day?: number;
  month_week?: number;
  month_weekday?: string;
  end_type?: RecurrenceEndType;
  end_date?: string;
  end_count?: number;
  start_date?: string;
  title?: string;
  description?: string;
  duration_minutes?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  is_active?: boolean;
};

// Get all recurrences
export const getRecurrences = async (): Promise<{ recurrences: Recurrence[] }> => {
  return fetchWithAuth('/api/protected/recurrences');
};

// Get single recurrence
export const getRecurrence = async (id: string): Promise<Recurrence> => {
  return fetchWithAuth(`/api/protected/recurrences/${id}`);
};

// Create recurrence
export const createRecurrence = async (input: CreateRecurrenceInput): Promise<Recurrence> => {
  return fetchWithAuth('/api/protected/recurrences', {
    method: 'POST',
    body: JSON.stringify(input),
  });
};

// Update recurrence
export const updateRecurrence = async (id: string, input: UpdateRecurrenceInput): Promise<Recurrence> => {
  return fetchWithAuth(`/api/protected/recurrences/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
};

// Delete recurrence
export const deleteRecurrence = async (id: string): Promise<{ message: string }> => {
  return fetchWithAuth(`/api/protected/recurrences/${id}`, {
    method: 'DELETE',
  });
};

