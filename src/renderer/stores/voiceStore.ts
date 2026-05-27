import { create } from 'zustand'
import { voiceService } from '../services'

export interface VoiceParticipant {
  id: number
  roomId: number
  userId: number
  username: string
  joinedAt: string
  isMuted?: boolean
  isSpeaking?: boolean
}

export interface VoiceState {
  isCapturing: boolean
  isMuted: boolean
  volume: number
  inputDeviceId: string
  outputDeviceId: string
  devices: MediaDeviceInfo[]
  stream: MediaStream | null
  audioLevel: number
  isSpeaking: boolean

  currentRoomId: number | null
  participants: VoiceParticipant[]
  isInVoice: boolean
  isLoading: boolean
  error: string | null

  startCapture: () => Promise<void>
  stopCapture: () => Promise<void>
  setMute: (muted: boolean) => Promise<void>
  toggleMute: () => void
  setVolume: (volume: number) => void
  setDevices: (devices: MediaDeviceInfo[]) => void
  setInputDevice: (deviceId: string) => void
  setOutputDevice: (deviceId: string) => void
  setStream: (stream: MediaStream | null) => void
  setAudioLevel: (level: number) => void
  setIsSpeaking: (speaking: boolean) => void

  joinVoice: (roomId: number) => Promise<void>
  leaveVoice: (roomId: number) => Promise<void>
  fetchParticipants: (roomId: number) => Promise<void>
  addParticipant: (participant: VoiceParticipant) => void
  removeParticipant: (participant: VoiceParticipant) => void
  updateVoiceParticipant: (userId: number, updates: Partial<VoiceParticipant>) => void
  setError: (error: string | null) => void
  clearError: () => void
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

export const useVoiceStore = create<VoiceState>((set, get) => ({
  // Audio capture state
  isCapturing: false,
  isMuted: false,
  volume: 100,
  inputDeviceId: '',
  outputDeviceId: '',
  devices: [],
  stream: null,
  audioLevel: 0,
  isSpeaking: false,

  // Voice room state
  currentRoomId: null,
  participants: [],
  isInVoice: false,
  isLoading: false,
  error: null,

  // Audio capture actions
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
      participants: [],
      isInVoice: false,
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

  toggleMute: () => {
    const { isMuted, stream, currentRoomId } = get()
    const newMuted = !isMuted

    if (stream) {
      stream.getTracks().forEach(track => {
        if (track.kind === 'audio') {
          track.enabled = !newMuted
        }
      })
    }

    // Sync with backend asynchronously (don't wait)
    if (currentRoomId) {
      voiceService.setMute(currentRoomId, newMuted).catch((err) => {
        console.error('Failed to sync mute state:', err)
      })
    }

    set({ isMuted: newMuted })
  },

  setVolume: (volume) => set({ volume }),
  setDevices: (devices) => set({ devices }),
  setInputDevice: (deviceId) => set({ inputDeviceId: deviceId }),
  setOutputDevice: (deviceId) => set({ outputDeviceId: deviceId }),
  setStream: (stream) => set({ stream }),
  setAudioLevel: (level) => set({ audioLevel: level }),
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),

  // Voice room actions
  joinVoice: async (roomId: number) => {
    set({ isLoading: true, error: null })

    // Start local audio capture first
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        }
      })
    } catch (micError) {
      // Handle microphone permission errors specifically
      const err = micError as Error & { name?: string }
      console.error('[VoiceStore] Microphone access error:', err)

      let errorMessage: string
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许访问麦克风'
      } else if (err.name === 'NotFoundError') {
        errorMessage = '未找到麦克风设备，请检查设备连接'
      } else if (err.name === 'NotReadableError') {
        errorMessage = '麦克风被其他应用程序占用，请关闭其他应用后重试'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = '麦克风不支持所需的音频设置，请尝试使用其他设备'
      } else {
        errorMessage = `麦克风访问失败: ${err.message || '未知错误'}`
      }

      set({ isLoading: false, error: errorMessage })
      const error = new Error(errorMessage)
      error.cause = micError
      throw error
    }

    // Enumerate devices after successful capture
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioInputDevices = devices.filter(device => device.kind === 'audioinput')

    // Join voice room on backend
    try {
      await voiceService.joinVoice(roomId)
    } catch (apiError) {
      // Stop the stream if API call fails
      stream.getTracks().forEach(track => track.stop())
      stopAudioAnalysis()

      const err = apiError as Error & { response?: { status?: number; data?: { message?: string } } }
      console.error('[VoiceStore] API error joining voice room:', err)

      let errorMessage: string
      const status = err.response?.status
      const serverMessage = err.response?.data?.message

      if (status === 401) {
        errorMessage = '认证已过期，请重新登录'
      } else if (status === 403) {
        errorMessage = '没有权限加入此语音频道'
      } else if (status === 404) {
        errorMessage = '语音频道不存在'
      } else if (status === 0 || err.message?.includes('Network Error')) {
        errorMessage = '网络连接失败，请检查网络或后端服务是否运行'
      } else if (serverMessage) {
        errorMessage = serverMessage
      } else {
        errorMessage = `加入语音失败: ${err.message || '未知错误'}`
      }

      set({ isLoading: false, error: errorMessage })
      const error = new Error(errorMessage)
      error.cause = apiError
      throw error
    }

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
      isInVoice: true,
      isLoading: false,
    })

    // Fetch participants after joining
    get().fetchParticipants(roomId)
  },

  leaveVoice: async (roomId) => {
    const { stream } = get()

    set({ isLoading: true, error: null })

    // Stop audio analysis
    stopAudioAnalysis()

    // Stop local stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }

    // Leave voice room on backend
    try {
      await voiceService.leaveVoice(roomId)
      set({
        isCapturing: false,
        stream: null,
        inputDeviceId: '',
        currentRoomId: null,
        audioLevel: 0,
        isSpeaking: false,
        participants: [],
        isInVoice: false,
        isMuted: false,
        isLoading: false,
      })
    } catch (err) {
      const error = err as Error & { response?: { status?: number; data?: { message?: string } } }
      console.error('[VoiceStore] Failed to leave voice:', error)

      // Still reset local state even if API fails
      set({
        isCapturing: false,
        stream: null,
        inputDeviceId: '',
        currentRoomId: null,
        audioLevel: 0,
        isSpeaking: false,
        participants: [],
        isInVoice: false,
        isMuted: false,
        isLoading: false,
      })

      // Only throw if it's a network error (backend might be down)
      if (error.response?.status === 0 || error.message?.includes('Network Error')) {
        set({ error: '网络连接失败，但已断开本地连接' })
      }
    }
  },

  fetchParticipants: async (roomId) => {
    try {
      const participants = await voiceService.getVoiceParticipants(roomId)
      set({ participants: participants.map(p => ({
        ...p,
        isMuted: false,
        isSpeaking: false,
      })) })
    } catch (err) {
      console.error('Failed to fetch voice participants:', err)
    }
  },

  addParticipant: (participant) => set((state) => ({
    participants: [...state.participants, participant],
  })),

  removeParticipant: (participant) => set((state) => ({
    participants: state.participants.filter(p => p.userId !== participant.userId),
  })),

  updateVoiceParticipant: (userId, updates) => set((state) => ({
    participants: state.participants.map(p =>
      p.userId === userId ? { ...p, ...updates } : p
    ),
  })),

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))

// Legacy alias for backward compatibility
export const useAudioStore = useVoiceStore

export default useVoiceStore
