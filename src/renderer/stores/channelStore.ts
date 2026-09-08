import { create } from 'zustand'
import type {
  Channel,
  ChannelTreeNode,
  CreateChannelRequest,
  UpdateChannelRequest,
  ReorderChannelsRequest,
} from '@shared/types/channel'
import type {
  PlaylistItem,
  AddPlaylistItemRequest,
  ReorderPlaylistRequest,
} from '@shared/types/playlist'
import { channelService } from '../services/channelService'
import { playlistService } from '../services/playlistService'

export interface ChannelState {
  // Channel state
  channels: ChannelTreeNode[]
  currentChannel: Channel | null
  currentChannelId: number | null
  isLoading: boolean
  error: string | null

  // Playlist state (merged from playlistStore)
  playlist: PlaylistItem[]
  playlistLoading: boolean

  // Channel actions
  fetchChannels: (serverId: number) => Promise<void>
  createChannel: (serverId: number, data: CreateChannelRequest) => Promise<void>
  updateChannel: (serverId: number, channelId: number, data: UpdateChannelRequest) => Promise<void>
  deleteChannel: (serverId: number, channelId: number) => Promise<void>
  reorderChannels: (serverId: number, data: ReorderChannelsRequest) => Promise<void>
  setCurrentChannel: (channel: Channel | null) => void

  // Playlist actions (merged from playlistStore)
  fetchPlaylist: (channelId: number) => Promise<void>
  addPlaylistItem: (channelId: number, data: AddPlaylistItemRequest) => Promise<void>
  removePlaylistItem: (channelId: number, itemId: number) => Promise<void>
  playPlaylist: (channelId: number) => Promise<void>
  pausePlaylist: (channelId: number) => Promise<void>
  skipPlaylist: (channelId: number) => Promise<void>
  reorderPlaylist: (channelId: number, data: ReorderPlaylistRequest) => Promise<void>

  clearError: () => void
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  // Initial state
  channels: [],
  currentChannel: null,
  currentChannelId: null,
  isLoading: false,
  error: null,
  playlist: [],
  playlistLoading: false,

  // Fetch channel tree
  fetchChannels: async (serverId: number) => {
    set({ isLoading: true, error: null })
    try {
      const channels = await channelService.getChannelTree(serverId)
      set({ channels, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取频道列表失败',
      })
      throw err
    }
  },

  // Create channel
  createChannel: async (serverId: number, data: CreateChannelRequest) => {
    set({ isLoading: true, error: null })
    try {
      await channelService.createChannel(serverId, data)
      // Refresh channel tree
      await get().fetchChannels(serverId)
      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '创建频道失败',
      })
      throw err
    }
  },

  // Update channel
  updateChannel: async (serverId: number, channelId: number, data: UpdateChannelRequest) => {
    set({ isLoading: true, error: null })
    try {
      await channelService.updateChannel(serverId, channelId, data)
      // Refresh channel tree
      await get().fetchChannels(serverId)
      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '更新频道失败',
      })
      throw err
    }
  },

  // Delete channel
  deleteChannel: async (serverId: number, channelId: number) => {
    set({ isLoading: true, error: null })
    try {
      await channelService.deleteChannel(serverId, channelId)
      set((state) => ({
        channels: state.channels.filter((c) => c.id !== channelId),
        currentChannel: state.currentChannelId === channelId ? null : state.currentChannel,
        currentChannelId: state.currentChannelId === channelId ? null : state.currentChannelId,
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '删除频道失败',
      })
      throw err
    }
  },

  // Reorder channels
  reorderChannels: async (serverId: number, data: ReorderChannelsRequest) => {
    set({ isLoading: true, error: null })
    try {
      await channelService.reorderChannels(serverId, data)
      // Refresh channel tree
      await get().fetchChannels(serverId)
      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '排序频道失败',
      })
      throw err
    }
  },

  // Set current channel
  setCurrentChannel: (channel: Channel | null) => {
    set({
      currentChannel: channel,
      currentChannelId: channel?.id ?? null,
    })
  },

  // ==================== Playlist Actions ====================

  // Fetch playlist
  fetchPlaylist: async (channelId: number) => {
    set({ playlistLoading: true, error: null })
    try {
      const playlist = await playlistService.getPlaylist(channelId)
      set({ playlist, playlistLoading: false })
    } catch (err) {
      set({
        playlistLoading: false,
        error: err instanceof Error ? err.message : '获取播放列表失败',
      })
    }
  },

  // Add playlist item
  addPlaylistItem: async (channelId: number, data: AddPlaylistItemRequest) => {
    set({ playlistLoading: true, error: null })
    try {
      const item = await playlistService.addItem(channelId, data)
      set((state) => ({
        playlist: [...state.playlist, item],
        playlistLoading: false,
      }))
    } catch (err) {
      set({
        playlistLoading: false,
        error: err instanceof Error ? err.message : '添加播放项失败',
      })
      throw err
    }
  },

  // Remove playlist item
  removePlaylistItem: async (channelId: number, itemId: number) => {
    set({ playlistLoading: true, error: null })
    try {
      await playlistService.removeItem(channelId, itemId)
      set((state) => ({
        playlist: state.playlist.filter((item) => item.id !== itemId),
        playlistLoading: false,
      }))
    } catch (err) {
      set({
        playlistLoading: false,
        error: err instanceof Error ? err.message : '移除播放项失败',
      })
      throw err
    }
  },

  // Play playlist
  playPlaylist: async (channelId: number) => {
    set({ error: null })
    try {
      await playlistService.play(channelId)
      // Refresh playlist to get updated status
      await get().fetchPlaylist(channelId)
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '播放失败',
      })
    }
  },

  // Pause playlist
  pausePlaylist: async (channelId: number) => {
    set({ error: null })
    try {
      await playlistService.pause(channelId)
      // Refresh playlist to get updated status
      await get().fetchPlaylist(channelId)
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '暂停失败',
      })
    }
  },

  // Skip playlist
  skipPlaylist: async (channelId: number) => {
    set({ error: null })
    try {
      await playlistService.skip(channelId)
      // Refresh playlist to get new current item
      await get().fetchPlaylist(channelId)
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '跳过失败',
      })
    }
  },

  // Reorder playlist
  reorderPlaylist: async (channelId: number, data: ReorderPlaylistRequest) => {
    set({ playlistLoading: true, error: null })
    try {
      await playlistService.reorder(channelId, data)
      // Refresh playlist to get updated order
      await get().fetchPlaylist(channelId)
      set({ playlistLoading: false })
    } catch (err) {
      set({
        playlistLoading: false,
        error: err instanceof Error ? err.message : '排序失败',
      })
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))

export default useChannelStore
