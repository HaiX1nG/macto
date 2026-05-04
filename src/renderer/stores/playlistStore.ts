import { create } from 'zustand'
import { playlistService } from '../services'
import type {
  PlaylistItemResponse,
  AddPlaylistItemRequest,
} from '@shared/types/api'

interface PlaylistState {
  playlist: PlaylistItemResponse[]
  currentItemId: number | null
  isPlaying: boolean
  isLoading: boolean
  error: string | null

  // Actions
  fetchPlaylist: (roomId: number) => Promise<void>
  addItem: (roomId: number, data: AddPlaylistItemRequest) => Promise<void>
  removeItem: (roomId: number, itemId: number) => Promise<void>
  play: (roomId: number) => Promise<void>
  pause: (roomId: number) => Promise<void>
  skip: (roomId: number) => Promise<void>
  setCurrentItem: (itemId: number | null) => void
  setIsPlaying: (isPlaying: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  playlist: [],
  currentItemId: null,
  isPlaying: false,
  isLoading: false,
  error: null,

  fetchPlaylist: async (roomId) => {
    set({ isLoading: true, error: null })
    try {
      const playlist = await playlistService.getPlaylist(roomId)
      const currentItem = playlist.find((item) => item.status === 2) // status 2 = playing
      set({
        playlist,
        currentItemId: currentItem?.id ?? null,
        isPlaying: !!currentItem,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch playlist'
      set({ isLoading: false, error: message })
    }
  },

  addItem: async (roomId, data) => {
    set({ isLoading: true, error: null })
    try {
      const item = await playlistService.addItem(roomId, data)
      set((state) => ({
        playlist: [...state.playlist, item],
        isLoading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  removeItem: async (roomId, itemId) => {
    set({ isLoading: true, error: null })
    try {
      await playlistService.removeItem(roomId, itemId)
      set((state) => ({
        playlist: state.playlist.filter((item) => item.id !== itemId),
        currentItemId: state.currentItemId === itemId ? null : state.currentItemId,
        isLoading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove item'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  play: async (roomId) => {
    set({ isLoading: true, error: null })
    try {
      await playlistService.play(roomId)
      set({ isPlaying: true, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to play'
      set({ isLoading: false, error: message })
    }
  },

  pause: async (roomId) => {
    set({ isLoading: true, error: null })
    try {
      await playlistService.pause(roomId)
      set({ isPlaying: false, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause'
      set({ isLoading: false, error: message })
    }
  },

  skip: async (roomId) => {
    set({ isLoading: true, error: null })
    try {
      await playlistService.skip(roomId)
      // After skip, refresh playlist to get new current item
      const playlist = await playlistService.getPlaylist(roomId)
      const currentItem = playlist.find((item) => item.status === 2)
      set({
        playlist,
        currentItemId: currentItem?.id ?? null,
        isPlaying: !!currentItem,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to skip'
      set({ isLoading: false, error: message })
    }
  },

  setCurrentItem: (itemId) => set({ currentItemId: itemId }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))

export default usePlaylistStore