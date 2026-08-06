import { create } from 'zustand'

export interface VoiceParticipant {
  id: number
  roomId: number
  userId: string
  username: string
  isMuted?: boolean
  isSpeaking?: boolean
  volume?: number
  joinedAt: string
}

export interface VoiceState {
  // Audio devices
  devices: MediaDeviceInfo[]
  inputDeviceId: string | null
  outputDeviceId: string | null
  volume: number
  isMuted: boolean
  isDeafened: boolean
  isSpeaking: boolean

  // Voice participants
  participants: VoiceParticipant[]

  // Actions
  setDevices: (devices: MediaDeviceInfo[]) => void
  setInputDevice: (deviceId: string) => void
  setOutputDevice: (deviceId: string) => void
  setVolume: (volume: number) => void
  setMute: (muted: boolean) => void
  setDeafen: (deafened: boolean) => void
  setSpeaking: (speaking: boolean) => void
  addParticipant: (participant: VoiceParticipant) => void
  removeParticipant: (participant: VoiceParticipant) => void
  updateVoiceParticipant: (userId: string, updates: Partial<VoiceParticipant>) => void

  // Audio capture
  isCapturing: boolean
  stream: MediaStream | null
  currentRoomId: number | null
  isInVoice: boolean
  isLoading: boolean
  error: string | null
  startCapture: () => Promise<void>
  stopCapture: () => Promise<void>
  setStream: (stream: MediaStream | null) => void
  clearError: () => void
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  // Initial state
  devices: [],
  inputDeviceId: null,
  outputDeviceId: null,
  volume: 100,
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,
  participants: [],
  isCapturing: false,
  stream: null,
  currentRoomId: null,
  isInVoice: false,
  isLoading: false,
  error: null,

  // Actions
  setDevices: (devices: MediaDeviceInfo[]) => {
    set({ devices })
  },

  setInputDevice: (deviceId: string) => {
    set({ inputDeviceId: deviceId })
  },

  setOutputDevice: (deviceId: string) => {
    set({ outputDeviceId: deviceId })
  },

  setVolume: (volume: number) => {
    set({ volume })
  },

  setMute: (muted: boolean) => {
    set({ isMuted: muted })
  },

  setDeafen: (deafened: boolean) => {
    set({ isDeafened: deafened })
  },

  setSpeaking: (speaking: boolean) => {
    set({ isSpeaking: speaking })
  },

  addParticipant: (participant: VoiceParticipant) => {
    set((state) => ({
      participants: [...state.participants, participant],
    }))
  },

  removeParticipant: (participant: VoiceParticipant) => {
    set((state) => ({
      participants: state.participants.filter(p => p.id !== participant.id),
    }))
  },

  updateVoiceParticipant: (userId: string, updates: Partial<VoiceParticipant>) => {
    set((state) => ({
      participants: state.participants.map(p =>
        p.userId === userId ? { ...p, ...updates } : p
      ),
    }))
  },

  startCapture: async () => {
    set({ isLoading: true, error: null })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      set({
        isCapturing: true,
        stream,
        devices,
        isLoading: false,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '启动音频捕获失败',
      })
      throw err
    }
  },

  stopCapture: async () => {
    const { stream } = get()
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    set({
      isCapturing: false,
      stream: null,
    })
  },

  setStream: (stream: MediaStream | null) => {
    set({ stream })
  },

  clearError: () => {
    set({ error: null })
  },
}))

// Re-export for backward compatibility
export const useAudioStore = useVoiceStore
