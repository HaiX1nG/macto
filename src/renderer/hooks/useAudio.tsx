import { createContext, useContext, useEffect, useState } from 'react'
import { useAudioStore } from '@renderer/stores/voiceStore'

interface AudioContextType {
  isCapturing: boolean
  isMuted: boolean
  volume: number
  devices: MediaDeviceInfo[]
  startCapture: () => Promise<void>
  stopCapture: () => Promise<void>
  setMute: (muted: boolean) => void
  setVolume: (volume: number) => void
  setDevices: (devices: MediaDeviceInfo[]) => void
  joinVoice: (roomId: number) => Promise<void>
  leaveVoice: (roomId: number) => Promise<void>
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    isCapturing,
    isMuted,
    volume,
    devices,
    startCapture,
    stopCapture,
    setMute,
    setVolume,
    setDevices,
    joinVoice,
    leaveVoice,
  } = useAudioStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <AudioContext.Provider value={{
      isCapturing,
      isMuted,
      volume,
      devices,
      startCapture,
      stopCapture,
      setMute,
      setVolume,
      setDevices,
      joinVoice,
      leaveVoice,
    }}>
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
