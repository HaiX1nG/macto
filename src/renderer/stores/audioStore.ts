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
  audioLevel: number
  isSpeaking: boolean

  // Actions
  startCapture: () => Promise<void>
  stopCapture: () => Promise<void>
  setMute: (muted: boolean) => void
  setVolume: (volume: number) => void
  setDevices: (devices: MediaDeviceInfo[]) => void
  setInputDevice: (deviceId: string) => void
  setOutputDevice: (deviceId: string) => void
  setStream: (stream: MediaStream | null) => void
  setAudioLevel: (level: number) => void
  setIsSpeaking: (speaking: boolean) => void
  joinVoice: (roomId: number) => Promise<void>
  leaveVoice: (roomId: number) => Promise<void>
}

// Audio analysis context
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let animationFrameId: number | null = null

const startAudioAnalysis = (stream: MediaStream, onLevelChange: (level: number) => void) => {
  // Clean up previous analysis
  stopAudioAnalysis()

  try {
    audioContext = new AudioContext()
    analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const updateLevel = () => {
      if (!analyser) return
      analyser.getByteFrequencyData(dataArray)
      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      // Normalize to 0-100
      const level = Math.min(100, Math.round(average * 100 / 128))
      onLevelChange(level)
      animationFrameId = requestAnimationFrame(updateLevel)
    }
    updateLevel()
  } catch (err) {
    console.error('Failed to start audio analysis:', err)
  }
}

const stopAudioAnalysis = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (audioContext) {
    audioContext.close().catch(() => {})
    audioContext = null
  }
  analyser = null
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
  audioLevel: 0,
  isSpeaking: false,

  startCapture: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput')
      const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput')

      // Start audio level analysis
      startAudioAnalysis(stream, (level) => {
        set({ audioLevel: level, isSpeaking: level > 10 })
      })

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

    // Stop audio analysis
    stopAudioAnalysis()

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
      audioLevel: 0,
      isSpeaking: false,
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
  setAudioLevel: (level) => set({ audioLevel: level }),
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),

  joinVoice: async (roomId) => {
    try {
      // Start local audio capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput')

      // Join voice room on backend
      await voiceService.joinVoice(roomId)

      // Start audio level analysis
      startAudioAnalysis(stream, (level) => {
        set({ audioLevel: level, isSpeaking: level > 10 })
      })

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

    // Stop audio analysis
    stopAudioAnalysis()

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
      audioLevel: 0,
      isSpeaking: false,
    })
  },
}))
