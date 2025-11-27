import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import type { Task } from '../api/tasks';

type CalendarViewProps = {
  tasks: Task[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
};

export const CalendarView = ({ tasks, selectedDate, onDateSelect, onMonthChange }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert to Monday = 0
  };

  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      const taskDate = new Date(task.startAt).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  const getTaskCountByStatus = (dateTasks: Task[]) => {
    return {
      total: dateTasks.length,
      done: dateTasks.filter(t => t.status === 'done').length,
      inProgress: dateTasks.filter(t => t.status === 'in_progress').length,
      planned: dateTasks.filter(t => t.status === 'planned').length,
    };
  };

  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(newMonth);
    if (onMonthChange) {
      onMonthChange(newMonth);
    }
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(newMonth);
    if (onMonthChange) {
      onMonthChange(newMonth);
    }
  };

  const handleToday = () => {
    const today = new Date();
    const newMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setCurrentMonth(newMonth);
    onDateSelect(today);
    if (onMonthChange) {
      onMonthChange(newMonth);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOffset = getFirstDayOfMonth(currentMonth);
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const monthName = currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  // Generate calendar grid
  const calendarDays: (Date | null)[] = [];
  
  // Add empty cells for offset
  for (let i = 0; i < firstDayOffset; i++) {
    calendarDays.push(null);
  }
  
  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  }

  return (
    <Paper sx={{ p: 2 }}>
      {/* Calendar Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handlePreviousMonth} size="small">
          <ChevronLeftIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
            {monthName}
          </Typography>
          <IconButton onClick={handleToday} size="small" title="Сегодня">
            <TodayIcon />
          </IconButton>
        </Box>
        
        <IconButton onClick={handleNextMonth} size="small">
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Weekday Headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
        {weekDays.map(day => (
          <Box
            key={day}
            sx={{
              textAlign: 'center',
              py: 1,
              fontWeight: 'bold',
              fontSize: '0.875rem',
              color: 'text.secondary',
            }}
          >
            {day}
          </Box>
        ))}
      </Box>

      {/* Calendar Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {calendarDays.map((date, index) => {
          if (!date) {
            return <Box key={`empty-${index}`} sx={{ aspectRatio: '1', minHeight: 60 }} />;
          }

          const dateTasks = getTasksForDate(date);
          const taskStats = getTaskCountByStatus(dateTasks);
          const today = isToday(date);
          const selected = isSelectedDate(date);

          return (
            <Tooltip
              key={date.toISOString()}
              title={
                taskStats.total > 0
                  ? `${taskStats.total} задач: ${taskStats.done} выполнено, ${taskStats.inProgress} в работе, ${taskStats.planned} запланировано`
                  : 'Нет задач'
              }
              arrow
            >
              <Paper
                elevation={selected ? 3 : 0}
                sx={{
                  aspectRatio: '1',
                  minHeight: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: today ? '2px solid' : '1px solid',
                  borderColor: today ? 'primary.main' : 'divider',
                  backgroundColor: selected ? 'action.selected' : 'background.paper',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: 'scale(1.05)',
                  },
                  position: 'relative',
                }}
                onClick={() => onDateSelect(date)}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: today || selected ? 'bold' : 'normal',
                    color: today ? 'primary.main' : 'text.primary',
                  }}
                >
                  {date.getDate()}
                </Typography>

                {taskStats.total > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.25, mt: 0.5 }}>
                    {taskStats.done > 0 && (
                      <Badge
                        badgeContent={taskStats.done}
                        color="success"
                        max={99}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.6rem',
                            height: 14,
                            minWidth: 14,
                            padding: '0 3px',
                          },
                        }}
                      />
                    )}
                    {taskStats.inProgress > 0 && (
                      <Badge
                        badgeContent={taskStats.inProgress}
                        color="warning"
                        max={99}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.6rem',
                            height: 14,
                            minWidth: 14,
                            padding: '0 3px',
                          },
                        }}
                      />
                    )}
                    {taskStats.planned > 0 && (
                      <Badge
                        badgeContent={taskStats.planned}
                        color="info"
                        max={99}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.6rem',
                            height: 14,
                            minWidth: 14,
                            padding: '0 3px',
                          },
                        }}
                      />
                    )}
                  </Box>
                )}
              </Paper>
            </Tooltip>
          );
        })}
      </Box>
    </Paper>
  );
};

