import { create } from 'zustand'
import type { ServerMember, Channel, Server } from '@shared/types/kook'
import type { RoomInfoResponse, ParticipantResponse, CreateRoomRequest, RoomListRequest, JoinRoomRequest } from '@shared/types/api'
import type { SessionParticipant } from '@shared/types'
import { roomService } from '../services/roomService'

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
  joinRoom: (roomId: number, data?: JoinRoomRequest) => Promise<void>
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
  fetchRooms: async (params?: unknown) => {
    set({ isLoading: true, error: null })
    try {
      const rooms = await roomService.getRoomList(params as RoomListRequest | undefined)
      set({ rooms, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取房间列表失败',
      })
      throw err
    }
  },

  // Create room
  createRoom: async (data: unknown) => {
    set({ isCreating: true, error: null })
    try {
      const newRoom = await roomService.createRoom(data as CreateRoomRequest)
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
      await roomService.deleteRoom(Number(roomId))
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
  joinRoom: async (roomId: number, data?: JoinRoomRequest) => {
    set({ isLoading: true, error: null })
    try {
      await roomService.joinRoom(roomId, data)
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
  leaveRoom: async (roomId: number) => {
    set({ isLoading: true, error: null })
    try {
      await roomService.leaveRoom(roomId)
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
  fetchParticipants: async (roomId: number) => {
    set({ isLoading: true, error: null })
    try {
      const participants = await roomService.getRoomParticipants(roomId)
      set({ apiParticipants: participants, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取参与者失败',
      })
      throw err
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

export function getServersFromRooms(rooms: RoomInfoResponse[]): Server[] {
  return rooms.map(room => ({
    id: String(room.id),
    name: room.roomName,
    icon: '',
    ownerId: '',
    channels: [],
    roles: [],
    memberCount: 0,
    createdAt: 0,
  }))
}

export function getChannelFromRoom(_roomId: string): Channel[] {
  return []
}
