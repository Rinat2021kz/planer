import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Chip,
  Autocomplete,
  IconButton,
  Collapse,
  Paper,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import type { TaskPriority, TaskStatus } from '../api/tasks';
import { getTags } from '../api/tags';
import type { Tag } from '../api/tags';

export type TaskFiltersValue = {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tagIds?: string[];
};

type TaskFiltersProps = {
  value: TaskFiltersValue;
  onChange: (filters: TaskFiltersValue) => void;
};

export const TaskFilters = ({ value, onChange }: TaskFiltersProps) => {
  const [expanded, setExpanded] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  const loadTags = async () => {
    try {
      const response = await getTags();
      setAvailableTags(response.tags);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleSearchChange = (search: string) => {
    onChange({ ...value, search: search || undefined });
  };

  const handleStatusChange = (status: string) => {
    onChange({ ...value, status: status ? (status as TaskStatus) : undefined });
  };

  const handlePriorityChange = (priority: string) => {
    onChange({ ...value, priority: priority ? (priority as TaskPriority) : undefined });
  };

  const handleTagsChange = (tags: Tag[]) => {
    onChange({ ...value, tagIds: tags.length > 0 ? tags.map(t => t.id) : undefined });
  };

  const getSelectedTags = (): Tag[] => {
    if (!value.tagIds || value.tagIds.length === 0) return [];
    return availableTags.filter(tag => value.tagIds!.includes(tag.id));
  };

  const hasActiveFilters = !!(value.search || value.status || value.priority || (value.tagIds && value.tagIds.length > 0));

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          placeholder="Поиск по названию..."
          value={value.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          size="small"
          fullWidth
        />
        <IconButton
          onClick={() => setExpanded(!expanded)}
          color={hasActiveFilters ? 'primary' : 'default'}
        >
          <FilterListIcon />
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Paper sx={{ p: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Статус"
              select
              value={value.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="planned">Запланирована</MenuItem>
              <MenuItem value="in_progress">В работе</MenuItem>
              <MenuItem value="done">Выполнена</MenuItem>
              <MenuItem value="skipped">Пропущена</MenuItem>
              <MenuItem value="canceled">Отменена</MenuItem>
            </TextField>

            <TextField
              label="Приоритет"
              select
              value={value.priority || ''}
              onChange={(e) => handlePriorityChange(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="low">Низкий</MenuItem>
              <MenuItem value="medium">Средний</MenuItem>
              <MenuItem value="high">Высокий</MenuItem>
              <MenuItem value="critical">Критический</MenuItem>
            </TextField>

            <Autocomplete
              multiple
              options={availableTags}
              getOptionLabel={(option) => option.name}
              value={getSelectedTags()}
              onChange={(_event, newValue) => handleTagsChange(newValue)}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Теги"
                  placeholder="Выберите теги"
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name}
                    size="small"
                    sx={{
                      backgroundColor: option.color,
                      color: '#fff',
                    }}
                  />
                ))
              }
            />

            {hasActiveFilters && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  size="small"
                  onClick={() => onChange({})}
                  title="Сбросить фильтры"
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            )}
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

