import apiClient from './apiClient'
import type {
  PlaylistItem,
  AddPlaylistItemRequest,
  ReorderPlaylistRequest,
} from '@shared/types/playlist'

export const playlistService = {
  async getPlaylist(channelId: number): Promise<PlaylistItem[]> {
    return apiClient.get<PlaylistItem[]>(`/channels/${channelId}/playlist`)
  },

  async addItem(
    channelId: number,
    data: AddPlaylistItemRequest
  ): Promise<PlaylistItem> {
    return apiClient.post<PlaylistItem>(`/channels/${channelId}/playlist`, data)
  },

  async removeItem(channelId: number, itemId: number): Promise<void> {
    return apiClient.delete<void>(`/channels/${channelId}/playlist/${itemId}`)
  },

  async play(channelId: number): Promise<void> {
    return apiClient.post<void>(`/channels/${channelId}/playlist/play`)
  },

  async pause(channelId: number): Promise<void> {
    return apiClient.post<void>(`/channels/${channelId}/playlist/pause`)
  },

  async skip(channelId: number): Promise<void> {
    return apiClient.post<void>(`/channels/${channelId}/playlist/skip`)
  },

  async reorder(channelId: number, data: ReorderPlaylistRequest): Promise<void> {
    return apiClient.post<void>(`/channels/${channelId}/playlist/reorder`, data)
  },
}

export default playlistService
