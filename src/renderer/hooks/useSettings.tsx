import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useUIStore, type AppTheme } from '@renderer/stores/uiStore'

/**
 * SettingsContext (legacy compatibility shim)
 *
 * Settings have been merged into uiStore under the `settings` property.
 * This context exposes them as a flat API for components that haven't been migrated.
 */

interface SettingsContextType {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
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
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const settings = useUIStore((s) => s.settings)
  const setAudioInputDevice = useUIStore((s) => s.setAudioInputDevice)
  const setAudioOutputDevice = useUIStore((s) => s.setAudioOutputDevice)
  const setDefaultVolume = useUIStore((s) => s.setDefaultVolume)
  const setAutoJoinLastSession = useUIStore((s) => s.setAutoJoinLastSession)
  const setShowNotification = useUIStore((s) => s.setShowNotification)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        audioInputDeviceId: settings.audioInputDeviceId,
        audioOutputDeviceId: settings.audioOutputDeviceId,
        setAudioInputDevice,
        setAudioOutputDevice,
        defaultVolume: settings.defaultVolume,
        setDefaultVolume,
        autoJoinLastSession: settings.autoJoinLastSession,
        setAutoJoinLastSession,
        showNotification: settings.showNotification,
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
