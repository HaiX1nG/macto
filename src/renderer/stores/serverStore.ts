import { create } from 'zustand'
import type {
  Server,
  ServerDetail,
  ServerMember,
  Role,
  CreateServerRequest,
  UpdateServerRequest,
  JoinServerRequest,
  UpdateServerMemberRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
} from '@shared/types/server'
import type { Permission as PermissionType } from '@shared/types/permission'
import {
  hasPermission,
  mergePermissions,
  parsePermissions,
} from '@shared/types/permission'
import { serverService } from '../services/serverService'
import { useAuthStore } from './authStore'

export interface ServerState {
  // State
  servers: Server[]
  currentServer: ServerDetail | null
  currentServerId: number | null
  members: ServerMember[]
  roles: Role[]
  isLoading: boolean
  error: string | null

  // Server actions
  fetchServers: () => Promise<void>
  fetchServerDetail: (id: number) => Promise<void>
  createServer: (data: CreateServerRequest) => Promise<ServerDetail>
  updateServer: (id: number, data: UpdateServerRequest) => Promise<void>
  deleteServer: (id: number) => Promise<void>
  joinServer: (id: number, data: JoinServerRequest) => Promise<void>
  leaveServer: (id: number) => Promise<void>
  setCurrentServer: (id: number) => void

  // Member actions
  fetchMembers: (serverId: number) => Promise<void>
  updateMember: (serverId: number, userId: number, data: UpdateServerMemberRequest) => Promise<void>
  kickMember: (serverId: number, userId: number) => Promise<void>

  // Role actions
  fetchRoles: (serverId: number) => Promise<void>
  createRole: (serverId: number, data: CreateRoleRequest) => Promise<void>
  updateRole: (serverId: number, roleId: number, data: UpdateRoleRequest) => Promise<void>
  deleteRole: (serverId: number, roleId: number) => Promise<void>

  // Permission
  hasPermission: (perm: bigint) => boolean

  clearError: () => void
}

export const useServerStore = create<ServerState>((set, get) => ({
  // Initial state
  servers: [],
  currentServer: null,
  currentServerId: null,
  members: [],
  roles: [],
  isLoading: false,
  error: null,

  // Fetch server list
  fetchServers: async () => {
    set({ isLoading: true, error: null })
    try {
      const servers = await serverService.getServerList()
      set({ servers, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取服务器列表失败',
      })
      throw err
    }
  },

  // Fetch server detail (with channels)
  fetchServerDetail: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const detail = await serverService.getServerDetail(id)
      set({
        currentServer: detail,
        currentServerId: id,
        isLoading: false,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取服务器详情失败',
      })
      throw err
    }
  },

  // Create server
  createServer: async (data: CreateServerRequest) => {
    set({ isLoading: true, error: null })
    try {
      const newServer = await serverService.createServer(data)
      set((state) => ({
        servers: [...state.servers, newServer],
        isLoading: false,
      }))
      return newServer
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '创建服务器失败',
      })
      throw err
    }
  },

  // Update server
  updateServer: async (id: number, data: UpdateServerRequest) => {
    set({ isLoading: true, error: null })
    try {
      await serverService.updateServer(id, data)
      // Refresh server detail if it's the current server
      if (get().currentServerId === id) {
        await get().fetchServerDetail(id)
      }
      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '更新服务器失败',
      })
      throw err
    }
  },

  // Delete server
  deleteServer: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await serverService.deleteServer(id)
      set((state) => ({
        servers: state.servers.filter((s) => s.id !== id),
        currentServer: state.currentServerId === id ? null : state.currentServer,
        currentServerId: state.currentServerId === id ? null : state.currentServerId,
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '删除服务器失败',
      })
      throw err
    }
  },

  // Join server
  joinServer: async (id: number, data: JoinServerRequest) => {
    set({ isLoading: true, error: null })
    try {
      await serverService.joinServer(id, data)
      // Refresh server list after joining
      await get().fetchServers()
      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加入服务器失败',
      })
      throw err
    }
  },

  // Leave server
  leaveServer: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await serverService.leaveServer(id)
      set((state) => ({
        servers: state.servers.filter((s) => s.id !== id),
        currentServer: state.currentServerId === id ? null : state.currentServer,
        currentServerId: state.currentServerId === id ? null : state.currentServerId,
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '离开服务器失败',
      })
      throw err
    }
  },

  // Set current server
  setCurrentServer: (id: number) => {
    set({ currentServerId: id })
  },

  // Fetch members
  fetchMembers: async (serverId: number) => {
    set({ isLoading: true, error: null })
    try {
      const members = await serverService.getMembers(serverId)
      set({ members, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取成员列表失败',
      })
      throw err
    }
  },

  // Update member
  updateMember: async (serverId: number, userId: number, data: UpdateServerMemberRequest) => {
    set({ isLoading: true, error: null })
    try {
      await serverService.updateMember(serverId, userId, data)
      // Refresh members
      await get().fetchMembers(serverId)
      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '更新成员失败',
      })
      throw err
    }
  },

  // Kick member
  kickMember: async (serverId: number, userId: number) => {
    set({ isLoading: true, error: null })
    try {
      await serverService.kickMember(serverId, userId)
      set((state) => ({
        members: state.members.filter((m) => m.userId !== userId),
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '踢出成员失败',
      })
      throw err
    }
  },

  // Fetch roles
  fetchRoles: async (serverId: number) => {
    set({ isLoading: true, error: null })
    try {
      const roles = await serverService.getRoles(serverId)
      set({ roles, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取角色列表失败',
      })
      throw err
    }
  },

  // Create role
  createRole: async (serverId: number, data: CreateRoleRequest) => {
    set({ isLoading: true, error: null })
    try {
      await serverService.createRole(serverId, data)
      // Refresh roles
      await get().fetchRoles(serverId)
      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '创建角色失败',
      })
      throw err
    }
  },

  // Update role
  updateRole: async (serverId: number, roleId: number, data: UpdateRoleRequest) => {
    set({ isLoading: true, error: null })
    try {
      await serverService.updateRole(serverId, roleId, data)
      // Refresh roles
      await get().fetchRoles(serverId)
      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '更新角色失败',
      })
      throw err
    }
  },

  // Delete role
  deleteRole: async (serverId: number, roleId: number) => {
    set({ isLoading: true, error: null })
    try {
      await serverService.deleteRole(serverId, roleId)
      set((state) => ({
        roles: state.roles.filter((r) => r.id !== roleId),
        isLoading: false,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '删除角色失败',
      })
      throw err
    }
  },

  // Permission check based on current user's roles in current server
  hasPermission: (perm: bigint) => {
    const { members, currentServer } = get()
    if (!currentServer) return false

    const authState = useAuthStore.getState()
    const currentUserId = authState.currentUser?.id
    if (currentUserId === undefined) return false

    // Owner always has all permissions
    if (currentServer.ownerId === currentUserId) return true

    // Find current user's member record
    const member = members.find((m) => m.userId === currentUserId)
    if (!member) return false

    // Merge all role permissions
    const rolePerms = member.roles.map((r) => parsePermissions(r.permissions))
    const mergedPerms = mergePermissions(rolePerms)

    return hasPermission(mergedPerms, perm)
  },

  clearError: () => {
    set({ error: null })
  },
}))

// Re-export Permission type for convenience
export type { PermissionType }

// Backward compatibility: roomStore re-exported useRoomStore from serverStore
// We keep a minimal alias so imports don't break during phase 5 migration
export { useServerStore as useRoomStore }
export type { ServerState as RoomState }
