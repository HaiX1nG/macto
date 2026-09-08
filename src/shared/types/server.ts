/**
 * Server Domain Types
 *
 * Mirrors backend server_dto.go and model/server.go.
 * permissions fields use string for JSON transport (BigInt under the hood).
 */

import type { Channel } from './channel'

export interface Server {
  id: number
  name: string
  iconUrl: string
  bannerUrl: string
  description: string
  ownerId: number
  inviteCode: string
  isPrivate: boolean
  maxMembers: number
  createdAt: string
  updatedAt: string
}

export interface ServerDetail extends Server {
  channels: Channel[]
  memberCount?: number
}

export interface Role {
  id: number
  serverId: number
  name: string
  color: string
  position: number
  permissions: string // bigint serialized as string (JSON does not support bigint)
  isMentionable: boolean
  createdAt: string
  updatedAt: string
}

export interface ServerMember {
  id: number
  serverId: number
  userId: number
  username: string
  avatarUrl: string
  nickname: string
  roles: Role[]
  joinedAt: string
  isOwner: boolean
}

// ==================== Request / Response DTOs ====================

export interface CreateServerRequest {
  name: string
  iconUrl?: string
  bannerUrl?: string
  description?: string
  isPrivate?: boolean
}

export interface UpdateServerRequest {
  name?: string
  iconUrl?: string
  bannerUrl?: string
  description?: string
}

export interface JoinServerRequest {
  inviteCode: string
}

export interface UpdateServerMemberRequest {
  nickname?: string
  roleIds?: number[]
}

export interface CreateRoleRequest {
  name: string
  color?: string
  permissions: string // bigint as string
  position?: number
  isMentionable?: boolean
}

export interface UpdateRoleRequest {
  name?: string
  color?: string
  permissions?: string
  position?: number
  isMentionable?: boolean
}
