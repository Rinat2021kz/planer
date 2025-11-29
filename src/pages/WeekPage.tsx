import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Fab,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { TaskCard } from '../components/TaskCard';
import { TaskFilters } from '../components/TaskFilters';
import type { TaskFiltersValue } from '../components/TaskFilters';
import { getTasks } from '../api/tasks';
import type { Task } from '../api/tasks';
import { CreateTaskDialog } from '../components/CreateTaskDialog';
import { createTaskHandlers } from '../utils/taskHandlers';

export const WeekPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFiltersValue>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Monday start
    const start = new Date(now);
    start.setDate(now.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  // Get week's date range (Monday to Sunday) from a given start date
  const getWeekRange = (weekStart: Date) => {
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    
    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const range = getWeekRange(currentWeekStart);
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
    loadTasks();
  }, [currentWeekStart, filters]);

  const handlePreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleToday = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Monday start
    const start = new Date(now);
    start.setDate(now.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
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

  const {
    handleStatusChange: handleStatus,
    handleEdit,
    handleDuplicate,
    handleShare,
    handleArchive,
    handleDelete: handleDeleteTask,
  } = createTaskHandlers(loadTasks, navigate, setError);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 6);
  
  const weekLabel = `${currentWeekStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handlePreviousWeek} size="medium">
          <ChevronLeftIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5">
            {weekLabel}
          </Typography>
          <IconButton onClick={handleToday} size="small" title="Сегодня">
            <TodayIcon />
          </IconButton>
        </Box>
        
        <IconButton onClick={handleNextWeek} size="medium">
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TaskFilters value={filters} onChange={setFilters} />

      {tasks.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Нет задач на эту неделю
        </Typography>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={handleStatus}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onShare={handleShare}
            onArchive={handleArchive}
            onDelete={handleDeleteTask}
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
      />
    </Box>
  );
};

