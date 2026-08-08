import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUIStore } from '@renderer/stores/uiStore'

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

describe('useUIStore (settings)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    mockSetAttribute.mockClear()
    localStorageMock.getItem.mockReturnValue(null)
    // Reset store settings to initial values
    useUIStore.setState({
      settings: {
        audioInputDeviceId: '',
        audioOutputDeviceId: '',
        defaultVolume: 100,
        autoJoinLastSession: false,
        showNotification: true,
      },
      theme: 'sakura',
    })
  })

  describe('initial settings state', () => {
    it('should have correct default values', () => {
      const state = useUIStore.getState()

      expect(state.settings.audioInputDeviceId).toBe('')
      expect(state.settings.audioOutputDeviceId).toBe('')
      expect(state.settings.defaultVolume).toBe(100)
      expect(state.settings.autoJoinLastSession).toBe(false)
      expect(state.settings.showNotification).toBe(true)
      expect(state.theme).toBe('sakura')
    })
  })

  describe('setAudioInputDevice action', () => {
    it('should set audio input device ID', () => {
      const { setAudioInputDevice } = useUIStore.getState()
      setAudioInputDevice('microphone-123')

      expect(useUIStore.getState().settings.audioInputDeviceId).toBe('microphone-123')
    })
  })

  describe('setAudioOutputDevice action', () => {
    it('should set audio output device ID', () => {
      const { setAudioOutputDevice } = useUIStore.getState()
      setAudioOutputDevice('speaker-456')

      expect(useUIStore.getState().settings.audioOutputDeviceId).toBe('speaker-456')
    })
  })

  describe('setDefaultVolume action', () => {
    it('should set default volume', () => {
      const { setDefaultVolume } = useUIStore.getState()
      setDefaultVolume(75)

      expect(useUIStore.getState().settings.defaultVolume).toBe(75)
    })
  })

  describe('setAutoJoinLastSession action', () => {
    it('should enable auto join', () => {
      const { setAutoJoinLastSession } = useUIStore.getState()
      setAutoJoinLastSession(true)

      expect(useUIStore.getState().settings.autoJoinLastSession).toBe(true)
    })
  })

  describe('setShowNotification action', () => {
    it('should enable notifications', () => {
      const { setShowNotification } = useUIStore.getState()
      setShowNotification(true)

      expect(useUIStore.getState().settings.showNotification).toBe(true)
    })
  })

  describe('setTheme action', () => {
    it('should set theme to ancient', () => {
      const { setTheme } = useUIStore.getState()
      setTheme('ancient')

      expect(useUIStore.getState().theme).toBe('ancient')
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

  describe('state subscriptions', () => {
    it('should trigger subscription on state change', () => {
      const subscription = vi.fn()
      const unsubscribe = useUIStore.subscribe(subscription)

      useUIStore.getState().setDefaultVolume(50)

      expect(subscription).toHaveBeenCalled()
      unsubscribe()
    })
  })
})
