import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SettingsState {
  audioInputDeviceId: string
  audioOutputDeviceId: string
  defaultVolume: number
  autoJoinLastSession: boolean
  showNotification: boolean
  theme: 'light' | 'dark' | 'system'
  setAudioInputDevice: (deviceId: string) => void
  setAudioOutputDevice: (deviceId: string) => void
  setDefaultVolume: (volume: number) => void
  setAutoJoinLastSession: (enabled: boolean) => void
  setShowNotification: (enabled: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      audioInputDeviceId: '',
      audioOutputDeviceId: '',
      defaultVolume: 100,
      autoJoinLastSession: false,
      showNotification: true,
      theme: 'system',

      setAudioInputDevice: (deviceId) => set({ audioInputDeviceId: deviceId }),
      setAudioOutputDevice: (deviceId) => set({ audioOutputDeviceId: deviceId }),
      setDefaultVolume: (volume) => set({ defaultVolume: volume }),
      setAutoJoinLastSession: (enabled) => set({ autoJoinLastSession: enabled }),
      setShowNotification: (enabled) => set({ showNotification: enabled }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'macto-settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<SettingsState>
        if (version === 0) {
          return {
            ...state,
            audioInputDeviceId: state.audioInputDeviceId ?? '',
            audioOutputDeviceId: state.audioOutputDeviceId ?? '',
            defaultVolume: state.defaultVolume ?? 100,
            autoJoinLastSession: state.autoJoinLastSession ?? false,
            showNotification: state.showNotification ?? true,
            theme: state.theme ?? 'system',
          }
        }
        return state as SettingsState
      },
    }
  )
)
