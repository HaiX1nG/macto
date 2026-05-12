import apiClient from './apiClient'
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  RoomInfoResponse,
  ParticipantResponse,
  RoomListRequest,
  PaginatedData,
} from '@shared/types/api'

export const roomService = {
  async getRoomList(params?: RoomListRequest): Promise<RoomInfoResponse[]> {
    try {
      const result = await apiClient.get<PaginatedData<RoomInfoResponse> | RoomInfoResponse[]>('/rooms', params as unknown as Record<string, unknown> | undefined)
      // Handle both paginated and direct array responses
      if (Array.isArray(result)) {
        return result
      }
      if (result && 'list' in result) {
        return result.list || []
      }
      return []
    } catch (err) {
      console.error('Failed to fetch room list:', err)
      return []
    }
  },

  async getRoomInfo(roomId: number): Promise<RoomInfoResponse> {
    return apiClient.get<RoomInfoResponse>(`/rooms/${roomId}`)
  },

  async createRoom(data: CreateRoomRequest): Promise<RoomInfoResponse> {
    return apiClient.post<RoomInfoResponse>('/rooms', data)
  },

  async joinRoom(roomId: number, data?: JoinRoomRequest): Promise<RoomInfoResponse> {
    return apiClient.post<RoomInfoResponse>(`/rooms/join/${roomId}`, data)
  },

  async leaveRoom(roomId: number): Promise<void> {
    return apiClient.post<void>(`/rooms/leave/${roomId}`)
  },

  async getRoomParticipants(roomId: number): Promise<ParticipantResponse[]> {
    try {
      const result = await apiClient.get<ParticipantResponse[] | PaginatedData<ParticipantResponse>>(`/rooms/${roomId}/participants`)
      // Handle both array and paginated responses
      if (Array.isArray(result)) {
        return result
      }
      if (result && 'list' in result) {
        return result.list || []
      }
      return []
    } catch (err) {
      console.error('Failed to fetch participants:', err)
      return []
    }
  },

  async deleteRoom(roomId: number): Promise<void> {
    return apiClient.delete<void>(`/rooms/${roomId}`)
  },

  async getPublicRooms(params?: RoomListRequest): Promise<RoomInfoResponse[]> {
    try {
      const result = await apiClient.get<PaginatedData<RoomInfoResponse> | RoomInfoResponse[]>('/rooms/public', params as Record<string, unknown> | undefined)
      if (Array.isArray(result)) {
        return result
      }
      if (result && 'list' in result) {
        return result.list || []
      }
      return []
    } catch (err) {
      console.error('Failed to fetch public rooms:', err)
      return []
    }
  },
}

export default roomService