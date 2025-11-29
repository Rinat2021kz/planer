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

export const MonthPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFiltersValue>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get month's date range
  const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    
    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const range = getMonthRange(currentMonth);
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
  }, [currentMonth, filters]);

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
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

  const monthName = currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handlePreviousMonth} size="medium">
          <ChevronLeftIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>
            {monthName}
          </Typography>
          <IconButton onClick={handleToday} size="small" title="Сегодня">
            <TodayIcon />
          </IconButton>
        </Box>
        
        <IconButton onClick={handleNextMonth} size="medium">
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
          Нет задач на этот месяц
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

