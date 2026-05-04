import { createContext, useContext, useEffect } from 'react'
import { useThemeStore } from '@renderer/stores/themeStore'

interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme, actualTheme, setTheme, initTheme } = useThemeStore()

  // Initialize theme on mount
  useEffect(() => {
    initTheme()
  }, [initTheme])

  // Apply theme to document when actualTheme changes
  useEffect(() => {
    if (actualTheme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [actualTheme])

  const toggleTheme = () => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(isDark ? 'dark' : 'light')
    } else if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  return (
    <ThemeContext.Provider value={{ theme: actualTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
