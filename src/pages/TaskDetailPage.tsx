import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TextField,
  MenuItem,
  Chip,
  Autocomplete,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { getTask, updateTask, archiveTask, createTask } from '../api/tasks';
import type { Task, TaskPriority, TaskStatus, UpdateTaskInput, CreateTaskInput } from '../api/tasks';
import { getTags, setTaskTags } from '../api/tags';
import type { Tag } from '../api/tags';
import { ShareTaskDialog } from '../components/ShareTaskDialog';
import { useAuth } from '../AuthContext';

const statusLabels: Record<TaskStatus, string> = {
  planned: 'Запланирована',
  in_progress: 'В работе',
  done: 'Выполнена',
  skipped: 'Пропущена',
  canceled: 'Отменена',
};

export const TaskDetailPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<UpdateTaskInput>({});
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const loadTask = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      setError(null);
      const fetchedTask = await getTask(taskId);
      setTask(fetchedTask);
      setSelectedTags(fetchedTask.tags || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
      console.error('Error loading task:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTags = async () => {
    try {
      const response = await getTags();
      setAvailableTags(response.tags);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  useEffect(() => {
    loadTask();
    loadAvailableTags();
  }, [taskId]);

  const handleEdit = () => {
    if (!task) return;
    
    setEditedTask({
      title: task.title,
      description: task.description || '',
      start_at: task.startAt.slice(0, 16), // Convert to datetime-local format
      deadline_at: task.deadlineAt ? task.deadlineAt.slice(0, 16) : '',
      priority: task.priority,
      status: task.status,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTask({});
    if (task) {
      setSelectedTags(task.tags || []);
    }
  };

  const handleSave = async () => {
    if (!taskId || !task) return;

    try {
      await updateTask(taskId, editedTask);
      
      // Update tags
      const currentTagIds = (task.tags || []).map(t => t.id).sort().join(',');
      const newTagIds = selectedTags.map(t => t.id).sort().join(',');
      
      if (currentTagIds !== newTagIds) {
        await setTaskTags(taskId, selectedTags.map(t => t.id));
      }
      
      setIsEditing(false);
      await loadTask();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      console.error('Error updating task:', err);
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;
    
    if (!confirm('Вы уверены, что хотите архивировать эту задачу?')) {
      return;
    }

    try {
      await archiveTask(taskId);
      navigate(-1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const handleDuplicate = async () => {
    if (!task) return;

    if (task.recurrenceId) {
      if (!confirm('Эта задача является частью периодической серии. Копия будет создана как обычная задача (не периодическая). Продолжить?')) {
        return;
      }
    }

    try {
      const newTaskInput: CreateTaskInput = {
        title: `${task.title} (копия)`,
        description: task.description || undefined,
        start_at: new Date().toISOString(),
        deadline_at: task.deadlineAt || undefined,
        priority: task.priority,
        status: 'planned',
      };

      const createdTask = await createTask(newTaskInput);
      
      // Copy tags
      if (task.tags && task.tags.length > 0) {
        await setTaskTags(createdTask.id, task.tags.map(t => t.id));
      }

      navigate(`/tasks/${createdTask.id}`);
      await loadTask();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate task');
      console.error('Error duplicating task:', err);
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Задача не найдена</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Назад
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {isEditing ? 'Редактирование задачи' : 'Детали задачи'}
        </Typography>
        {!isEditing && (
          <IconButton onClick={handleEdit} color="primary">
            <EditIcon />
          </IconButton>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        {isEditing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Название"
              value={editedTask.title || ''}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="Описание"
              value={editedTask.description || ''}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />

            <TextField
              label="Дата и время начала"
              type="datetime-local"
              value={editedTask.start_at || ''}
              onChange={(e) => setEditedTask({ ...editedTask, start_at: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Дедлайн (опционально)"
              type="datetime-local"
              value={editedTask.deadline_at || ''}
              onChange={(e) => setEditedTask({ ...editedTask, deadline_at: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Приоритет"
              select
              value={editedTask.priority || task.priority}
              onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as TaskPriority })}
              fullWidth
            >
              <MenuItem value="low">Низкий</MenuItem>
              <MenuItem value="medium">Средний</MenuItem>
              <MenuItem value="high">Высокий</MenuItem>
              <MenuItem value="critical">Критический</MenuItem>
            </TextField>

            <TextField
              label="Статус"
              select
              value={editedTask.status || task.status}
              onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as TaskStatus })}
              fullWidth
            >
              <MenuItem value="planned">Запланирована</MenuItem>
              <MenuItem value="in_progress">В работе</MenuItem>
              <MenuItem value="done">Выполнена</MenuItem>
              <MenuItem value="skipped">Пропущена</MenuItem>
              <MenuItem value="canceled">Отменена</MenuItem>
            </TextField>

            <Autocomplete
              multiple
              options={availableTags}
              getOptionLabel={(option) => option.name}
              value={selectedTags}
              onChange={(_event, newValue) => setSelectedTags(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Теги"
                  placeholder="Выберите теги"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name}
                    sx={{
                      backgroundColor: option.color,
                      color: '#fff',
                    }}
                  />
                ))
              }
            />

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                startIcon={<CancelIcon />}
                onClick={handleCancelEdit}
              >
                Отмена
              </Button>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                onClick={handleSave}
              >
                Сохранить
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography variant="h5" gutterBottom>
              {task.title}
            </Typography>

            {task.description && (
              <Typography variant="body1" color="text.secondary" paragraph>
                {task.description}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Статус
                </Typography>
                <Chip label={statusLabels[task.status]} size="small" />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Приоритет
                </Typography>
                <Chip label={task.priority} size="small" color={
                  task.priority === 'critical' ? 'error' :
                  task.priority === 'high' ? 'warning' :
                  task.priority === 'medium' ? 'info' : 'default'
                } />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Дата и время начала
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(task.startAt)}
                </Typography>
              </Box>

              {task.deadlineAt && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Дедлайн
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(task.deadlineAt)}
                  </Typography>
                </Box>
              )}

              {task.tags && task.tags.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Теги
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {task.tags.map((tag) => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        sx={{
                          backgroundColor: tag.color,
                          color: '#fff',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Создано
                </Typography>
                <Typography variant="body2">
                  {formatDateTime(task.createdAt)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Обновлено
                </Typography>
                <Typography variant="body2">
                  {formatDateTime(task.updatedAt)}
                </Typography>
              </Box>

              {task.recurrenceId && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Тип задачи
                  </Typography>
                  <Chip
                    label="Часть периодической серии"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    Изменения затронут только эту задачу, а не всю серию
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                startIcon={<ShareIcon />}
                variant="outlined"
                onClick={() => setShareDialogOpen(true)}
              >
                Поделиться
              </Button>
              <Button
                startIcon={<ContentCopyIcon />}
                variant="outlined"
                onClick={handleDuplicate}
              >
                Дублировать
              </Button>
              <Button
                startIcon={<DeleteIcon />}
                variant="outlined"
                color="error"
                onClick={handleDelete}
              >
                Архивировать
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {task && (
        <>
          {/* Debug: log task ownership */}
          {console.log('Task ownership check:', {
            taskUserId: task.userId,
            currentUserUid: user?.uid,
            isOwner: task.userId === user?.uid,
            taskTitle: task.title
          })}
          <ShareTaskDialog
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            taskId={task.id}
            taskTitle={task.title}
            isOwner={task.userId === user?.uid}
          />
        </>
      )}
    </Box>
  );
};

