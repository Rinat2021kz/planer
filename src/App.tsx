import { useState } from 'react'
import {
  AppBar,
  Avatar,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  Drawer,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Modal,
  Paper,
  Stack,
  Switch,
  Toolbar,
  Typography,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Favorite as FavoriteIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Mail as MailIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  Info as InfoIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material'
import { useThemeContext } from './ThemeContext'
import './App.css'

function App() {
  const { mode, toggleTheme } = useThemeContext()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [bottomNavValue, setBottomNavValue] = useState(0)
  const [name, setName] = useState('unknown')

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open)
  }

  const handleModalOpen = () => setModalOpen(true)
  const handleModalClose = () => setModalOpen(false)

  const menuItems = [
    { text: 'Главная', icon: <HomeIcon /> },
    { text: 'Избранное', icon: <FavoriteIcon /> },
    { text: 'Профиль', icon: <PersonIcon /> },
    { text: 'Настройки', icon: <SettingsIcon /> },
  ]

  return (
    <Box sx={{ pb: 7 }}>
      {/* AppBar - Navigation */}
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

      {/* Drawer - Боковое меню */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250 }} role="presentation">
          <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Avatar
              alt="User"
              sx={{ width: 64, height: 64, mx: 'auto', mb: 1, bgcolor: 'secondary.main' }}
            >
              P
            </Avatar>
            <Typography variant="h6">Пользователь</Typography>
            <Typography variant="body2">user@example.com</Typography>
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
        </Box>
      </Drawer>

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ mt: 10, mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          MUI Компоненты
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" paragraph>
          Демонстрация основных компонентов Material UI с mobile-first подходом
        </Typography>

        <Stack spacing={3}>
          {/* Card 1 - API Demo */}
          <Card elevation={3}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <DashboardIcon />
                </Avatar>
              }
              title="API Интеграция"
              subheader="Cloudflare Workers"
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Получите данные из Worker API:
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                Name: {name}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  fetch('/api/')
                    .then((res) => res.json() as Promise<{ name: string }>)
                    .then((data) => setName(data.name))
                }}
              >
                Получить данные
              </Button>
            </CardActions>
          </Card>

          {/* Card 2 - Modal Demo */}
          <Card elevation={3}>
            <CardHeader
              avatar={
                <Badge badgeContent={2} color="secondary">
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <InfoIcon />
                  </Avatar>
                </Badge>
              }
              title="Модальное окно"
              subheader="Демонстрация Modal компонента"
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Нажмите на кнопку, чтобы открыть модальное окно с дополнительной информацией.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" variant="outlined" onClick={handleModalOpen}>
                Открыть Modal
              </Button>
            </CardActions>
          </Card>

          {/* Card 3 - Avatars with Badges */}
          <Card elevation={3}>
            <CardHeader
              title="Аватары с Badge"
              subheader="Различные комбинации"
            />
            <CardContent>
              <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                <Badge badgeContent={4} color="primary">
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <MailIcon />
                  </Avatar>
                </Badge>
                <Badge badgeContent={99} color="error">
                  <Avatar sx={{ bgcolor: 'error.main' }}>U</Avatar>
                </Badge>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color="success"
                >
                  <Avatar src="https://i.pravatar.cc/150?img=1" />
                </Badge>
                <Badge badgeContent="New" color="secondary">
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <NotificationsIcon />
                  </Avatar>
                </Badge>
              </Stack>
            </CardContent>
          </Card>

          {/* Card 4 - Navigation Info */}
          <Card elevation={3}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <MenuIcon />
                </Avatar>
              }
              title="Навигация"
              subheader="Drawer и BottomNavigation"
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Нажмите на иконку меню ☰ вверху, чтобы открыть боковое меню (Drawer)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Используйте нижнюю навигацию (BottomNavigation) для переключения между разделами
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={handleModalClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            maxWidth: 400,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography id="modal-title" variant="h6" component="h2" gutterBottom>
            Модальное окно
          </Typography>
          <Typography id="modal-description" variant="body1" paragraph>
            Это демонстрация модального окна Material UI. Модальные окна отлично подходят для
            отображения важной информации или форм без перехода на новую страницу.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleModalClose}>Отмена</Button>
            <Button variant="contained" onClick={handleModalClose}>
              Понятно
            </Button>
          </Stack>
        </Paper>
      </Modal>

      {/* Bottom Navigation */}
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
