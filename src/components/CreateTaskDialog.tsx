import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Chip,
  Autocomplete,
  Box,
} from '@mui/material';
import { createTask } from '../api/tasks';
import type { TaskPriority, CreateTaskInput } from '../api/tasks';
import { getTags, setTaskTags } from '../api/tags';
import type { Tag } from '../api/tags';

type CreateTaskDialogProps = {
  open: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
  defaultDate?: Date;
};

export const CreateTaskDialog = ({ open, onClose, onTaskCreated, defaultDate }: CreateTaskDialogProps) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<CreateTaskInput>({
    title: '',
    description: '',
    start_at: '',
    priority: 'medium',
  });

  const loadAvailableTags = async () => {
    try {
      const response = await getTags();
      setAvailableTags(response.tags);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  useEffect(() => {
    if (open) {
      loadAvailableTags();
      // Set default time
      const date = defaultDate || new Date();
      const timeString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      setNewTask({
        title: '',
        description: '',
        start_at: timeString,
        priority: 'medium',
      });
      setSelectedTags([]);
      setError(null);
    }
  }, [open, defaultDate]);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      setError('Название задачи обязательно');
      return;
    }

    if (!newTask.start_at) {
      newTask.start_at = new Date().toISOString();
    }

    try {
      const createdTask = await createTask(newTask);
      
      // Set tags for the task if any selected
      if (selectedTags.length > 0) {
        await setTaskTags(createdTask.id, selectedTags.map(tag => tag.id));
      }
      
      onClose();
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Новая задача</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Название"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
            fullWidth
            autoFocus
            error={!!error && !newTask.title.trim()}
            helperText={error && !newTask.title.trim() ? error : ''}
          />

          <TextField
            label="Описание"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />

          <TextField
            label="Дата и время начала"
            type="datetime-local"
            value={newTask.start_at}
            onChange={(e) => setNewTask({ ...newTask, start_at: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Дедлайн (опционально)"
            type="datetime-local"
            value={newTask.deadline_at || ''}
            onChange={(e) => setNewTask({ ...newTask, deadline_at: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Приоритет"
            select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
            fullWidth
          >
            <MenuItem value="low">Низкий</MenuItem>
            <MenuItem value="medium">Средний</MenuItem>
            <MenuItem value="high">Высокий</MenuItem>
            <MenuItem value="critical">Критический</MenuItem>
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleCreateTask} variant="contained">
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
};

