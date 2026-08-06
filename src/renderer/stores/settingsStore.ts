import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'

export type AppTheme = 'sakura' | 'ancient' | 'tech'

export interface SettingsState {
  // Audio settings
  audioInputDeviceId: string
  audioOutputDeviceId: string
  defaultVolume: number

  // General settings
  autoJoinLastSession: boolean
  showNotification: boolean

  // Theme settings (migrated from themeStore)
  theme: AppTheme

  // Actions
  setAudioInputDevice: (deviceId: string) => void
  setAudioOutputDevice: (deviceId: string) => void
  setDefaultVolume: (volume: number) => void
  setAutoJoinLastSession: (enabled: boolean) => void
  setShowNotification: (enabled: boolean) => void
  setTheme: (theme: AppTheme) => void
  initTheme: () => void
}

const applyThemeToDocument = (theme: AppTheme) => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('app-theme', theme)
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        audioInputDeviceId: '',
        audioOutputDeviceId: '',
        defaultVolume: 100,
        autoJoinLastSession: false,
        showNotification: true,
        theme: 'sakura',

        setAudioInputDevice: (deviceId) => set({ audioInputDeviceId: deviceId }),
        setAudioOutputDevice: (deviceId) => set({ audioOutputDeviceId: deviceId }),
        setDefaultVolume: (volume) => set({ defaultVolume: volume }),
        setAutoJoinLastSession: (enabled) => set({ autoJoinLastSession: enabled }),
        setShowNotification: (enabled) => set({ showNotification: enabled }),
        setTheme: (theme) => {
          set({ theme })
          applyThemeToDocument(theme)
        },
        initTheme: () => {
          const savedTheme = localStorage.getItem('app-theme') as AppTheme | null
          if (savedTheme && ['sakura', 'ancient', 'tech'].includes(savedTheme)) {
            set({ theme: savedTheme })
            applyThemeToDocument(savedTheme)
          } else {
            applyThemeToDocument('sakura')
          }
        },
      }),
      {
        name: 'macto-settings',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          audioInputDeviceId: state.audioInputDeviceId,
          audioOutputDeviceId: state.audioOutputDeviceId,
          defaultVolume: state.defaultVolume,
          autoJoinLastSession: state.autoJoinLastSession,
          showNotification: state.showNotification,
          theme: state.theme,
        }),
        version: 2,
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
              theme: 'sakura',
            } as SettingsState
          }
          if (version === 1) {
            return {
              ...state,
              theme: 'sakura',
            } as SettingsState
          }
          return state as SettingsState
        },
      }
    ),
    { name: 'SettingsStore', enabled: import.meta.env.DEV }
  )
)

export default useSettingsStore
