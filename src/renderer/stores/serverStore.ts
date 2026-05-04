import { create } from 'zustand'
import type { Server, Channel, ServerMember } from '@shared/types/kook'

interface ServerState {
  servers: Server[]
  currentServerId: string | null
  currentChannelId: string | null
  members: Map<string, ServerMember[]>

  // Actions
  setServers: (servers: Server[]) => void
  addServer: (server: Server) => void
  removeServer: (serverId: string) => void
  updateServer: (serverId: string, updates: Partial<Server>) => void
  setCurrentServer: (serverId: string | null) => void
  setCurrentChannel: (channelId: string | null) => void

  // Channels
  addChannel: (serverId: string, channel: Channel) => void
  removeChannel: (serverId: string, channelId: string) => void
  updateChannel: (serverId: string, channelId: string, updates: Partial<Channel>) => void

  // Members
  setMembers: (serverId: string, members: ServerMember[]) => void
  addMember: (serverId: string, member: ServerMember) => void
  removeMember: (serverId: string, userId: string) => void

  // Helpers
  getCurrentServer: () => Server | undefined
  getServerChannels: (serverId: string) => Channel[]
  getServerMembers: (serverId: string) => ServerMember[]
}

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  currentServerId: null,
  currentChannelId: null,
  members: new Map(),

  setServers: (servers) => set({ servers }),

  addServer: (server) => set((state) => ({
    servers: [...state.servers, server]
  })),

  removeServer: (serverId) => set((state) => ({
    servers: state.servers.filter(s => s.id !== serverId),
    currentServerId: state.currentServerId === serverId ? null : state.currentServerId
  })),

  updateServer: (serverId, updates) => set((state) => ({
    servers: state.servers.map(s =>
      s.id === serverId ? { ...s, ...updates } : s
    )
  })),

  setCurrentServer: (serverId) => set({ currentServerId: serverId, currentChannelId: null }),

  setCurrentChannel: (channelId) => set({ currentChannelId: channelId }),

  addChannel: (serverId, channel) => set((state) => ({
    servers: state.servers.map(s =>
      s.id === serverId
        ? { ...s, channels: [...s.channels, channel] }
        : s
    )
  })),

  removeChannel: (serverId, channelId) => set((state) => ({
    servers: state.servers.map(s =>
      s.id === serverId
        ? { ...s, channels: s.channels.filter(c => c.id !== channelId) }
        : s
    )
  })),

  updateChannel: (serverId, channelId, updates) => set((state) => ({
    servers: state.servers.map(s =>
      s.id === serverId
        ? {
            ...s,
            channels: s.channels.map(c =>
              c.id === channelId ? { ...c, ...updates } : c
            )
          }
        : s
    )
  })),

  setMembers: (serverId, members) => set((state) => {
    const newMembers = new Map(state.members)
    newMembers.set(serverId, members)
    return { members: newMembers }
  }),

  addMember: (serverId, member) => set((state) => {
    const newMembers = new Map(state.members)
    const existing = newMembers.get(serverId) || []
    newMembers.set(serverId, [...existing, member])
    return { members: newMembers }
  }),

  removeMember: (serverId, userId) => set((state) => {
    const newMembers = new Map(state.members)
    const existing = newMembers.get(serverId) || []
    newMembers.set(serverId, existing.filter(m => m.userId !== userId))
    return { members: newMembers }
  }),

  getCurrentServer: () => {
    const state = get()
    return state.servers.find(s => s.id === state.currentServerId)
  },

  getServerChannels: (serverId) => {
    const state = get()
    const server = state.servers.find(s => s.id === serverId)
    return server?.channels || []
  },

  getServerMembers: (serverId) => {
    const state = get()
    return state.members.get(serverId) || []
  }
}))