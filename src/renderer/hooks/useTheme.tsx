import { createContext, useContext, useEffect } from 'react'
import { useUIStore, type AppTheme } from '@renderer/stores/uiStore'

interface ThemeContextType {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const initTheme = useUIStore((s) => s.initTheme)

  // Initialize theme on mount
  useEffect(() => {
    initTheme()
  }, [initTheme])

  // Apply theme to document when theme changes
  useEffect(() => {
    const isDark = theme === 'ancient' || theme === 'tech'
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
