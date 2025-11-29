import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Fab,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { TaskCard } from '../components/TaskCard';
import { TaskFilters } from '../components/TaskFilters';
import type { TaskFiltersValue } from '../components/TaskFilters';
import { getTasks, updateTask, archiveTask } from '../api/tasks';
import type { Task } from '../api/tasks';
import { CreateTaskDialog } from '../components/CreateTaskDialog';

export const AllTasksPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFiltersValue>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build date range from filters
      let from: string | undefined;
      let to: string | undefined;

      if (filters.dateFrom) {
        from = new Date(filters.dateFrom).toISOString();
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        to = endDate.toISOString();
      }

      const response = await getTasks({
        from,
        to,
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

  if (loading && tasks.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h4" gutterBottom>
        Все задачи
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        {filters.dateFrom || filters.dateTo 
          ? 'Задачи за выбранный период' 
          : 'Все ваши задачи без ограничения по дате'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TaskFilters value={filters} onChange={setFilters} />

      {tasks.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          {filters.dateFrom || filters.dateTo || filters.search || filters.status || filters.priority || (filters.tagIds && filters.tagIds.length > 0)
            ? 'Нет задач, соответствующих фильтрам'
            : 'Нет задач. Создайте первую задачу!'}
        </Typography>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Найдено задач: {tasks.length}
          </Typography>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onClick={(taskId) => navigate(`/tasks/${taskId}`)}
            />
          ))}
        </>
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

