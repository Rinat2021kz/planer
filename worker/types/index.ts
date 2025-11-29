// Database Row Types
export type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  created_at: string;
  last_login_at: string | null;
};

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_at: string;
  deadline_at: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in_progress' | 'done' | 'skipped' | 'canceled';
  is_archived: number;
  deleted_at: string | null;
  recurrence_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TagRow = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'workdays' | 'weekends';
export type RecurrenceEndType = 'never' | 'date' | 'count';

export type RecurrenceRow = {
  id: string;
  user_id: string;
  type: RecurrenceType;
  interval: number;
  interval_unit: string | null;
  weekdays: string | null;
  month_day: number | null;
  month_week: number | null;
  month_weekday: string | null;
  end_type: RecurrenceEndType;
  end_date: string | null;
  end_count: number | null;
  start_date: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  priority: string;
  occurrences_generated: number;
  last_generated_at: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type TaskShareRow = {
  id: string;
  task_id: string;
  owner_id: string;
  shared_with_id: string;
  permission: 'view' | 'edit';
  created_at: string;
  updated_at: string;
};

export type AppVersion = {
  id: number;
  version: string;
  build_number: number;
  release_date: string;
  description: string | null;
  is_active: number;
  created_at: string;
};

// Input Types
export type TaskCreateInput = {
  title: string;
  description?: string;
  start_at: string;
  deadline_at?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'planned' | 'in_progress' | 'done' | 'skipped' | 'canceled';
};

export type TaskUpdateInput = {
  title?: string;
  description?: string;
  start_at?: string;
  deadline_at?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'planned' | 'in_progress' | 'done' | 'skipped' | 'canceled';
  is_archived?: boolean;
};

export type TagCreateInput = {
  name: string;
  color?: string;
};

export type TagUpdateInput = {
  name?: string;
  color?: string;
};

export type RecurrenceCreateInput = {
  type: RecurrenceType;
  interval?: number;
  interval_unit?: 'hours' | 'days' | 'weeks' | 'months' | 'years';
  weekdays?: string[];
  month_day?: number;
  month_week?: number;
  month_weekday?: string;
  end_type?: RecurrenceEndType;
  end_date?: string;
  end_count?: number;
  start_date: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
};

export type RecurrenceUpdateInput = {
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

export type ShareTaskInput = {
  task_id: string;
  shared_with_email: string;
  permission: 'view' | 'edit';
};

// Response Types
export type TaskResponse = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startAt: string;
  deadlineAt: string | null;
  priority: string;
  status: string;
  isArchived: boolean;
  recurrenceId: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: TagResponse[];
};

export type TagResponse = {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type RecurrenceResponse = {
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

export type CurrentVersionResponse = {
  version: string;
  buildNumber: number;
  releaseDate: string;
  description: string | null;
};

export type VersionListResponse = {
  id: number;
  version: string;
  buildNumber: number;
  releaseDate: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
};

