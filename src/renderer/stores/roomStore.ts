import { create } from 'zustand'
import { roomService } from '../services'
import type {
  RoomInfoResponse,
  ParticipantResponse,
  CreateRoomRequest,
  JoinRoomRequest,
  RoomListRequest,
} from '@shared/types/api'
import type { SessionParticipant } from '@shared/types/participant'
import type { Channel, ServerMember } from '@shared/types/kook'

function participantToSessionParticipant(p: ParticipantResponse): SessionParticipant {
  return {
    id: String(p.userId),
    name: p.username,
    avatar: p.avatarUrl,
    isMuted: p.isMuted,
    isSpeaking: false,
    volume: 100,
    joinedAt: new Date(p.joinedAt).getTime(),
  }
}

function createDefaultChannels(roomId: number): Channel[] {
  return [
    { id: String(roomId), serverId: String(roomId), name: '聊天室', type: 'text' as const, position: 0, topic: '' },
    { id: `${roomId}-voice`, serverId: String(roomId), name: '语音室', type: 'voice' as const, position: 1 },
  ]
}

export interface RoomState {
  rooms: RoomInfoResponse[]
  currentRoom: RoomInfoResponse | null
  currentRoomId: string
  currentChannelId: string | null
  participants: SessionParticipant[]
  apiParticipants: ParticipantResponse[]
  serverMembers: Map<string, ServerMember[]>
  isLoading: boolean
  isCreating: boolean
  error: string | null

  fetchRooms: (params?: RoomListRequest) => Promise<void>
  fetchRoomInfo: (roomId: number) => Promise<void>
  createRoom: (data: CreateRoomRequest) => Promise<RoomInfoResponse>
  joinRoom: (roomId: number, data?: JoinRoomRequest) => Promise<void>
  leaveRoom: (roomId: number) => Promise<void>
  deleteRoom: (roomId: number) => Promise<void>
  setCurrentRoom: (room: RoomInfoResponse | null) => void
  setCurrentRoomId: (roomId: string) => void
  setCurrentChannel: (channelId: string | null) => void

  fetchParticipants: (roomId: number) => Promise<void>
  addParticipant: (participant: SessionParticipant) => void
  removeParticipant: (participantId: string) => void
  updateParticipant: (participantId: string, updates: Partial<SessionParticipant>) => void

  getChannels: (roomId: string) => Channel[]
  getServerMembers: (roomId: string) => ServerMember[]
  setServerMembers: (roomId: string, members: ServerMember[]) => void
  removeServerMember: (roomId: string, userId: string) => void

  setError: (error: string | null) => void
  clearError: () => void
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  currentRoomId: '',
  currentChannelId: null,
  participants: [],
  apiParticipants: [],
  serverMembers: new Map(),
  isLoading: false,
  isCreating: false,
  error: null,

  fetchRooms: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const rooms = await roomService.getRoomList(params)
      set({ rooms, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch rooms'
      set({ isLoading: false, error: message })
    }
  },

  fetchRoomInfo: async (roomId) => {
    set({ isLoading: true, error: null })
    try {
      const room = await roomService.getRoomInfo(roomId)
      set({ currentRoom: room, currentRoomId: String(room.id), isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch room info'
      set({ isLoading: false, error: message })
    }
  },

  createRoom: async (data) => {
    set({ isCreating: true, error: null })
    try {
      const room = await roomService.createRoom(data)
      set((state) => ({
        rooms: [...state.rooms, room],
        currentRoom: room,
        currentRoomId: String(room.id),
        currentChannelId: String(room.id),
        isCreating: false,
      }))
      return room
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room'
      set({ isCreating: false, error: message })
      throw err
    }
  },

  joinRoom: async (roomId, data) => {
    set({ isLoading: true, error: null })
    try {
      const room = await roomService.joinRoom(roomId, data)
      set({ currentRoom: room, currentRoomId: String(room.id), isLoading: false })
      await get().fetchParticipants(roomId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  leaveRoom: async (roomId) => {
    set({ isLoading: true, error: null })
    try {
      await roomService.leaveRoom(roomId)
      set((state) => ({
        currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom,
        currentRoomId: state.currentRoom?.id === roomId ? '' : state.currentRoomId,
        currentChannelId: state.currentRoom?.id === roomId ? null : state.currentChannelId,
        participants: state.currentRoom?.id === roomId ? [] : state.participants,
        apiParticipants: state.currentRoom?.id === roomId ? [] : state.apiParticipants,
        rooms: state.rooms.filter((r) => r.id !== roomId),
        isLoading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave room'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  deleteRoom: async (roomId) => {
    try {
      await roomService.deleteRoom(roomId)
      set((state) => ({
        rooms: state.rooms.filter((r) => r.id !== roomId),
        currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom,
        currentRoomId: state.currentRoom?.id === roomId ? '' : state.currentRoomId,
        currentChannelId: state.currentRoom?.id === roomId ? null : state.currentChannelId,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete room'
      set({ error: message })
      throw err
    }
  },

  setCurrentRoom: (room) => set({
    currentRoom: room,
    currentRoomId: room ? String(room.id) : '',
    currentChannelId: room ? String(room.id) : null,
    participants: [],
    apiParticipants: [],
  }),

  setCurrentRoomId: (roomId) => set({ currentRoomId: roomId }),

  setCurrentChannel: (channelId) => set({ currentChannelId: channelId }),

  fetchParticipants: async (roomId) => {
    try {
      const apiParticipants = await roomService.getRoomParticipants(roomId)
      const participants = apiParticipants.map(participantToSessionParticipant)
      set({ participants, apiParticipants })
    } catch (err) {
      console.error('Failed to fetch participants:', err)
    }
  },

  addParticipant: (participant) => set((state) => ({
    participants: [...state.participants, participant],
  })),

  removeParticipant: (participantId) => set((state) => ({
    participants: state.participants.filter((p) => p.id !== participantId),
    apiParticipants: state.apiParticipants.filter((p) => String(p.userId) !== participantId),
  })),

  updateParticipant: (participantId, updates) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === participantId ? { ...p, ...updates } : p
    ),
  })),

  getChannels: (roomId) => {
    const room = get().rooms.find(r => String(r.id) === roomId)
    if (!room) return []
    return createDefaultChannels(room.id)
  },

  getServerMembers: (roomId) => {
    return get().serverMembers.get(roomId) || []
  },

  setServerMembers: (roomId, members) => set((state) => {
    const newMembers = new Map(state.serverMembers)
    newMembers.set(roomId, members)
    return { serverMembers: newMembers }
  }),

  removeServerMember: (roomId, userId) => set((state) => {
    const newMembers = new Map(state.serverMembers)
    const existing = newMembers.get(roomId) || []
    newMembers.set(roomId, existing.filter(m => m.userId !== userId))
    return { serverMembers: newMembers }
  }),

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))

// Backward compatibility aliases
export const useSessionStore = useRoomStore

// Re-export Session type for backward compatibility
export type Session = {
  id: string
  name: string
  hostId: string
  participants: SessionParticipant[]
  createdAt: number
  isActive: boolean
}

export default useRoomStore
