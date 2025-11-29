import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Box,
  Checkbox,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Repeat as RepeatIcon,
  Event as EventIcon,
  Flag as FlagIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as ContentCopyIcon,
  Share as ShareIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import type { Task } from '../api/tasks';

type TaskCardProps = {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: 'done' | 'planned') => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onDuplicate?: (taskId: string) => void;
  onShare?: (taskId: string) => void;
  onArchive?: (taskId: string) => void;
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

export const TaskCard = ({ 
  task, 
  onStatusChange, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onShare,
  onArchive,
  onClick 
}: TaskCardProps) => {
  const isDone = task.status === 'done';
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  
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

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setAnchorEl(null);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
    if (onEdit) {
      onEdit(task.id);
    }
  };

  const handleDuplicateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
    if (onDuplicate) {
      onDuplicate(task.id);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
    if (onShare) {
      onShare(task.id);
    }
  };

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
    if (onArchive) {
      onArchive(task.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
    if (onDelete) {
      onDelete(task.id);
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
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              aria-label="Меню действий"
            >
              <MoreVertIcon />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              onClick={(e) => e.stopPropagation()}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {onEdit && (
                <MenuItem onClick={handleEditClick}>
                  <ListItemIcon>
                    <EditIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Редактировать</ListItemText>
                </MenuItem>
              )}
              
              {onDuplicate && (
                <MenuItem onClick={handleDuplicateClick}>
                  <ListItemIcon>
                    <ContentCopyIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Дублировать</ListItemText>
                </MenuItem>
              )}
              
              {onShare && (
                <MenuItem onClick={handleShareClick}>
                  <ListItemIcon>
                    <ShareIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Поделиться</ListItemText>
                </MenuItem>
              )}
              
              {onArchive && !task.isArchived && (
                <MenuItem onClick={handleArchiveClick}>
                  <ListItemIcon>
                    <ArchiveIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>В архив</ListItemText>
                </MenuItem>
              )}
              
              {onDelete && (
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Удалить</ListItemText>
                </MenuItem>
              )}
            </Menu>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

