/**
 * Playlist Domain Types
 *
 * Mirrors backend playlist_dto.go and model/playlist_item.go.
 */

export const PlaylistItemStatus = {
  Waiting: 1,
  Playing: 2,
  Played: 3,
} as const
export type PlaylistItemStatus = (typeof PlaylistItemStatus)[keyof typeof PlaylistItemStatus]

export interface PlaylistItem {
  id: number
  channelId: number
  addedBy: number
  title: string
  artist: string
  musicUrl: string
  duration: number
  playOrder: number
  status: PlaylistItemStatus
  createdAt: string
}

// ==================== Request / Response DTOs ====================

export interface AddPlaylistItemRequest {
  title: string
  artist?: string
  musicUrl: string
  duration?: number
}

export interface ReorderPlaylistRequest {
  itemIds: number[]
}
