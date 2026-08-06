import { create } from 'zustand'
import type { ServerMember, Channel } from '@shared/types/kook'
import type { RoomInfoResponse, ParticipantResponse } from '@shared/types/api'
import type { SessionParticipant } from '@shared/types'

// Legacy Session type for backward compatibility
export interface Session {
  id: string
  name: string
  hostId: string
  participants: SessionParticipant[]
  createdAt: number
  isActive: boolean
}

export interface RoomState {
  // State
  rooms: RoomInfoResponse[]
  currentRoom: RoomInfoResponse | null
  currentRoomId: string
  currentChannelId: string | null
  participants: SessionParticipant[]
  apiParticipants: ParticipantResponse[]
  serverMembers: ServerMember[]
  isLoading: boolean
  isCreating: boolean
  error: string | null

  // Actions
  fetchRooms: (params?: unknown) => Promise<void>
  createRoom: (data: unknown) => Promise<RoomInfoResponse>
  deleteRoom: (roomId: string) => Promise<void>
  joinRoom: (roomId: number, data?: unknown) => Promise<void>
  leaveRoom: (roomId: number) => Promise<void>
  setCurrentRoom: (room: RoomInfoResponse | null) => void
  setCurrentRoomId: (roomId: string) => void
  setCurrentChannel: (channelId: string | null) => void
  addParticipant: (participant: SessionParticipant) => void
  removeParticipant: (participantId: string) => void
  updateParticipant: (participantId: string, updates: Partial<SessionParticipant>) => void
  getServerMembers: (serverId: string) => ServerMember[]
  setServerMembers: (members: ServerMember[]) => void
  removeServerMember: (userId: string) => void
  fetchParticipants: (roomId: number) => Promise<void>
  setError: (error: string | null) => void
  clearError: () => void
}

export const useRoomStore = create<RoomState>((set, get) => ({
  // Initial state
  rooms: [],
  currentRoom: null,
  currentRoomId: '',
  currentChannelId: null,
  participants: [],
  apiParticipants: [],
  serverMembers: [],
  isLoading: false,
  isCreating: false,
  error: null,

  // Fetch rooms
  fetchRooms: async (_params?: unknown) => {
    set({ isLoading: true, error: null })
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取房间列表失败',
      })
    }
  },

  // Create room
  createRoom: async (_data: unknown) => {
    set({ isCreating: true, error: null })
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      const newRoom: RoomInfoResponse = {
        id: Date.now(),
        roomName: 'New Room',
        roomType: 2,
        hostUserId: 1,
        isPrivate: false,
        maxParticipants: 10,
        participantCount: 0,
        createdAt: new Date().toISOString(),
      }
      set((state) => ({
        rooms: [...state.rooms, newRoom],
        isCreating: false,
      }))
      return newRoom
    } catch (err) {
      set({
        isCreating: false,
        error: err instanceof Error ? err.message : '创建房间失败',
      })
      throw err
    }
  },

  // Delete room
  deleteRoom: async (roomId: string) => {
    set({ isLoading: true, error: null })
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      set((state) => ({
        rooms: state.rooms.filter(r => String(r.id) !== roomId),
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '删除房间失败',
      })
      throw err
    }
  },

  // Join room
  joinRoom: async (_roomId: number, _data?: unknown) => {
    set({ isLoading: true, error: null })
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加入房间失败',
      })
      throw err
    }
  },

  // Leave room
  leaveRoom: async (_roomId: number) => {
    set({ isLoading: true, error: null })
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '离开房间失败',
      })
      throw err
    }
  },

  // Set current room
  setCurrentRoom: (room: RoomInfoResponse | null) => {
    set({
      currentRoom: room,
      currentRoomId: room ? String(room.id) : '',
      participants: [],
    })
  },

  // Set current room ID
  setCurrentRoomId: (roomId: string) => {
    set({ currentRoomId: roomId })
  },

  // Set current channel
  setCurrentChannel: (channelId: string | null) => {
    set({ currentChannelId: channelId })
  },

  // Add participant
  addParticipant: (participant: SessionParticipant) => {
    set((state) => ({
      participants: [...state.participants, participant],
    }))
  },

  // Remove participant
  removeParticipant: (participantId: string) => {
    set((state) => ({
      participants: state.participants.filter(p => p.id !== participantId),
    }))
  },

  // Update participant
  updateParticipant: (participantId: string, updates: Partial<SessionParticipant>) => {
    set((state) => ({
      participants: state.participants.map(p =>
        p.id === participantId ? { ...p, ...updates } : p
      ),
    }))
  },

  // Get server members
  getServerMembers: (_serverId: string) => {
    return get().serverMembers
  },

  // Set server members
  setServerMembers: (members: ServerMember[]) => {
    set({ serverMembers: members })
  },

  // Remove server member
  removeServerMember: (userId: string) => {
    set((state) => ({
      serverMembers: state.serverMembers.filter(m => m.userId !== userId),
    }))
  },

  // Fetch participants
  fetchParticipants: async (_roomId: number) => {
    set({ isLoading: true, error: null })
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取参与者失败',
      })
    }
  },

  // Set error
  setError: (error: string | null) => {
    set({ error })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },
}))

// Re-export for backward compatibility
export { useRoomStore as useServerStore }
export type { RoomState as ServerState }

// Helper functions
export function getServerFromRoom(_roomId: string) {
  return null
}

export function getServersFromRooms(rooms: RoomInfoResponse[]) {
  return rooms.map(room => ({
    id: String(room.id),
    name: room.roomName,
    icon: '',
  }))
}

export function getChannelFromRoom(_roomId: string): Channel[] {
  return []
}
