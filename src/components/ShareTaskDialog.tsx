import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { shareTask, getTaskShares, removeShare, searchUsers } from '../api/sharing';
import type { TaskShare, UserSearchResult } from '../api/sharing';

type ShareTaskDialogProps = {
  open: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  isOwner: boolean;
};

export const ShareTaskDialog = ({ open, onClose, taskId, taskTitle, isOwner }: ShareTaskDialogProps) => {
  const [shares, setShares] = useState<TaskShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [searchLoading, setSearchLoading] = useState(false);

  const loadShares = async () => {
    try {
      setLoading(true);
      const response = await getTaskShares(taskId);
      setShares(response.shares);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shares');
      console.error('Error loading shares:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadShares();
    }
  }, [open, taskId]);

  const handleSearchUsers = async (email: string) => {
    if (email.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await searchUsers(email);
      setSearchResults(response.users);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    try {
      await shareTask({
        task_id: taskId,
        shared_with_email: selectedUser.email,
        permission,
      });
      setSelectedUser(null);
      setSearchResults([]);
      await loadShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share task');
      console.error('Error sharing task:', err);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to remove this share?')) {
      return;
    }

    try {
      await removeShare(taskId, shareId);
      await loadShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove share');
      console.error('Error removing share:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Поделиться задачей: {taskTitle}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
          Добавить пользователя
        </Typography>

        <Autocomplete
          options={searchResults}
          getOptionLabel={(option) => `${option.email} ${option.displayName ? `(${option.displayName})` : ''}`}
          value={selectedUser}
          onChange={(_event, newValue) => setSelectedUser(newValue)}
          loading={searchLoading}
          onInputChange={(_event, value) => handleSearchUsers(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Поиск по email"
              placeholder="Введите email пользователя"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          fullWidth
          sx={{ mb: 2 }}
        />

        <TextField
          select
          label="Права доступа"
          value={permission}
          onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
          fullWidth
          sx={{ mb: 2 }}
          disabled={!isOwner}
          helperText={!isOwner ? "Вы можете приглашать только с правами просмотра" : ""}
        >
          <MenuItem value="view">Просмотр</MenuItem>
          {isOwner && <MenuItem value="edit">Редактирование</MenuItem>}
        </TextField>

        <Button onClick={handleShare} variant="contained" fullWidth disabled={!selectedUser}>
          Добавить
        </Button>

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
          Пользователи с доступом
        </Typography>

        {loading ? (
          <CircularProgress size={24} />
        ) : shares.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Задача ни с кем не поделена
          </Typography>
        ) : (
          <List>
            {shares.map((share) => (
              <ListItem key={share.id}>
                <ListItemText
                  primary={share.email}
                  secondary={`${share.displayName || ''} • ${share.permission === 'view' ? 'Просмотр' : 'Редактирование'}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveShare(share.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

