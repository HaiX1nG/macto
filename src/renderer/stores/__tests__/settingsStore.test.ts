import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSettingsStore } from '@renderer/stores/settingsStore'

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset store state to initial values
    useSettingsStore.setState({
      audioInputDeviceId: '',
      audioOutputDeviceId: '',
      defaultVolume: 100,
      autoJoinLastSession: false,
      showNotification: true,
      theme: 'sakura',
    })
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useSettingsStore.getState()

      expect(state.audioInputDeviceId).toBe('')
      expect(state.audioOutputDeviceId).toBe('')
      expect(state.defaultVolume).toBe(100)
      expect(state.autoJoinLastSession).toBe(false)
      expect(state.showNotification).toBe(true)
      expect(state.theme).toBe('sakura')
    })
  })

  describe('setAudioInputDevice action', () => {
    it('should set audio input device ID', () => {
      const { setAudioInputDevice } = useSettingsStore.getState()
      setAudioInputDevice('microphone-123')

      expect(useSettingsStore.getState().audioInputDeviceId).toBe('microphone-123')
    })

    it('should accept empty string to clear device', () => {
      const { setAudioInputDevice } = useSettingsStore.getState()

      setAudioInputDevice('device-1')
      expect(useSettingsStore.getState().audioInputDeviceId).toBe('device-1')

      setAudioInputDevice('')
      expect(useSettingsStore.getState().audioInputDeviceId).toBe('')
    })
  })

  describe('setAudioOutputDevice action', () => {
    it('should set audio output device ID', () => {
      const { setAudioOutputDevice } = useSettingsStore.getState()
      setAudioOutputDevice('speaker-456')

      expect(useSettingsStore.getState().audioOutputDeviceId).toBe('speaker-456')
    })
  })

  describe('setDefaultVolume action', () => {
    it('should set default volume', () => {
      const { setDefaultVolume } = useSettingsStore.getState()
      setDefaultVolume(75)

      expect(useSettingsStore.getState().defaultVolume).toBe(75)
    })

    it('should accept volume from 0 to 100', () => {
      const { setDefaultVolume } = useSettingsStore.getState()

      setDefaultVolume(0)
      expect(useSettingsStore.getState().defaultVolume).toBe(0)

      setDefaultVolume(100)
      expect(useSettingsStore.getState().defaultVolume).toBe(100)
    })
  })

  describe('setAutoJoinLastSession action', () => {
    it('should enable auto join', () => {
      const { setAutoJoinLastSession } = useSettingsStore.getState()
      setAutoJoinLastSession(true)

      expect(useSettingsStore.getState().autoJoinLastSession).toBe(true)
    })

    it('should disable auto join', () => {
      const { setAutoJoinLastSession } = useSettingsStore.getState()
      setAutoJoinLastSession(false)

      expect(useSettingsStore.getState().autoJoinLastSession).toBe(false)
    })
  })

  describe('setShowNotification action', () => {
    it('should enable notifications', () => {
      const { setShowNotification } = useSettingsStore.getState()
      setShowNotification(true)

      expect(useSettingsStore.getState().showNotification).toBe(true)
    })

    it('should disable notifications', () => {
      const { setShowNotification } = useSettingsStore.getState()
      setShowNotification(false)

      expect(useSettingsStore.getState().showNotification).toBe(false)
    })
  })

  describe('setTheme action', () => {
    it('should set theme to sakura', () => {
      const { setTheme } = useSettingsStore.getState()
      setTheme('sakura')

      expect(useSettingsStore.getState().theme).toBe('sakura')
    })

    it('should set theme to ancient', () => {
      const { setTheme } = useSettingsStore.getState()
      setTheme('ancient')

      expect(useSettingsStore.getState().theme).toBe('ancient')
    })

    it('should set theme to tech', () => {
      const { setTheme } = useSettingsStore.getState()
      setTheme('tech')

      expect(useSettingsStore.getState().theme).toBe('tech')
    })
  })

  describe('state subscriptions', () => {
    it('should trigger subscription on state change', () => {
      const subscription = vi.fn()
      const unsubscribe = useSettingsStore.subscribe(subscription)

      useSettingsStore.getState().setDefaultVolume(50)

      expect(subscription).toHaveBeenCalled()
      unsubscribe()
    })
  })

  describe('independent settings', () => {
    it('should allow changing multiple settings independently', () => {
      const store = useSettingsStore.getState()

      store.setAudioInputDevice('mic-1')
      store.setDefaultVolume(80)
      store.setAutoJoinLastSession(true)
      store.setTheme('ancient')

      const state = useSettingsStore.getState()

      expect(state.audioInputDeviceId).toBe('mic-1')
      expect(state.defaultVolume).toBe(80)
      expect(state.autoJoinLastSession).toBe(true)
      expect(state.theme).toBe('ancient')
    })
  })

  describe('SettingsState interface', () => {
    it('should have all required properties', () => {
      const state = useSettingsStore.getState()

      // String properties
      expect(typeof state.audioInputDeviceId).toBe('string')
      expect(typeof state.audioOutputDeviceId).toBe('string')

      // Number properties
      expect(typeof state.defaultVolume).toBe('number')

      // Boolean properties
      expect(typeof state.autoJoinLastSession).toBe('boolean')
      expect(typeof state.showNotification).toBe('boolean')

      // Theme property
      expect(['sakura', 'ancient', 'tech']).toContain(state.theme)
    })

    it('should have all action methods', () => {
      const state = useSettingsStore.getState()

      expect(typeof state.setAudioInputDevice).toBe('function')
      expect(typeof state.setAudioOutputDevice).toBe('function')
      expect(typeof state.setDefaultVolume).toBe('function')
      expect(typeof state.setAutoJoinLastSession).toBe('function')
      expect(typeof state.setShowNotification).toBe('function')
      expect(typeof state.setTheme).toBe('function')
    })
  })
})
