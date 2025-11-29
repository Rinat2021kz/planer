// Utility functions for common task actions

import { updateTask, archiveTask, duplicateTask } from '../api/tasks';

export const createTaskHandlers = (
  loadTasks: () => Promise<void>,
  navigate: (path: string) => void,
  setError: (error: string | null) => void
) => {
  const handleStatusChange = async (taskId: string, newStatus: 'done' | 'planned') => {
    try {
      await updateTask(taskId, { status: newStatus });
      await loadTasks();
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleEdit = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleDuplicate = async (taskId: string) => {
    try {
      await duplicateTask(taskId);
      await loadTasks();
    } catch (err) {
      console.error('Error duplicating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to duplicate task');
    }
  };

  const handleShare = async (taskId: string) => {
    const shareUrl = `${window.location.origin}/tasks/${taskId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Share Task',
          text: 'Check out this task',
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setError('Link copied to clipboard!');
        setTimeout(() => setError(null), 2000);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
        setError('Failed to copy link');
      }
    }
  };

  const handleArchive = async (taskId: string) => {
    try {
      await updateTask(taskId, { is_archived: true });
      await loadTasks();
    } catch (err) {
      console.error('Error archiving task:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive task');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await archiveTask(taskId);
      await loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  return {
    handleStatusChange,
    handleEdit,
    handleDuplicate,
    handleShare,
    handleArchive,
    handleDelete,
  };
};

