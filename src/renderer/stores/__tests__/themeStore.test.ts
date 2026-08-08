import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUIStore, type AppTheme } from '../uiStore'

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

describe('useUIStore (theme)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    mockSetAttribute.mockClear()
    localStorageMock.getItem.mockReturnValue(null)
    useUIStore.setState({
      theme: 'sakura',
    })
  })

  describe('initial theme state', () => {
    it('should have default theme value of sakura', () => {
      const state = useUIStore.getState()
      expect(state.theme).toBe('sakura')
    })

    it('should have setTheme method available', () => {
      const state = useUIStore.getState()
      expect(typeof state.setTheme).toBe('function')
    })

    it('should have initTheme method available', () => {
      const state = useUIStore.getState()
      expect(typeof state.initTheme).toBe('function')
    })
  })

  describe('setTheme action', () => {
    it('should set theme to sakura', () => {
      const { setTheme } = useUIStore.getState()
      setTheme('sakura')

      expect(useUIStore.getState().theme).toBe('sakura')
    })

    it('should set theme to ancient', () => {
      const { setTheme } = useUIStore.getState()
      setTheme('ancient')

      expect(useUIStore.getState().theme).toBe('ancient')
    })

    it('should set theme to tech', () => {
      const { setTheme } = useUIStore.getState()
      setTheme('tech')

      expect(useUIStore.getState().theme).toBe('tech')
    })

    it('should apply theme to document via data-theme attribute', () => {
      const { setTheme } = useUIStore.getState()
      setTheme('ancient')

      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'ancient')
    })

    it('should save theme to localStorage', () => {
      const { setTheme } = useUIStore.getState()
      setTheme('tech')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('app-theme', 'tech')
    })
  })

  describe('initTheme action', () => {
    it('should initialize with saved theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('ancient')

      const { initTheme } = useUIStore.getState()
      initTheme()

      expect(useUIStore.getState().theme).toBe('ancient')
      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'ancient')
    })

    it('should default to sakura when no saved theme exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { initTheme } = useUIStore.getState()
      initTheme()

      expect(useUIStore.getState().theme).toBe('sakura')
      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'sakura')
    })

    it('should default to sakura when saved theme is invalid', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme')

      const { initTheme } = useUIStore.getState()
      initTheme()

      expect(useUIStore.getState().theme).toBe('sakura')
      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'sakura')
    })

    it('should save default theme to localStorage when no saved theme exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { initTheme } = useUIStore.getState()
      initTheme()

      expect(localStorageMock.setItem).toHaveBeenCalledWith('app-theme', 'sakura')
    })
  })

  describe('theme type validation', () => {
    it('should only accept valid theme values', () => {
      const validThemes: AppTheme[] = ['sakura', 'ancient', 'tech']

      validThemes.forEach((theme) => {
        const { setTheme } = useUIStore.getState()
        setTheme(theme)
        expect(useUIStore.getState().theme).toBe(theme)
      })
    })
  })

  describe('state updates', () => {
    it('should trigger subscription on state change', () => {
      const { setTheme } = useUIStore.getState()
      let renderCount = 0

      const unsubscribe = useUIStore.subscribe(() => {
        renderCount++
      })

      setTheme('tech')
      expect(renderCount).toBeGreaterThan(0)

      unsubscribe()
    })
  })
})
