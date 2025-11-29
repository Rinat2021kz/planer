import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Fab,
} from '@mui/material';
import {
  ViewList as ViewListIcon,
  CalendarMonth as CalendarMonthIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { CalendarView } from '../components/CalendarView';
import { TaskCard } from '../components/TaskCard';
import { TaskFilters } from '../components/TaskFilters';
import type { TaskFiltersValue } from '../components/TaskFilters';
import { getTasks, updateTask, archiveTask } from '../api/tasks';
import type { Task } from '../api/tasks';
import { CreateTaskDialog } from '../components/CreateTaskDialog';

export const CalendarPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filters, setFilters] = useState<TaskFiltersValue>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Get month range for current view
  const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    
    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  };

  const loadTasks = async (date: Date = selectedDate) => {
    try {
      setLoading(true);
      setError(null);
      const range = getMonthRange(date);
      const response = await getTasks({
        from: range.from,
        to: range.to,
        archived: 'false',
        search: filters.search,
        status: filters.status,
        priority: filters.priority,
        tags: filters.tagIds?.join(','),
      });
      setTasks(response.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(selectedDate);
  }, [selectedDate, filters]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (date: Date) => {
    setSelectedDate(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const handleStatusChange = async (taskId: string, newStatus: 'done' | 'planned') => {
    try {
      await updateTask(taskId, { status: newStatus });
      await loadTasks();
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await archiveTask(taskId);
      await loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  // Get tasks for selected date
  const getTasksForSelectedDate = (): Task[] => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return tasks.filter(task => {
      const taskDate = new Date(task.startAt).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  const selectedDateTasks = getTasksForSelectedDate();
  const formattedSelectedDate = selectedDate.toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading && tasks.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Календарь
        </Typography>
        
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && setViewMode(newMode)}
          size="small"
        >
          <ToggleButton value="calendar" aria-label="календарь">
            <CalendarMonthIcon />
          </ToggleButton>
          <ToggleButton value="list" aria-label="список">
            <ViewListIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TaskFilters value={filters} onChange={setFilters} />

      {viewMode === 'calendar' && (
        <>
          <CalendarView
            tasks={tasks}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
          />

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
              {formattedSelectedDate}
            </Typography>

            {selectedDateTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Нет задач на эту дату
              </Typography>
            ) : (
              selectedDateTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onClick={(taskId) => navigate(`/tasks/${taskId}`)}
                />
              ))
            )}
          </Box>
        </>
      )}

      {viewMode === 'list' && (
        <Box sx={{ mt: 2 }}>
          {tasks.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              Нет задач в этом месяце
            </Typography>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onClick={(taskId) => navigate(`/tasks/${taskId}`)}
              />
            ))
          )}
        </Box>
      )}

      <Fab
        color="primary"
        aria-label="Добавить задачу"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      <CreateTaskDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onTaskCreated={loadTasks}
        defaultDate={selectedDate}
      />
    </Box>
  );
};

