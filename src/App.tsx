import { useState } from 'react'
import {
  AppBar,
  Avatar,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Drawer,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Switch,
  Toolbar,
  Typography,
  CircularProgress,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Favorite as FavoriteIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { useThemeContext } from './ThemeContext'
import { useAuth } from './AuthContext'
import { Login } from './components/Login'
import { Register } from './components/Register'
import { VerifyEmail } from './components/VerifyEmail'
import { ForgotPassword } from './components/ForgotPassword'
import './App.css'

function App() {
  const { mode, toggleTheme } = useThemeContext()
  const { user, loading, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [bottomNavValue, setBottomNavValue] = useState(0)
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot-password'>('login')

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // Show login/register/forgot-password if user is not authenticated
  if (!user) {
    if (authView === 'login') {
      return (
        <Login
          onSwitchToRegister={() => setAuthView('register')}
          onSwitchToForgotPassword={() => setAuthView('forgot-password')}
        />
      )
    } else if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />
    } else {
      return <ForgotPassword onBackToLogin={() => setAuthView('login')} />
    }
  }

  // Show email verification screen if email is not verified
  if (!user.emailVerified) {
    return <VerifyEmail />
  }

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const menuItems = [
    { text: 'Главная', icon: <HomeIcon /> },
    { text: 'Избранное', icon: <FavoriteIcon /> },
    { text: 'Профиль', icon: <PersonIcon /> },
    { text: 'Настройки', icon: <SettingsIcon /> },
  ]

  return (
    <Box sx={{ pb: 7 }}>
      <AppBar position="fixed" sx={{ top: 0 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Planer
          </Typography>
          
          {/* Avatar with Badge */}
          <Badge badgeContent={4} color="error" sx={{ mr: 2 }}>
            <NotificationsIcon />
          </Badge>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  border: '2px solid white',
                }}
              />
            }
          >
            <Avatar alt="User Avatar" sx={{ bgcolor: 'secondary.main' }}>
              P
            </Avatar>
          </Badge>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250 }} role="presentation">
          <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Avatar
              alt="User"
              sx={{ width: 64, height: 64, mx: 'auto', mb: 1, bgcolor: 'secondary.main' }}
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="h6">
              {user?.displayName || 'Пользователь'}
            </Typography>
            <Typography variant="body2">{user?.email}</Typography>
          </Box>

          {/* Переключатель темы */}
          <List>
            <ListItem>
              <ListItemIcon>
                {mode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
              </ListItemIcon>
              <ListItemText 
                primary="Тема" 
                secondary={mode === 'dark' ? 'Темная' : 'Светлая'}
              />
              <Switch
                edge="end"
                checked={mode === 'dark'}
                onChange={toggleTheme}
                inputProps={{ 'aria-label': 'Переключить тему' }}
              />
            </ListItem>
          </List>

          <Divider />

          {/* Основное меню */}
          <List onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider />

          {/* Logout */}
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Выход" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Paper
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={bottomNavValue}
          onChange={(_event, newValue) => {
            setBottomNavValue(newValue)
          }}
        >
          <BottomNavigationAction label="Главная" icon={<HomeIcon />} />
          <BottomNavigationAction label="Избранное" icon={<FavoriteIcon />} />
          <BottomNavigationAction label="Профиль" icon={<PersonIcon />} />
          <BottomNavigationAction label="Настройки" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  )
}

export default App
