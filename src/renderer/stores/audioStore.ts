import { create } from 'zustand'
import { voiceService } from '../services'

export interface AudioState {
  isCapturing: boolean
  isMuted: boolean
  volume: number
  inputDeviceId: string
  outputDeviceId: string
  devices: MediaDeviceInfo[]
  stream: MediaStream | null
  currentRoomId: number | null

  // Actions
  startCapture: () => Promise<void>
  stopCapture: () => Promise<void>
  setMute: (muted: boolean) => void
  setVolume: (volume: number) => void
  setDevices: (devices: MediaDeviceInfo[]) => void
  setInputDevice: (deviceId: string) => void
  setOutputDevice: (deviceId: string) => void
  setStream: (stream: MediaStream | null) => void
  joinVoice: (roomId: number) => Promise<void>
  leaveVoice: (roomId: number) => Promise<void>
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isCapturing: false,
  isMuted: false,
  volume: 100,
  inputDeviceId: '',
  outputDeviceId: '',
  devices: [],
  stream: null,
  currentRoomId: null,

  startCapture: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput')
      const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput')

      set({
        isCapturing: true,
        stream,
        devices,
        inputDeviceId: audioInputDevices[0]?.deviceId || '',
        outputDeviceId: audioOutputDevices[0]?.deviceId || '',
      })
    } catch (err) {
      console.error('Failed to start audio capture:', err)
      throw err
    }
  },

  stopCapture: async () => {
    const { stream, currentRoomId } = get()
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }

    // Leave voice room if in one
    if (currentRoomId) {
      try {
        await voiceService.leaveVoice(currentRoomId)
      } catch (err) {
        console.error('Failed to leave voice:', err)
      }
    }

    set({
      isCapturing: false,
      stream: null,
      inputDeviceId: '',
      currentRoomId: null,
    })
  },

  setMute: async (muted) => {
    const { stream, currentRoomId } = get()
    if (stream) {
      stream.getTracks().forEach(track => {
        if (track.kind === 'audio') {
          track.enabled = !muted
        }
      })
    }

    // Sync with backend
    if (currentRoomId) {
      try {
        await voiceService.setMute(currentRoomId, muted)
      } catch (err) {
        console.error('Failed to sync mute state:', err)
      }
    }

    set({ isMuted: muted })
  },

  setVolume: (volume) => set({ volume }),
  setDevices: (devices) => set({ devices }),
  setInputDevice: (deviceId) => set({ inputDeviceId: deviceId }),
  setOutputDevice: (deviceId) => set({ outputDeviceId: deviceId }),
  setStream: (stream) => set({ stream }),

  joinVoice: async (roomId) => {
    try {
      // Start local audio capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput')

      // Join voice room on backend
      await voiceService.joinVoice(roomId)

      set({
        isCapturing: true,
        stream,
        devices,
        inputDeviceId: audioInputDevices[0]?.deviceId || '',
        currentRoomId: roomId,
      })
    } catch (err) {
      console.error('Failed to join voice:', err)
      throw err
    }
  },

  leaveVoice: async (roomId) => {
    const { stream } = get()

    // Stop local stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }

    // Leave voice room on backend
    try {
      await voiceService.leaveVoice(roomId)
    } catch (err) {
      console.error('Failed to leave voice:', err)
    }

    set({
      isCapturing: false,
      stream: null,
      inputDeviceId: '',
      currentRoomId: null,
    })
  },
}))
