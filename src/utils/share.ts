// Share utility using Capacitor Share API
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Share a task using native share functionality
 * @param taskId - The ID of the task
 * @param taskTitle - The title of the task
 */
export const shareTask = async (taskId: string, taskTitle: string): Promise<void> => {
  const url = `https://planer.gassimov2014.workers.dev/tasks/${taskId}`;
  
  try {
    // Check if Share API is available
    if (!Capacitor.isNativePlatform() && !navigator.share) {
      // Fallback for browsers that don't support Web Share API
      await copyToClipboard(url);
      alert(`Link copied to clipboard!\n${url}`);
      return;
    }

    // Use Capacitor Share API or Web Share API
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: taskTitle,
        text: `Check out this task: ${taskTitle}`,
        url: url,
        dialogTitle: 'Share task',
      });
    } else if (navigator.share) {
      await navigator.share({
        title: taskTitle,
        text: `Check out this task: ${taskTitle}`,
        url: url,
      });
    }
  } catch (error) {
    // User cancelled or error occurred
    if (error instanceof Error && error.message !== 'Share canceled') {
      console.error('Error sharing:', error);
      throw error;
    }
  }
};

/**
 * Copy text to clipboard
 * @param text - The text to copy
 */
const copyToClipboard = async (text: string): Promise<void> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    throw error;
  }
};

/**
 * Check if native or web share is available
 */
export const isShareAvailable = (): boolean => {
  return Capacitor.isNativePlatform() || !!navigator.share;
};

