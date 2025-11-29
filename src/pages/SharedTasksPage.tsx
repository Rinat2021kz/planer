import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { TaskCard } from '../components/TaskCard';
import { getSharedTasks } from '../api/sharing';
import { updateTask, archiveTask } from '../api/tasks';
import type { SharedTask } from '../api/sharing';

export const SharedTasksPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<SharedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSharedTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSharedTasks();
      setTasks(response.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shared tasks');
      console.error('Error loading shared tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSharedTasks();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: 'done' | 'planned') => {
    try {
      await updateTask(taskId, { status: newStatus });
      await loadSharedTasks();
    } catch (err) {
      console.error('Error updating task:', err);
      // Check if error is due to permissions
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      if (errorMessage.includes('permission') || errorMessage.includes('edit')) {
        setError('У вас нет прав на редактирование этой задачи');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await archiveTask(taskId);
      await loadSharedTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      // Check if error is due to permissions
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      if (errorMessage.includes('permission') || errorMessage.includes('owner')) {
        setError('Только владелец может удалить задачу');
      } else {
        setError(errorMessage);
      }
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
        Общие задачи
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Задачи, которыми с вами поделились
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {tasks.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Нет общих задач
        </Typography>
      ) : (
        tasks.map((task: any) => (
          <Box key={task.id} sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
              <Chip
                label={`От: ${task.ownerEmail}`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={task.permission === 'view' ? 'Просмотр' : 'Редактирование'}
                size="small"
                color={task.permission === 'view' ? 'default' : 'success'}
              />
            </Box>
            <TaskCard
              task={task}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onClick={(taskId) => navigate(`/tasks/${taskId}`)}
            />
          </Box>
        ))
      )}
    </Box>
  );
};

