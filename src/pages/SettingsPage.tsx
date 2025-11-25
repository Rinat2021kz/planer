import { Box, Typography, Divider } from '@mui/material';
import { TagManager } from '../components/TagManager';
import { RecurrenceManager } from '../components/RecurrenceManager';

export const SettingsPage = () => {
  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h4" gutterBottom>
        Настройки
      </Typography>

      <Box sx={{ mt: 3 }}>
        <TagManager />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <RecurrenceManager />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Add more settings sections here in the future */}
    </Box>
  );
};

