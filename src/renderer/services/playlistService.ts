import apiClient from './apiClient'
import type {
  AddPlaylistItemRequest,
  PlaylistItemResponse,
  ReorderPlaylistRequest,
} from '@shared/types/api'

export const playlistService = {
  async getPlaylist(roomId: number): Promise<PlaylistItemResponse[]> {
    return apiClient.get<PlaylistItemResponse[]>(`/rooms/${roomId}/playlist`)
  },

  async addItem(roomId: number, data: AddPlaylistItemRequest): Promise<PlaylistItemResponse> {
    return apiClient.post<PlaylistItemResponse>(`/rooms/${roomId}/playlist`, data)
  },

  async removeItem(roomId: number, itemId: number): Promise<void> {
    return apiClient.delete<void>(`/rooms/${roomId}/playlist/${itemId}`)
  },

  async play(roomId: number): Promise<void> {
    return apiClient.post<void>(`/rooms/${roomId}/playlist/play`)
  },

  async pause(roomId: number): Promise<void> {
    return apiClient.post<void>(`/rooms/${roomId}/playlist/pause`)
  },

  async skip(roomId: number): Promise<void> {
    return apiClient.post<void>(`/rooms/${roomId}/playlist/skip`)
  },

  async reorder(roomId: number, data: ReorderPlaylistRequest): Promise<void> {
    return apiClient.post<void>(`/rooms/${roomId}/playlist/reorder`, data)
  },
}

export default playlistService