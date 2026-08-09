import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useThemeStore, type AppTheme } from '../../stores/themeStore'

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

// Mock document.documentElement
const mockSetAttribute = vi.fn()
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  toggle: vi.fn(),
  contains: vi.fn(),
}

Object.defineProperty(document, 'documentElement', {
  value: {
    setAttribute: mockSetAttribute,
    classList: mockClassList,
    getAttribute: vi.fn(),
  },
  writable: true,
})

// Helper to reset store state between tests
const resetThemeStore = () => {
  localStorageMock.getItem.mockReturnValue(null)
  useThemeStore.setState({
    theme: 'sakura' as AppTheme,
  })
}

describe('useThemeStore (uiStore alias) hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    mockSetAttribute.mockClear()
    resetThemeStore()
  })

  describe('theme state access', () => {
    it('should get current theme', () => {
      const theme = useThemeStore.getState().theme
      expect(theme).toBe('sakura')
    })

    it('should subscribe to theme changes', () => {
      const theme = useThemeStore.getState().theme
      expect(theme).toBe('sakura')

      act(() => {
        useThemeStore.getState().setTheme('ancient')
      })

      expect(useThemeStore.getState().theme).toBe('ancient')
    })
  })

  describe('setTheme action', () => {
    it('should set theme to sakura', () => {
      act(() => {
        useThemeStore.getState().setTheme('sakura')
      })

      const state = useThemeStore.getState()
      expect(state.theme).toBe('sakura')
    })

    it('should set theme to ancient', () => {
      act(() => {
        useThemeStore.getState().setTheme('ancient')
      })

      const state = useThemeStore.getState()
      expect(state.theme).toBe('ancient')
    })

    it('should set theme to tech', () => {
      act(() => {
        useThemeStore.getState().setTheme('tech')
      })

      const state = useThemeStore.getState()
      expect(state.theme).toBe('tech')
    })

    it('should apply theme to document when setting theme', () => {
      act(() => {
        useThemeStore.getState().setTheme('ancient')
      })

      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'ancient')
    })

    it('should save theme to localStorage when setting theme', () => {
      act(() => {
        useThemeStore.getState().setTheme('tech')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('app-theme', 'tech')
    })
  })

  describe('initTheme action', () => {
    it('should initialize with saved theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('ancient')

      act(() => {
        useThemeStore.getState().initTheme()
      })

      expect(useThemeStore.getState().theme).toBe('ancient')
    })

    it('should default to sakura when no saved theme exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      act(() => {
        useThemeStore.getState().initTheme()
      })

      expect(useThemeStore.getState().theme).toBe('sakura')
    })

    it('should default to sakura when saved theme is invalid', () => {
      localStorageMock.getItem.mockReturnValue('invalid')

      act(() => {
        useThemeStore.getState().initTheme()
      })

      expect(useThemeStore.getState().theme).toBe('sakura')
    })

    it('should apply theme to document on initialization', () => {
      localStorageMock.getItem.mockReturnValue('tech')

      act(() => {
        useThemeStore.getState().initTheme()
      })

      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'tech')
    })
  })

  describe('state subscriptions', () => {
    it('should update when store changes', () => {
      let theme = useThemeStore.getState().theme
      expect(theme).toBe('sakura')

      act(() => {
        useThemeStore.getState().setTheme('ancient')
      })

      theme = useThemeStore.getState().theme
      expect(theme).toBe('ancient')
    })

    it('should trigger subscription callback on state change', () => {
      const subscribeSpy = vi.fn()
      const unsubscribe = useThemeStore.subscribe(subscribeSpy)

      act(() => {
        useThemeStore.getState().setTheme('tech')
      })

      // Subscription should be called when state changes
      expect(subscribeSpy).toHaveBeenCalled()
      unsubscribe()
    })
  })

  describe('selector patterns', () => {
    it('should select theme value', () => {
      const { theme } = useThemeStore.getState()
      expect(theme).toBe('sakura')
    })

    it('should select computed values', () => {
      let isSakura = useThemeStore.getState().theme === 'sakura'
      expect(isSakura).toBe(true)

      act(() => {
        useThemeStore.getState().setTheme('ancient')
      })

      isSakura = useThemeStore.getState().theme === 'sakura'
      expect(isSakura).toBe(false)
    })

    it('should determine if theme is dark (ancient or tech)', () => {
      let isDark = ['ancient', 'tech'].includes(useThemeStore.getState().theme)
      expect(isDark).toBe(false) // sakura is not dark

      act(() => {
        useThemeStore.getState().setTheme('ancient')
      })

      isDark = ['ancient', 'tech'].includes(useThemeStore.getState().theme)
      expect(isDark).toBe(true)

      act(() => {
        useThemeStore.getState().setTheme('tech')
      })

      isDark = ['ancient', 'tech'].includes(useThemeStore.getState().theme)
      expect(isDark).toBe(true)
    })
  })

  describe('get state without hook', () => {
    it('should get state directly', () => {
      const state = useThemeStore.getState()
      expect(state.theme).toBe('sakura')
    })

    it('should call actions directly', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('ancient')
      expect(useThemeStore.getState().theme).toBe('ancient')
    })

    it('should call initTheme directly', () => {
      localStorageMock.getItem.mockReturnValue('tech')

      const { initTheme } = useThemeStore.getState()
      initTheme()

      expect(useThemeStore.getState().theme).toBe('tech')
    })
  })

  describe('theme transitions', () => {
    it('should handle theme transitions correctly', () => {
      const themes: AppTheme[] = ['sakura', 'ancient', 'tech']

      themes.forEach((targetTheme) => {
        act(() => {
          useThemeStore.getState().setTheme(targetTheme)
        })

        expect(useThemeStore.getState().theme).toBe(targetTheme)
      })
    })

    it('should handle rapid theme changes', () => {
      act(() => {
        useThemeStore.getState().setTheme('ancient')
        useThemeStore.getState().setTheme('tech')
        useThemeStore.getState().setTheme('sakura')
      })

      expect(useThemeStore.getState().theme).toBe('sakura')
    })
  })
})
