import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

type PaletteMode = 'light' | 'dark'

type ThemeContextType = {
  mode: PaletteMode
  toggleTheme: () => void
  setThemeMode: (mode: PaletteMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeContextProvider')
  }
  return context
}

type ThemeContextProviderProps = {
  children: ReactNode
}

export const ThemeContextProvider = ({ children }: ThemeContextProviderProps) => {
  // Определяем тему из localStorage или системных настроек
  const getInitialMode = (): PaletteMode => {
    const savedMode = localStorage.getItem('themeMode')
    if (savedMode === 'light' || savedMode === 'dark') {
      return savedMode
    }
    // Определяем из системных настроек
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  const [mode, setMode] = useState<PaletteMode>(getInitialMode)

  // Слушаем изменения системной темы
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Только если пользователь не выбрал тему вручную
      const savedMode = localStorage.getItem('themeMode')
      if (!savedMode) {
        setMode(e.matches ? 'dark' : 'light')
      }
    }

    // Современный способ
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    // Fallback для старых браузеров
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  // Сохраняем выбор темы
  useEffect(() => {
    localStorage.setItem('themeMode', mode)
  }, [mode])

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
  }

  const setThemeMode = (newMode: PaletteMode) => {
    setMode(newMode)
  }

  // Mobile-first theme configuration
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#1976d2' : '#90caf9',
          },
          secondary: {
            main: mode === 'light' ? '#dc004e' : '#f48fb1',
          },
          background: {
            default: mode === 'light' ? '#fafafa' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
        typography: {
          fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
          ].join(','),
          // Mobile-optimized font sizes
          h4: {
            fontSize: '1.75rem',
            '@media (min-width:600px)': {
              fontSize: '2.125rem',
            },
          },
          h6: {
            fontSize: '1.125rem',
            '@media (min-width:600px)': {
              fontSize: '1.25rem',
            },
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                // Mobile-friendly button size
                minHeight: '44px',
                textTransform: 'none',
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                // Touch-friendly target size
                padding: '12px',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                // Better mobile spacing
                '@media (max-width:600px)': {
                  borderRadius: '8px',
                },
              },
            },
          },
        },
      }),
    [mode]
  )

  const value = useMemo(
    () => ({
      mode,
      toggleTheme,
      setThemeMode,
    }),
    [mode]
  )

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}

