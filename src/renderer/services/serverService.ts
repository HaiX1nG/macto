import apiClient from './apiClient'
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

export const serverService = {
  // ==================== Server CRUD ====================

  async createServer(data: CreateServerRequest): Promise<ServerDetail> {
    return apiClient.post<ServerDetail>('/servers', data)
  },

  async getServerList(): Promise<Server[]> {
    return apiClient.get<Server[]>('/servers')
  },

  async getServerDetail(id: number): Promise<ServerDetail> {
    return apiClient.get<ServerDetail>(`/servers/${id}`)
  },

  async updateServer(id: number, data: UpdateServerRequest): Promise<Server> {
    return apiClient.put<Server>(`/servers/${id}`, data)
  },

  async deleteServer(id: number): Promise<void> {
    return apiClient.delete<void>(`/servers/${id}`)
  },

  // ==================== Join / Leave ====================

  async joinServer(id: number, data: JoinServerRequest): Promise<void> {
    return apiClient.post<void>(`/servers/${id}/join`, data)
  },

  async leaveServer(id: number): Promise<void> {
    return apiClient.post<void>(`/servers/${id}/leave`)
  },

  // ==================== Members ====================

  async getMembers(serverId: number): Promise<ServerMember[]> {
    return apiClient.get<ServerMember[]>(`/servers/${serverId}/members`)
  },

  async getMember(serverId: number, userId: number): Promise<ServerMember> {
    return apiClient.get<ServerMember>(`/servers/${serverId}/members/${userId}`)
  },

  async updateMember(
    serverId: number,
    userId: number,
    data: UpdateServerMemberRequest
  ): Promise<void> {
    return apiClient.put<void>(`/servers/${serverId}/members/${userId}`, data)
  },

  async kickMember(serverId: number, userId: number): Promise<void> {
    return apiClient.delete<void>(`/servers/${serverId}/members/${userId}`)
  },

  // ==================== Roles ====================

  async getRoles(serverId: number): Promise<Role[]> {
    return apiClient.get<Role[]>(`/servers/${serverId}/roles`)
  },

  async createRole(serverId: number, data: CreateRoleRequest): Promise<Role> {
    return apiClient.post<Role>(`/servers/${serverId}/roles`, data)
  },

  async updateRole(
    serverId: number,
    roleId: number,
    data: UpdateRoleRequest
  ): Promise<Role> {
    return apiClient.put<Role>(`/servers/${serverId}/roles/${roleId}`, data)
  },

  async deleteRole(serverId: number, roleId: number): Promise<void> {
    return apiClient.delete<void>(`/servers/${serverId}/roles/${roleId}`)
  },
}

export default serverService
