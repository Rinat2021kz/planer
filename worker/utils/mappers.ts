import type {
  TaskRow,
  TagRow,
  RecurrenceRow,
  TaskResponse,
  TagResponse,
  RecurrenceResponse,
} from '../types';

// Convert TaskRow to TaskResponse
export const taskRowToResponse = (row: TaskRow): TaskResponse => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  description: row.description,
  startAt: row.start_at,
  deadlineAt: row.deadline_at,
  priority: row.priority,
  status: row.status,
  isArchived: row.is_archived === 1,
  recurrenceId: row.recurrence_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Convert TagRow to TagResponse
export const tagRowToResponse = (row: TagRow): TagResponse => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  color: row.color,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Convert RecurrenceRow to RecurrenceResponse
export const recurrenceRowToResponse = (row: RecurrenceRow): RecurrenceResponse => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  interval: row.interval,
  intervalUnit: row.interval_unit,
  weekdays: row.weekdays ? JSON.parse(row.weekdays) : null,
  monthDay: row.month_day,
  monthWeek: row.month_week,
  monthWeekday: row.month_weekday,
  endType: row.end_type,
  endDate: row.end_date,
  endCount: row.end_count,
  startDate: row.start_date,
  title: row.title,
  description: row.description,
  durationMinutes: row.duration_minutes,
  priority: row.priority,
  occurrencesGenerated: row.occurrences_generated,
  lastGeneratedAt: row.last_generated_at,
  isActive: row.is_active === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

