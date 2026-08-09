import { createContext, useContext, useEffect, useState } from 'react'
import { useMediaStore } from '@renderer/stores/mediaStore'
import { useVoiceStore } from '@renderer/stores/voiceStore'

/**
 * AudioContext provider (legacy compatibility shim)
 *
 * Audio capture and device management have moved to mediaStore.
 * Voice state (mute/deafen) remains in voiceStore.
 * This context combines both for components that haven't been migrated.
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

  // Voice state (from voiceStore)
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
    setMute: setMediaMute,
  } = useMediaStore()
  const { isMuted, setMute: setVoiceMute } = useVoiceStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  // Combine mediaStore mute (manages audio track) with voiceStore mute (UI state)
  const setMute = (muted: boolean) => {
    setMediaMute(muted)
    setVoiceMute(muted)
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
