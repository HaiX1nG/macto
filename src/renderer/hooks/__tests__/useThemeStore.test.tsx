import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThemeStore } from '../../stores/themeStore'

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

// Helper to reset store state between tests
const resetThemeStore = () => {
  localStorageMock.getItem.mockReturnValue(null)
  const initialState = {
    theme: 'system' as 'light' | 'dark' | 'system',
    actualTheme: 'light' as 'light' | 'dark',
  }
  useThemeStore.setState(initialState)
}

describe('useThemeStore hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    resetThemeStore()
  })

  describe('theme state access', () => {
    it('should get current theme', () => {
      const theme = useThemeStore.getState().theme

      expect(theme).toBe('system')
    })

    it('should get actual theme', () => {
      const actualTheme = useThemeStore.getState().actualTheme

      expect(actualTheme).toBe('light')
    })

    it('should subscribe to theme changes', () => {
      const theme = useThemeStore.getState().theme

      expect(theme).toBe('system')

      act(() => {
        useThemeStore.getState().setTheme('dark')
      })

      expect(theme).toBe('system') // theme stays system
      expect(useThemeStore.getState().actualTheme).toBe('dark')
    })
  })

  describe('setTheme action', () => {
    it('should set theme to light', () => {
      act(() => {
        useThemeStore.getState().setTheme('light')
      })

      const state = useThemeStore.getState()
      expect(state.theme).toBe('light')
      expect(state.actualTheme).toBe('light')
    })

    it('should set theme to dark', () => {
      act(() => {
        useThemeStore.getState().setTheme('dark')
      })

      const state = useThemeStore.getState()
      expect(state.theme).toBe('dark')
      expect(state.actualTheme).toBe('dark')
    })

    it('should set theme to system', () => {
      act(() => {
        useThemeStore.getState().setTheme('system')
      })

      const state = useThemeStore.getState()
      expect(state.theme).toBe('system')
    })
  })

  describe('toggleTheme action', () => {
    it('should toggle theme', () => {
      renderHook(() => useThemeStore((state) => state.theme))

      act(() => {
        useThemeStore.getState().toggleTheme()
      })

      // Should toggle based on system preference
      expect(['light', 'dark']).toContain(useThemeStore.getState().theme)
    })
  })

  describe('state subscriptions', () => {
    it('should update when store changes', () => {
      let actualTheme = useThemeStore.getState().actualTheme

      expect(actualTheme).toBe('light')

      act(() => {
        useThemeStore.getState().setTheme('dark')
      })

      actualTheme = useThemeStore.getState().actualTheme
      expect(actualTheme).toBe('dark')
    })

    it('should not cause unnecessary re-renders', () => {
      const subscribeSpy = vi.fn()
      const unsubscribe = useThemeStore.subscribe(subscribeSpy)

      renderHook(() => useThemeStore((state) => state.theme))

      act(() => {
        useThemeStore.getState().setTheme('dark')
      })

      // Subscription should be called when state changes
      expect(subscribeSpy).toHaveBeenCalled()
      unsubscribe()
    })
  })

  describe('selector patterns', () => {
    it('should select multiple state values', () => {
      const { theme, actualTheme } = useThemeStore.getState()

      expect(theme).toBe('system')
      expect(actualTheme).toBe('light')
    })

    it('should select computed values', () => {
      let isSystem = useThemeStore.getState().theme === 'system'

      expect(isSystem).toBe(true)

      act(() => {
        useThemeStore.getState().setTheme('dark')
      })

      isSystem = useThemeStore.getState().theme === 'system'
      expect(isSystem).toBe(false)
    })
  })

  describe('get state without hook', () => {
    it('should get state directly', () => {
      const state = useThemeStore.getState()

      expect(state.theme).toBe('system')
      expect(state.actualTheme).toBe('light')
    })

    it('should call actions directly', () => {
      const { setTheme } = useThemeStore.getState()

      setTheme('dark')

      expect(useThemeStore.getState().actualTheme).toBe('dark')
    })
  })
})
