import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Alert,
  Stack,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import { useAuth } from '../AuthContext';
import { useThemeContext } from '../ThemeContext';

export const VerifyEmail = () => {
  const { user, logout, resendVerificationEmail } = useAuth();
  const { mode, toggleTheme } = useThemeContext();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);

  const handleResendEmail = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      await resendVerificationEmail();
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err: unknown) {
      console.error('Error resending verification email:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send verification email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setCheckingVerification(true);
      setError('');
      setMessage('');
      
      // Reload user to get fresh email verification status
      await user?.reload();
      
      if (user?.emailVerified) {
        setMessage('Email verified! Reloading...');
        // Force reload the page to update auth state
        window.location.reload();
      } else {
        setError('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err: unknown) {
      console.error('Error checking verification:', err);
      setError('Error checking verification status. Please try again.');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <IconButton onClick={toggleTheme} size="large" color="primary">
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Box>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <EmailIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Verify Your Email
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                We sent a verification email to:
              </Typography>
              <Typography variant="body1" fontWeight="bold" paragraph>
                {user?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please check your inbox and click the verification link to continue.
              </Typography>
            </Box>

            {message && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={2}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={checkingVerification ? <CircularProgress size={20} /> : <RefreshIcon />}
                onClick={handleCheckVerification}
                disabled={checkingVerification}
              >
                {checkingVerification ? 'Checking...' : 'I Verified My Email'}
              </Button>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleResendEmail}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </Button>

              <Button
                variant="text"
                size="large"
                fullWidth
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ mt: 2 }}
              >
                Logout
              </Button>
            </Stack>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Note:</strong> After clicking the verification link in your email, 
                you will be redirected back to this app. Then click "I Verified My Email" button to continue.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

