import { create } from 'zustand'
import { roomService } from '../services'
import type { RoomInfoResponse } from '@shared/types/api'

export interface Session {
  id: string
  name: string
  hostId: string
  participants: Participant[]
  createdAt: number
  isActive: boolean
}

export interface Participant {
  id: string
  name: string
  avatar?: string
  isMuted: boolean
  isSpeaking: boolean
  volume: number
  joinedAt: number
}

interface SessionState {
  sessions: Session[]
  currentSessionId: string
  participants: Participant[]
  isCreating: boolean
  error: string | null

  // Actions
  fetchSessions: () => Promise<void>
  createSession: (name: string, roomType?: number, isPrivate?: boolean, maxParticipants?: number) => Promise<string>
  joinSession: (sessionId: string, inviteCode?: string) => Promise<void>
  leaveSession: (sessionId: string) => Promise<void>
  setSessions: (sessions: Session[]) => void
  setCurrentSessionId: (sessionId: string) => void
  addParticipant: (participant: Participant) => void
  removeParticipant: (participantId: string) => void
  updateParticipant: (participantId: string, updates: Partial<Participant>) => void
  setError: (error: string | null) => void
  clearError: () => void
}

// Convert API room to local session format
function roomToSession(room: RoomInfoResponse): Session {
  return {
    id: String(room.id),
    name: room.roomName,
    hostId: String(room.hostUserId),
    participants: [],
    createdAt: new Date(room.createdAt).getTime(),
    isActive: true,
  }
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  currentSessionId: '',
  participants: [],
  isCreating: false,
  error: null,

  fetchSessions: async () => {
    set({ isCreating: true, error: null })
    try {
      const rooms = await roomService.getRoomList()
      const sessions = rooms.map(roomToSession)
      set({ sessions, isCreating: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sessions'
      set({ isCreating: false, error: message })
    }
  },

  createSession: async (name, roomType = 2, isPrivate = false, maxParticipants = 10) => {
    set({ isCreating: true, error: null })
    try {
      const room = await roomService.createRoom({
        roomName: name,
        roomType: roomType as 1 | 2,
        isPrivate,
        maxParticipants,
      })
      const session = roomToSession(room)
      set((state) => ({
        sessions: [...state.sessions, session],
        currentSessionId: session.id,
        isCreating: false,
      }))
      return session.id
    } catch (err) {
      set({ isCreating: false, error: 'Failed to create session' })
      throw err
    }
  },

  joinSession: async (sessionId, inviteCode) => {
    try {
      set({ currentSessionId: sessionId, error: null })
      await roomService.joinRoom(Number(sessionId), inviteCode ? { inviteCode } : undefined)

      // Fetch participants after joining
      const participants = await roomService.getRoomParticipants(Number(sessionId))
      const convertedParticipants: Participant[] = participants.map(p => ({
        id: String(p.userId),
        name: p.username,
        avatar: p.avatarUrl,
        isMuted: p.isMuted,
        isSpeaking: false,
        volume: 100,
        joinedAt: new Date(p.joinedAt).getTime(),
      }))
      set({ participants: convertedParticipants })
    } catch (err) {
      set({ error: 'Failed to join session' })
      throw err
    }
  },

  leaveSession: async (sessionId) => {
    try {
      await roomService.leaveRoom(Number(sessionId))
      set((state) => ({
        currentSessionId: state.currentSessionId === sessionId ? '' : state.currentSessionId,
        sessions: state.sessions.filter((s) => s.id !== sessionId),
        participants: state.currentSessionId === sessionId ? [] : state.participants,
      }))
    } catch (err) {
      set({ error: 'Failed to leave session' })
      throw err
    }
  },

  setSessions: (sessions) => set({ sessions }),
  setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),
  addParticipant: (participant) => set((state) => ({
    participants: [...state.participants, participant],
  })),
  removeParticipant: (participantId) => set((state) => ({
    participants: state.participants.filter((p) => p.id !== participantId),
  })),
  updateParticipant: (participantId, updates) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === participantId ? { ...p, ...updates } : p
    ),
  })),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
