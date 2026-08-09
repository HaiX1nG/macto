import { createContext, useContext, useEffect, useState } from 'react'
import { useMediaStore } from '@renderer/stores/mediaStore'

/**
 * AudioContext provider (legacy compatibility shim)
 *
 * Audio capture, device management AND mute state all live in mediaStore
 * (single source of truth). This context exposes them for components that
 * haven't been migrated to useMediaStore directly.
 */

interface AudioContextType {
  // Device & capture state (from mediaStore)
  isCapturing: boolean
  volume: number
  devices: MediaDeviceInfo[]
  startCapture: (roomId?: number) => Promise<void>
  stopCapture: () => Promise<void>
  setDevices: (devices: MediaDeviceInfo[]) => void
  setVolume: (volume: number) => void

  // Mute state (from mediaStore)
  isMuted: boolean
  setMute: (muted: boolean) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    isCapturing,
    volume,
    devices,
    startCapture,
    stopCapture,
    setDevices,
    setVolume,
    isMuted,
    setMute,
  } = useMediaStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <AudioContext.Provider
      value={{
        isCapturing,
        volume,
        devices,
        startCapture,
        stopCapture,
        setDevices,
        setVolume,
        isMuted,
        setMute,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}
