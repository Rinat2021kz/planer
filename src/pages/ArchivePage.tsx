import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Restore as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { getTasks, unarchiveTask, permanentlyDeleteTask } from '../api/tasks';
import type { Task } from '../api/tasks';

export const ArchivePage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const navigate = useNavigate();

  const loadArchivedTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTasks({ archived: 'true' });
      setTasks(response.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load archived tasks');
      console.error('Error loading archived tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchivedTasks();
  }, []);

  const handleRestore = async (task: Task) => {
    try {
      await unarchiveTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore task');
      console.error('Error restoring task:', err);
    }
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    try {
      await permanentlyDeleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task permanently');
      console.error('Error deleting task permanently:', err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
      <Typography variant="h5" gutterBottom>
        Архив
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {tasks.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Архив пуст. Архивированные задачи появятся здесь.
        </Alert>
      ) : (
        <>
          <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
            В архиве {tasks.length} {tasks.length === 1 ? 'задача' : tasks.length < 5 ? 'задачи' : 'задач'}
          </Alert>

          <List>
            {tasks.map((task) => (
              <ListItem
                key={task.id}
                sx={{
                  bgcolor: 'background.paper',
                  mb: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  p: 2,
                }}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      edge="end"
                      aria-label="restore"
                      onClick={() => handleRestore(task)}
                      color="primary"
                      title="Восстановить"
                    >
                      <RestoreIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete-permanently"
                      onClick={() => handleDeleteClick(task)}
                      color="error"
                      title="Удалить навсегда"
                    >
                      <DeleteForeverIcon />
                    </IconButton>
                  </Box>
                }
              >
                <Box
                  sx={{ cursor: 'pointer', width: '100%', mb: 1 }}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <ListItemText
                    primary={task.title}
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(task.startAt)}
                        </Typography>
                        {task.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {task.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip
                    label={task.priority}
                    size="small"
                    color={
                      task.priority === 'critical'
                        ? 'error'
                        : task.priority === 'high'
                        ? 'warning'
                        : task.priority === 'medium'
                        ? 'info'
                        : 'default'
                    }
                  />
                  {task.tags?.map((tag) => (
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
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Удалить задачу навсегда?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Вы уверены, что хотите окончательно удалить задачу "{taskToDelete?.title}"?
            <br />
            <br />
            <strong>Это действие необратимо!</strong> Задача будет удалена из базы данных и ее нельзя будет восстановить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Отмена
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Удалить навсегда
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

