import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Fab,
  Paper,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Warning as WarningIcon } from '@mui/icons-material';
import { TaskCard } from '../components/TaskCard';
import { TaskFilters } from '../components/TaskFilters';
import type { TaskFiltersValue } from '../components/TaskFilters';
import { getTasks, updateTask, archiveTask } from '../api/tasks';
import type { Task } from '../api/tasks';
import { CreateTaskDialog } from '../components/CreateTaskDialog';

export const TodayPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcomingDeadlineTasks, setUpcomingDeadlineTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFiltersValue>({});

  // Get today's date range
  const getTodayRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    
    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  };

  // Get range for upcoming deadlines (next 3 days)
  const getUpcomingRange = () => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 3);
    
    return {
      from: now.toISOString(),
      to: end.toISOString(),
    };
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load today's tasks
      const range = getTodayRange();
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

      // Load all tasks with upcoming deadlines (not completed)
      const upcomingRange = getUpcomingRange();
      const upcomingResponse = await getTasks({
        from: new Date(0).toISOString(), // All past tasks
        to: new Date(2100, 0, 1).toISOString(), // Far future
        archived: 'false',
      });
      
      // Filter tasks with deadlines in the next 3 days that are not done
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(now.getDate() + 3);
      
      const tasksWithUpcomingDeadlines = upcomingResponse.tasks.filter(task => {
        if (!task.deadlineAt || task.status === 'done') return false;
        const deadline = new Date(task.deadlineAt);
        return deadline >= now && deadline <= threeDaysFromNow;
      });
      
      setUpcomingDeadlineTasks(tasksWithUpcomingDeadlines);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filters]);

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h4" gutterBottom>
        Сегодня
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upcoming Deadlines Section */}
      {upcomingDeadlineTasks.length > 0 && (
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: 'warning.light',
            borderLeft: 4,
            borderColor: 'warning.main',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WarningIcon color="warning" />
            <Typography variant="h6" color="warning.dark">
              Скоро дедлайн ({upcomingDeadlineTasks.length})
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Задачи с дедлайном в ближайшие 3 дня
          </Typography>
          {upcomingDeadlineTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onClick={(taskId) => navigate(`/tasks/${taskId}`)}
            />
          ))}
        </Paper>
      )}

      <Divider sx={{ mb: 2 }} />

      <Typography variant="h6" gutterBottom>
        Задачи на сегодня
      </Typography>

      <TaskFilters value={filters} onChange={setFilters} />

      {tasks.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Нет задач на сегодня
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
        defaultDate={new Date()}
      />
    </Box>
  );
};

