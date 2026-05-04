import { createContext, useContext, useState } from 'react'
import { useSettingsStore } from '@renderer/stores/settingsStore'

interface SettingsContextType {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  audioInputDeviceId: string
  audioOutputDeviceId: string
  setAudioInputDevice: (deviceId: string) => void
  setAudioOutputDevice: (deviceId: string) => void
  defaultVolume: number
  setDefaultVolume: (volume: number) => void
  autoJoinLastSession: boolean
  setAutoJoinLastSession: (enabled: boolean) => void
  showNotification: boolean
  setShowNotification: (enabled: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const {
    theme,
    setTheme,
    audioInputDeviceId,
    audioOutputDeviceId,
    setAudioInputDevice,
    setAudioOutputDevice,
    defaultVolume,
    setDefaultVolume,
    autoJoinLastSession,
    setAutoJoinLastSession,
    showNotification,
    setShowNotification,
  } = useSettingsStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 始终返回 context provider，即使未挂载
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        audioInputDeviceId,
        audioOutputDeviceId,
        setAudioInputDevice,
        setAudioOutputDevice,
        defaultVolume,
        setDefaultVolume,
        autoJoinLastSession,
        setAutoJoinLastSession,
        showNotification,
        setShowNotification,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
