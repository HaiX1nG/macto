import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useThemeStore, type AppTheme } from '../themeStore'

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

describe('useThemeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    mockSetAttribute.mockClear()
    localStorageMock.getItem.mockReturnValue(null)
    // Reset store state to initial values
    useThemeStore.setState({
      theme: 'sakura',
    })
  })

  describe('initial state', () => {
    it('should have default theme value of sakura', () => {
      const state = useThemeStore.getState()
      expect(state.theme).toBe('sakura')
    })

    it('should have setTheme method available', () => {
      const state = useThemeStore.getState()
      expect(typeof state.setTheme).toBe('function')
    })

    it('should have initTheme method available', () => {
      const state = useThemeStore.getState()
      expect(typeof state.initTheme).toBe('function')
    })
  })

  describe('setTheme action', () => {
    it('should set theme to sakura', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('sakura')

      const state = useThemeStore.getState()
      expect(state.theme).toBe('sakura')
    })

    it('should set theme to ancient', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('ancient')

      const state = useThemeStore.getState()
      expect(state.theme).toBe('ancient')
    })

    it('should set theme to tech', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('tech')

      const state = useThemeStore.getState()
      expect(state.theme).toBe('tech')
    })

    it('should apply theme to document via data-theme attribute', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('ancient')

      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'ancient')
    })

    it('should save theme to localStorage', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('tech')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('app-theme', 'tech')
    })

    it('should update document attribute each time theme changes', () => {
      const { setTheme } = useThemeStore.getState()

      setTheme('sakura')
      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'sakura')

      setTheme('ancient')
      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'ancient')

      setTheme('tech')
      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'tech')

      expect(mockSetAttribute).toHaveBeenCalledTimes(3)
    })
  })

  describe('initTheme action', () => {
    it('should initialize with saved theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('ancient')

      const { initTheme } = useThemeStore.getState()
      initTheme()

      const state = useThemeStore.getState()
      expect(state.theme).toBe('ancient')
      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'ancient')
    })

    it('should initialize with tech theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('tech')

      const { initTheme } = useThemeStore.getState()
      initTheme()

      const state = useThemeStore.getState()
      expect(state.theme).toBe('tech')
    })

    it('should default to sakura when no saved theme exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { initTheme } = useThemeStore.getState()
      initTheme()

      const state = useThemeStore.getState()
      expect(state.theme).toBe('sakura')
      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'sakura')
    })

    it('should default to sakura when saved theme is invalid', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme')

      const { initTheme } = useThemeStore.getState()
      initTheme()

      const state = useThemeStore.getState()
      expect(state.theme).toBe('sakura')
      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'sakura')
    })

    it('should apply theme to document on initialization', () => {
      localStorageMock.getItem.mockReturnValue('tech')

      const { initTheme } = useThemeStore.getState()
      initTheme()

      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'tech')
    })

    it('should save default theme to localStorage when no saved theme exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { initTheme } = useThemeStore.getState()
      initTheme()

      expect(localStorageMock.setItem).toHaveBeenCalledWith('app-theme', 'sakura')
    })
  })

  describe('state updates', () => {
    it('should update theme state correctly', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('ancient')

      const state = useThemeStore.getState()
      expect(state.theme).toBe('ancient')
    })

    it('should trigger subscription on state change', () => {
      const { setTheme } = useThemeStore.getState()
      let renderCount = 0

      const unsubscribe = useThemeStore.subscribe(() => {
        renderCount++
      })

      setTheme('tech')
      expect(renderCount).toBeGreaterThan(0)

      unsubscribe()
    })

    it('should provide current theme via getState', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('tech')

      expect(useThemeStore.getState().theme).toBe('tech')
    })
  })

  describe('theme type validation', () => {
    it('should only accept valid theme values', () => {
      const validThemes: AppTheme[] = ['sakura', 'ancient', 'tech']

      validThemes.forEach((theme) => {
        const { setTheme } = useThemeStore.getState()
        setTheme(theme)
        expect(useThemeStore.getState().theme).toBe(theme)
      })
    })
  })

  describe('persistence', () => {
    it('should persist theme changes to localStorage', () => {
      const { setTheme } = useThemeStore.getState()

      setTheme('ancient')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('app-theme', 'ancient')

      setTheme('tech')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('app-theme', 'tech')
    })

    it('should restore theme from localStorage on init', () => {
      localStorageMock.getItem.mockReturnValue('ancient')

      // Reset state first
      useThemeStore.setState({ theme: 'sakura' })

      const { initTheme } = useThemeStore.getState()
      initTheme()

      expect(useThemeStore.getState().theme).toBe('ancient')
    })
  })
})
