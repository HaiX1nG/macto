import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useThemeStore } from '../themeStore'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
  writable: true,
})

describe('useThemeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.getItem.mockReturnValue(null)
    // Reset store state to initial values
    useThemeStore.setState({
      theme: 'system',
      actualTheme: 'light',
    })
  })

  describe('initial state', () => {
    it('should have default theme value of system', () => {
      // Reset store by getting fresh state
      localStorageMock.getItem.mockReturnValue(null)
      const state = useThemeStore.getState()
      expect(state.theme).toBe('system')
      expect(state.actualTheme).toBe('light')
    })

    it('should have empty actualTheme initially', () => {
      const state = useThemeStore.getState()
      expect(state.actualTheme).toBe('light')
    })
  })

  describe('setTheme action', () => {
    it('should set theme to light', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('light')

      const state = useThemeStore.getState()
      expect(state.theme).toBe('light')
      expect(state.actualTheme).toBe('light')
    })

    it('should set theme to dark', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('dark')

      const state = useThemeStore.getState()
      expect(state.theme).toBe('dark')
      expect(state.actualTheme).toBe('dark')
    })

    it('should set theme to system', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('system')

      const state = useThemeStore.getState()
      expect(state.theme).toBe('system')
      expect(state.actualTheme).toBe('light')
    })
  })

  describe('toggleTheme action', () => {
    it('should toggle from light to dark', () => {
      const { toggleTheme, setTheme } = useThemeStore.getState()

      // First set to light
      setTheme('light')

      // Now toggle
      toggleTheme()

      const state = useThemeStore.getState()
      expect(state.theme).toBe('dark')
    })

    it('should toggle from dark to light', () => {
      const { toggleTheme, setTheme } = useThemeStore.getState()

      // First set to dark
      setTheme('dark')

      // Now toggle
      toggleTheme()

      const state = useThemeStore.getState()
      expect(state.theme).toBe('light')
    })

    it('should handle system theme toggle', () => {
      const { toggleTheme, setTheme } = useThemeStore.getState()

      setTheme('system')
      toggleTheme()

      // Should toggle to actual theme based on system preference
      const state = useThemeStore.getState()
      expect(['light', 'dark']).toContain(state.theme)
    })
  })

  describe('state updates', () => {
    it('should update theme state correctly', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('dark')

      const state = useThemeStore.getState()
      expect(state.theme).toBe('dark')
      expect(state.actualTheme).toBe('dark')
    })

    it('should trigger re-render on state change', () => {
      const { setTheme } = useThemeStore.getState()
      let renderCount = 0

      useThemeStore.subscribe(() => {
        renderCount++
      })

      setTheme('dark')
      expect(renderCount).toBeGreaterThan(0)
    })
  })
})
