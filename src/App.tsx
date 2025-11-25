import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
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
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Logout as LogoutIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarMonthIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material'
import { useThemeContext } from './ThemeContext'
import { useAuth } from './AuthContext'
import { Login } from './components/Login'
import { Register } from './components/Register'
import { VerifyEmail } from './components/VerifyEmail'
import { ForgotPassword } from './components/ForgotPassword'
import { TodayPage } from './pages/TodayPage'
import { WeekPage } from './pages/WeekPage'
import { MonthPage } from './pages/MonthPage'
import { SettingsPage } from './pages/SettingsPage'
import { TaskDetailPage } from './pages/TaskDetailPage'
import './App.css'

// Main authenticated app layout component
const AppLayout = () => {
  const { mode, toggleTheme } = useThemeContext()
  const { user, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Get bottom navigation value based on current route
  const getBottomNavValue = () => {
    if (location.pathname === '/today') return 0
    if (location.pathname === '/week') return 1
    if (location.pathname === '/month') return 2
    return 0
  }

  const [bottomNavValue, setBottomNavValue] = useState(getBottomNavValue())


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
    { text: 'Сегодня', icon: <TodayIcon />, path: '/today' },
    { text: 'Неделя', icon: <DateRangeIcon />, path: '/week' },
    { text: 'Месяц', icon: <CalendarMonthIcon />, path: '/month' },
    { text: 'Профиль', icon: <PersonIcon />, path: '/profile' },
    { text: 'Настройки', icon: <SettingsIcon />, path: '/settings' },
  ]

  const handleMenuClick = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

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
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton onClick={() => handleMenuClick(item.path)}>
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

      {/* Main content */}
      <Box sx={{ mt: 8 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/week" element={<WeekPage />} />
          <Route path="/month" element={<MonthPage />} />
          <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="/profile" element={<Box sx={{ p: 2 }}><Typography>Профиль</Typography></Box>} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Box>

      <Paper
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={bottomNavValue}
          onChange={(_event, newValue) => {
            setBottomNavValue(newValue)
            const routes = ['/today', '/week', '/month']
            if (routes[newValue]) {
              navigate(routes[newValue])
            }
          }}
        >
          <BottomNavigationAction label="Сегодня" icon={<TodayIcon />} />
          <BottomNavigationAction label="Неделя" icon={<DateRangeIcon />} />
          <BottomNavigationAction label="Месяц" icon={<CalendarMonthIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  )
}

// Main App component with router
function App() {
  const { user, loading } = useAuth()
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

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
