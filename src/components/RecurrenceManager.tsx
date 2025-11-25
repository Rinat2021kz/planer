import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { getRecurrences, createRecurrence, updateRecurrence, deleteRecurrence } from '../api/recurrences';
import type { Recurrence, RecurrenceType, CreateRecurrenceInput, UpdateRecurrenceInput } from '../api/recurrences';

const recurrenceTypeLabels: Record<RecurrenceType, string> = {
  daily: 'Ежедневно',
  weekly: 'Еженедельно',
  monthly: 'Ежемесячно',
  yearly: 'Ежегодно',
  custom: 'Настраиваемое',
  workdays: 'По рабочим дням',
  weekends: 'По выходным',
};

const weekdayLabels: Record<string, string> = {
  monday: 'Понедельник',
  tuesday: 'Вторник',
  wednesday: 'Среда',
  thursday: 'Четверг',
  friday: 'Пятница',
  saturday: 'Суббота',
  sunday: 'Воскресенье',
};

export const RecurrenceManager = () => {
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecurrence, setEditingRecurrence] = useState<Recurrence | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateRecurrenceInput>({
    type: 'daily',
    title: '',
    start_date: '',
    priority: 'medium',
  });
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);

  const loadRecurrences = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRecurrences();
      setRecurrences(response.recurrences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recurrences');
      console.error('Error loading recurrences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecurrences();
  }, []);

  const handleOpenDialog = (recurrence?: Recurrence) => {
    if (recurrence) {
      setEditingRecurrence(recurrence);
      setFormData({
        type: recurrence.type,
        title: recurrence.title,
        description: recurrence.description || undefined,
        start_date: recurrence.startDate.slice(0, 16),
        priority: recurrence.priority as any,
        interval: recurrence.interval,
        interval_unit: recurrence.intervalUnit as any,
        weekdays: recurrence.weekdays || undefined,
        month_day: recurrence.monthDay || undefined,
        end_type: recurrence.endType,
        end_date: recurrence.endDate?.slice(0, 16) || undefined,
        end_count: recurrence.endCount || undefined,
        duration_minutes: recurrence.durationMinutes || undefined,
      });
      setSelectedWeekdays(recurrence.weekdays || []);
    } else {
      setEditingRecurrence(null);
      const now = new Date();
      const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setFormData({
        type: 'daily',
        title: '',
        start_date: timeString,
        priority: 'medium',
        end_type: 'never',
      });
      setSelectedWeekdays([]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRecurrence(null);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const input: CreateRecurrenceInput = {
        ...formData,
        weekdays: formData.type === 'weekly' ? selectedWeekdays : undefined,
      };

      if (editingRecurrence) {
        await updateRecurrence(editingRecurrence.id, input as UpdateRecurrenceInput);
      } else {
        await createRecurrence(input);
      }
      
      handleCloseDialog();
      await loadRecurrences();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recurrence');
      console.error('Error saving recurrence:', err);
    }
  };

  const handleDelete = async (recurrenceId: string) => {
    if (!confirm('Are you sure you want to delete this recurrence?')) {
      return;
    }

    try {
      await deleteRecurrence(recurrenceId);
      await loadRecurrences();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recurrence');
      console.error('Error deleting recurrence:', err);
    }
  };

  const handleWeekdayToggle = (day: string) => {
    setSelectedWeekdays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Периодические задачи</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={() => handleOpenDialog()}
        >
          Добавить
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {recurrences.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Нет периодических задач
        </Typography>
      ) : (
        <List>
          {recurrences.map((recurrence) => (
            <ListItem key={recurrence.id}>
              <ListItemText
                primary={recurrence.title}
                secondary={
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip label={recurrenceTypeLabels[recurrence.type]} size="small" />
                    {!recurrence.isActive && <Chip label="Неактивно" size="small" color="default" />}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton size="small" onClick={() => handleOpenDialog(recurrence)}>
                  <EditIcon />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(recurrence.id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRecurrence ? 'Редактировать периодическую задачу' : 'Новая периодическая задача'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Название"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
              autoFocus
            />

            <TextField
              label="Описание"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />

            <TextField
              label="Тип повторения"
              select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as RecurrenceType })}
              fullWidth
            >
              {Object.entries(recurrenceTypeLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            {formData.type === 'weekly' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Дни недели
                </Typography>
                <FormGroup row>
                  {Object.entries(weekdayLabels).map(([value, label]) => (
                    <FormControlLabel
                      key={value}
                      control={
                        <Checkbox
                          checked={selectedWeekdays.includes(value)}
                          onChange={() => handleWeekdayToggle(value)}
                        />
                      }
                      label={label}
                    />
                  ))}
                </FormGroup>
              </Box>
            )}

            {formData.type === 'monthly' && (
              <TextField
                label="День месяца"
                type="number"
                value={formData.month_day || ''}
                onChange={(e) => setFormData({ ...formData, month_day: parseInt(e.target.value) || undefined })}
                inputProps={{ min: 1, max: 31 }}
                fullWidth
              />
            )}

            {formData.type === 'custom' && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Каждые N"
                  type="number"
                  value={formData.interval || 1}
                  onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1 }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  select
                  value={formData.interval_unit || 'days'}
                  onChange={(e) => setFormData({ ...formData, interval_unit: e.target.value as any })}
                  sx={{ flex: 1 }}
                >
                  <MenuItem value="days">Дней</MenuItem>
                  <MenuItem value="weeks">Недель</MenuItem>
                  <MenuItem value="months">Месяцев</MenuItem>
                </TextField>
              </Box>
            )}

            <TextField
              label="Дата и время начала"
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Приоритет"
              select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              fullWidth
            >
              <MenuItem value="low">Низкий</MenuItem>
              <MenuItem value="medium">Средний</MenuItem>
              <MenuItem value="high">Высокий</MenuItem>
              <MenuItem value="critical">Критический</MenuItem>
            </TextField>

            <TextField
              label="Правило остановки"
              select
              value={formData.end_type || 'never'}
              onChange={(e) => setFormData({ ...formData, end_type: e.target.value as any })}
              fullWidth
            >
              <MenuItem value="never">Никогда</MenuItem>
              <MenuItem value="date">До даты</MenuItem>
              <MenuItem value="count">До количества</MenuItem>
            </TextField>

            {formData.end_type === 'date' && (
              <TextField
                label="Дата окончания"
                type="datetime-local"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            )}

            {formData.end_type === 'count' && (
              <TextField
                label="Количество повторений"
                type="number"
                value={formData.end_count || ''}
                onChange={(e) => setFormData({ ...formData, end_count: parseInt(e.target.value) || undefined })}
                inputProps={{ min: 1 }}
                fullWidth
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSave} variant="contained">
            {editingRecurrence ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

