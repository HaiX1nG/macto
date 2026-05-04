import { create } from 'zustand'
import { roomService } from '../services'
import type {
  RoomInfoResponse,
  ParticipantResponse,
  CreateRoomRequest,
  JoinRoomRequest,
  RoomListRequest,
} from '@shared/types/api'

interface RoomState {
  rooms: RoomInfoResponse[]
  currentRoom: RoomInfoResponse | null
  participants: ParticipantResponse[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchRooms: (params?: RoomListRequest) => Promise<void>
  fetchRoomInfo: (roomId: number) => Promise<void>
  createRoom: (data: CreateRoomRequest) => Promise<RoomInfoResponse>
  joinRoom: (roomId: number, data?: JoinRoomRequest) => Promise<void>
  leaveRoom: (roomId: number) => Promise<void>
  fetchParticipants: (roomId: number) => Promise<void>
  setCurrentRoom: (room: RoomInfoResponse | null) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  participants: [],
  isLoading: false,
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
      set({ currentRoom: room, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch room info'
      set({ isLoading: false, error: message })
    }
  },

  createRoom: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const room = await roomService.createRoom(data)
      set((state) => ({
        rooms: [...state.rooms, room],
        currentRoom: room,
        isLoading: false,
      }))
      return room
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  joinRoom: async (roomId, data) => {
    set({ isLoading: true, error: null })
    try {
      const room = await roomService.joinRoom(roomId, data)
      set({ currentRoom: room, isLoading: false })
      // Fetch participants after joining
      get().fetchParticipants(roomId)
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
        currentRoom: null,
        participants: [],
        rooms: state.rooms.filter((r) => r.id !== roomId),
        isLoading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave room'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  fetchParticipants: async (roomId) => {
    try {
      const participants = await roomService.getRoomParticipants(roomId)
      set({ participants })
    } catch (err) {
      console.error('Failed to fetch participants:', err)
    }
  },

  setCurrentRoom: (room) => set({ currentRoom: room, participants: [] }),

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))

export default useRoomStore