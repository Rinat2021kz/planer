import {
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Box,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Repeat as RepeatIcon,
  Event as EventIcon,
  Flag as FlagIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { Task } from '../api/tasks';

type TaskCardProps = {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: 'done' | 'planned') => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onClick?: (taskId: string) => void;
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

export const TaskCard = ({ task, onStatusChange, onEdit, onDelete, onClick }: TaskCardProps) => {
  const isDone = task.status === 'done';
  
  // Check if task is overdue
  const isOverdue = task.deadlineAt && new Date(task.deadlineAt) < new Date() && task.status !== 'done';

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(task.id, isDone ? 'planned' : 'done');
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(task.id);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDeadlineStatus = (deadlineAt: string) => {
    const now = new Date();
    const deadline = new Date(deadlineAt);
    const diffInHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 0) {
      return { status: 'overdue', label: 'Просрочен', color: 'error' as const };
    } else if (diffInHours < 24) {
      return { status: 'urgent', label: 'Срочно', color: 'warning' as const };
    } else if (diffInHours < 72) {
      return { status: 'soon', label: 'Скоро', color: 'info' as const };
    }
    return { status: 'normal', label: '', color: 'default' as const };
  };

  return (
    <Card 
      sx={{ 
        mb: 2,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          boxShadow: 3,
        } : {},
      }}
      onClick={handleCardClick}
    >
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
              <Tooltip title="Время начала">
                <Chip
                  icon={<EventIcon />}
                  label={formatDateTime(task.startAt)}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
              
              {task.deadlineAt && (() => {
                const deadlineStatus = getDeadlineStatus(task.deadlineAt);
                const isOverdueOrUrgent = deadlineStatus.status === 'overdue' || deadlineStatus.status === 'urgent';
                
                return (
                  <Tooltip title={`Дедлайн: ${formatDate(task.deadlineAt)} ${formatTime(task.deadlineAt)}`}>
                    <Chip
                      icon={isOverdueOrUrgent ? <WarningIcon /> : <FlagIcon />}
                      label={`${formatDate(task.deadlineAt)} ${formatTime(task.deadlineAt)}`}
                      size="small"
                      color={deadlineStatus.color}
                      variant={isOverdueOrUrgent ? 'filled' : 'outlined'}
                      sx={isOverdueOrUrgent ? {
                        animation: 'pulse 2s ease-in-out infinite',
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.7 },
                        },
                      } : {}}
                    />
                  </Tooltip>
                );
              })()}
              
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

              {isOverdue && (
                <Chip
                  icon={<WarningIcon />}
                  label="Просрочена"
                  size="small"
                  color="error"
                  variant="filled"
                  sx={{
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                    },
                  }}
                />
              )}

              {task.recurrenceId && (
                <Chip
                  icon={<RepeatIcon />}
                  label="Периодическая"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}

              {task.tags && task.tags.map((tag) => (
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

          <Box>
            {onEdit && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task.id);
                }}
                aria-label="Редактировать"
              >
                <EditIcon />
              </IconButton>
            )}
            
            {onDelete && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
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

