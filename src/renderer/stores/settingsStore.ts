import { create } from 'zustand'

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

export const useSettingsStore = create<SettingsState>((set) => ({
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
}))
