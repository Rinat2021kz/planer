import type { RecurrenceRow } from '../types';

// Limit for how many days ahead we generate tasks from recurrences in a single request
export const MAX_RECURRENCE_GENERATION_DAYS = 120;

// Check if a task should be generated on a specific date based on recurrence rules
export const shouldGenerateTaskOnDate = (recurrence: RecurrenceRow, date: Date): boolean => {
  const recurrenceStart = new Date(recurrence.start_date);

  // Check if before start date
  if (date < recurrenceStart) {
    return false;
  }

  // Check end conditions
  if (recurrence.end_type === 'date' && recurrence.end_date) {
    if (date > new Date(recurrence.end_date)) {
      return false;
    }
  }

  if (recurrence.end_type === 'count' && recurrence.end_count) {
    if (recurrence.occurrences_generated >= recurrence.end_count) {
      return false;
    }
  }

  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  switch (recurrence.type) {
    case 'daily':
      return true;

    case 'workdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday-Friday

    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6; // Saturday-Sunday

    case 'weekly': {
      if (!recurrence.weekdays) return false;
      const weekdays: string[] = JSON.parse(recurrence.weekdays);
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      return weekdays.includes(dayNames[dayOfWeek]);
    }

    case 'monthly': {
      // Support for specific day of month (e.g., 15th)
      if (recurrence.month_day) {
        return date.getDate() === recurrence.month_day;
      }

      // Support for "nth weekday" pattern (e.g., "2nd Monday")
      if (recurrence.month_week !== null && recurrence.month_weekday) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDayIndex = dayNames.indexOf(recurrence.month_weekday.toLowerCase());

        if (targetDayIndex === -1 || dayOfWeek !== targetDayIndex) {
          return false;
        }

        // Calculate which occurrence of this weekday in the month
        const dayOfMonth = date.getDate();
        const weekInMonth = Math.ceil(dayOfMonth / 7);

        // Support -1 for "last occurrence"
        if (recurrence.month_week === -1) {
          // Check if this is the last occurrence of this weekday
          const nextWeek = new Date(date);
          nextWeek.setDate(date.getDate() + 7);
          return nextWeek.getMonth() !== date.getMonth();
        }

        return weekInMonth === recurrence.month_week;
      }

      return false;
    }

    case 'yearly': {
      const startMonth = recurrenceStart.getMonth();
      const startDay = recurrenceStart.getDate();
      return date.getMonth() === startMonth && date.getDate() === startDay;
    }

    case 'custom': {
      if (!recurrence.interval_unit) return false;

      switch (recurrence.interval_unit) {
        case 'hours': {
          const hoursDiff = Math.floor((date.getTime() - recurrenceStart.getTime()) / (1000 * 60 * 60));
          return hoursDiff >= 0 && hoursDiff % recurrence.interval === 0;
        }
        case 'days': {
          const daysDiff = Math.floor((date.getTime() - recurrenceStart.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff % recurrence.interval === 0;
        }
        case 'weeks': {
          const daysDiff = Math.floor((date.getTime() - recurrenceStart.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff % (recurrence.interval * 7) === 0;
        }
        case 'months': {
          const monthsDiff =
            (date.getFullYear() - recurrenceStart.getFullYear()) * 12 +
            (date.getMonth() - recurrenceStart.getMonth());
          return monthsDiff % recurrence.interval === 0 && date.getDate() === recurrenceStart.getDate();
        }
        case 'years': {
          const yearsDiff = date.getFullYear() - recurrenceStart.getFullYear();
          return (
            yearsDiff % recurrence.interval === 0 &&
            date.getMonth() === recurrenceStart.getMonth() &&
            date.getDate() === recurrenceStart.getDate()
          );
        }
        default:
          return false;
      }
    }

    default:
      return false;
  }
};

// Generate tasks from a recurrence rule for a specific date range
export const generateTasksFromRecurrence = async (
  db: D1Database,
  recurrence: RecurrenceRow,
  fromDate: Date,
  toDate: Date
): Promise<void> => {
  // Normalize range to avoid mutating caller dates
  const rangeStart = new Date(fromDate);
  const rangeEnd = new Date(toDate);

  if (rangeEnd < rangeStart) {
    return;
  }

  // Load existing tasks for this recurrence in the range with a single query
  const { results: existingTasks } = await db
    .prepare(`SELECT start_at FROM tasks WHERE recurrence_id = ? AND start_at >= ? AND start_at <= ?`)
    .bind(recurrence.id, rangeStart.toISOString(), rangeEnd.toISOString())
    .all<{ start_at: string }>();

  const existingDates = new Set(
    existingTasks.map((row) => new Date(row.start_at).toISOString().split('T')[0])
  );

  // Calculate which dates in the range should have tasks
  const dates: Date[] = [];
  const currentDate = new Date(rangeStart);

  while (currentDate <= rangeEnd) {
    // Respect end_count limit across this generation run
    if (
      recurrence.end_type === 'count' &&
      recurrence.end_count !== null &&
      recurrence.occurrences_generated + dates.length >= recurrence.end_count
    ) {
      break;
    }

    const shouldGenerate = shouldGenerateTaskOnDate(recurrence, currentDate);

    if (shouldGenerate) {
      const dateKey = currentDate.toISOString().split('T')[0];

      if (!existingDates.has(dateKey)) {
        dates.push(new Date(currentDate));
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (dates.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  // Create tasks for dates
  for (const date of dates) {
    const taskId = crypto.randomUUID();

    // Set time from recurrence start_date
    const startTime = new Date(recurrence.start_date);
    date.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    let deadlineAt: string | null = null;
    if (recurrence.duration_minutes) {
      const deadline = new Date(date);
      deadline.setMinutes(deadline.getMinutes() + recurrence.duration_minutes);
      deadlineAt = deadline.toISOString();
    }

    await db
      .prepare(
        `INSERT INTO tasks (id, user_id, title, description, start_at, deadline_at, priority, status, recurrence_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        taskId,
        recurrence.user_id,
        recurrence.title,
        recurrence.description,
        date.toISOString(),
        deadlineAt,
        recurrence.priority,
        'planned',
        recurrence.id,
        now,
        now
      )
      .run();
  }

  // Update recurrence stats
  await db
    .prepare(
      `UPDATE recurrences SET occurrences_generated = occurrences_generated + ?, last_generated_at = ?, updated_at = ? WHERE id = ?`
    )
    .bind(dates.length, new Date().toISOString(), new Date().toISOString(), recurrence.id)
    .run();
};

