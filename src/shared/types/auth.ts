/**
 * Authentication & User Types
 *
 * Mirrors backend auth_dto.go and user_dto.go.
 * IDs are number (uint64 in Go, safe within JS number range for user IDs).
 */

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline'

export interface RegisterRequest {
  username: string
  password: string
  email: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  userId: number
  username: string
  email: string
  avatarUrl: string
  bannerUrl: string
  bio: string
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface UpdateProfileRequest {
  username?: string
  email?: string
  avatarUrl?: string
  bannerUrl?: string
  bio?: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface UserInfoResponse {
  userId: number
  username: string
  email: string
  avatarUrl: string
  bannerUrl: string
  bio: string
  isOnline: boolean
  customStatus: string
  createdAt: string
}

export interface SetCustomStatusRequest {
  customStatus?: string
}

export interface UserOnlineStatusResponse {
  userId: number
  username: string
  isOnline: boolean
  customStatus: string
  lastSeenAt?: string
}

export interface DeleteAccountRequest {
  password: string
}
