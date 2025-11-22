import {
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Box,
  Checkbox,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import type { Task } from '../api/tasks';

type TaskCardProps = {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: 'done' | 'planned') => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
};

const priorityColors = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error',
} as const;

const statusLabels = {
  planned: 'Запланирована',
  in_progress: 'В работе',
  done: 'Выполнена',
  skipped: 'Пропущена',
  canceled: 'Отменена',
};

export const TaskCard = ({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) => {
  const isDone = task.status === 'done';

  const handleCheckboxChange = () => {
    if (onStatusChange) {
      onStatusChange(task.id, isDone ? 'planned' : 'done');
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Checkbox
            checked={isDone}
            onChange={handleCheckboxChange}
            sx={{ mt: -1 }}
          />
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              sx={{
                textDecoration: isDone ? 'line-through' : 'none',
                color: isDone ? 'text.secondary' : 'text.primary',
              }}
            >
              {task.title}
            </Typography>

            {task.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, mb: 1 }}
              >
                {task.description}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mt: 1 }}>
              <Chip
                icon={<TimeIcon />}
                label={formatTime(task.startAt)}
                size="small"
                variant="outlined"
              />
              
              <Chip
                label={task.priority}
                size="small"
                color={priorityColors[task.priority]}
              />

              <Chip
                label={statusLabels[task.status]}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

          <Box>
            {onEdit && (
              <IconButton
                size="small"
                onClick={() => onEdit(task.id)}
                aria-label="Редактировать"
              >
                <EditIcon />
              </IconButton>
            )}
            
            {onDelete && (
              <IconButton
                size="small"
                onClick={() => onDelete(task.id)}
                color="error"
                aria-label="Удалить"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

