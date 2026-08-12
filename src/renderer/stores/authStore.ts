import { create } from 'zustand'
import type { UserStatus } from '@shared/types/auth'
import type {
  LoginResponse,
  UserInfoResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  SetCustomStatusRequest,
} from '@shared/types/auth'
import { authService } from '../services/authService'
import { apiClient } from '../services/apiClient'

export interface User {
  id: number
  username: string
  email: string
  avatarUrl: string
  bannerUrl: string
  bio: string
  customStatus: string
  status: UserStatus
  createdAt: string
}

export interface AuthState {
  // State
  isAuthenticated: boolean
  currentUser: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  status: UserStatus

  // Live presence cache for arbitrary users (userId -> online?).
  // Populated on demand by callers that need online status (e.g. MemberList).
  onlineStatus: Record<number, boolean>
  lastOnlineFetchAt: number

  // Actions
  // Returns a synchronous cleanup function (removes auth:logout listener)
  initAuth: () => () => void
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, email?: string) => Promise<void>
  logout: () => void
  clearError: () => void
  fetchUserInfo: () => Promise<void>
  setStatus: (status: UserStatus) => void
  setOnlineStatus: (userId: number, isOnline: boolean) => void
  setCustomStatus: (status: SetCustomStatusRequest) => Promise<void>
  updateProfile: (data: UpdateProfileRequest) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
}

function mapLoginResponseToUser(response: LoginResponse): User {
  return {
    id: response.userId,
    username: response.username,
    email: response.email,
    avatarUrl: response.avatarUrl || '',
    bannerUrl: response.bannerUrl || '',
    bio: '',
    customStatus: '',
    status: 'online',
    createdAt: '',
  }
}

function mapUserInfoToUser(info: UserInfoResponse): User {
  return {
    id: info.userId,
    username: info.username,
    email: info.email,
    avatarUrl: info.avatarUrl || '',
    bannerUrl: info.bannerUrl || '',
    bio: info.bio || '',
    customStatus: info.customStatus || '',
    status: info.isOnline ? 'online' : 'offline',
    createdAt: info.createdAt,
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  currentUser: null,
  token: null,
  isLoading: false,
  error: null,
  status: 'online',
  onlineStatus: {},
  lastOnlineFetchAt: 0,

  // Initialize auth from stored tokens (called on app startup)
  // Returns a synchronous cleanup function that removes the auth:logout listener.
  // The listener MUST be registered before any async fetchUserInfo call, so that
  // a token-expired 401 during fetchUserInfo does not miss the event.
  initAuth: () => {
    // 1. Register listener FIRST — before any async work
    const handleAuthLogout = () => {
      // Directly clear store state instead of calling get().logout(),
      // which would trigger apiClient.logout() -> dispatch auth:logout -> recursion.
      set({
        isAuthenticated: false,
        currentUser: null,
        token: null,
        error: null,
      })
    }
    window.addEventListener('auth:logout', handleAuthLogout)

    // 2. Kick off async fetch (fire-and-forget; the caller does not await it)
    if (apiClient.isAuthenticated()) {
      set({ isAuthenticated: true, token: apiClient.getAccessToken() })
      // Use an IIFE so we don't return a promise from initAuth
      ;(async () => {
        try {
          await get().fetchUserInfo()
        } catch {
          // If fetchUserInfo fails (e.g. token expired), the apiClient interceptor
          // will dispatch auth:logout which is already handled by the listener above.
          // If the interceptor already cleared the token before dispatching,
          // the listener will clean store state — no double-dispatch.
        }
      })()
    }

    // 3. Return synchronous cleanup
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout)
    }
  },

  // Login action
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.login(username, password)
      set({
        isAuthenticated: true,
        currentUser: mapLoginResponseToUser(response),
        token: response.accessToken,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '登录失败',
      })
      throw err
    }
  },

  // Register action
  register: async (username: string, password: string, email?: string) => {
    set({ isLoading: true, error: null })
    try {
      const emailValue = email || ''
      try {
        await authService.register(username, password, emailValue)
      } catch (registerErr) {
        const apiErr = registerErr as { statusCode?: number }
        if (apiErr && apiErr.statusCode && apiErr.statusCode >= 400 && apiErr.statusCode < 500) {
          throw registerErr
        }
      }
      await get().login(username, password)
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '注册失败',
      })
      throw err
    }
  },

  // Logout action
  logout: () => {
    authService.logout()
    set({
      isAuthenticated: false,
      currentUser: null,
      token: null,
      error: null,
    })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },

  // Fetch user info
  fetchUserInfo: async () => {
    set({ isLoading: true })
    try {
      const userInfo = await authService.getUserInfo()
      set({
        isLoading: false,
        currentUser: mapUserInfoToUser(userInfo),
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取用户信息失败',
      })
      throw err
    }
  },

  // Set status (local only, no API call)
  setStatus: (status: UserStatus) => {
    set({ status })
  },

  // Cache an individual user's online status (live presence)
  setOnlineStatus: (userId: number, isOnline: boolean) => {
    set((state) => ({ onlineStatus: { ...state.onlineStatus, [userId]: isOnline } }))
  },

  // Set custom status
  setCustomStatus: async (status: SetCustomStatusRequest) => {
    set({ isLoading: true, error: null })
    try {
      await authService.setCustomStatus(status)
      set((state) => ({
        isLoading: false,
        currentUser: state.currentUser
          ? { ...state.currentUser, customStatus: status.customStatus ?? '' }
          : null,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '设置自定义状态失败',
      })
      throw err
    }
  },

  // Update profile
  updateProfile: async (data: UpdateProfileRequest) => {
    set({ isLoading: true, error: null })
    try {
      await authService.updateProfile(data)
      set((state) => ({
        isLoading: false,
        currentUser: state.currentUser
          ? {
              ...state.currentUser,
              username: data.username ?? state.currentUser.username,
              email: data.email ?? state.currentUser.email,
              avatarUrl: data.avatarUrl ?? state.currentUser.avatarUrl,
              bannerUrl: data.bannerUrl ?? state.currentUser.bannerUrl,
              bio: data.bio ?? state.currentUser.bio,
            }
          : null,
      }))
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '更新资料失败',
      })
      throw err
    }
  },

  // Change password
  changePassword: async (oldPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null })
    try {
      const requestData: ChangePasswordRequest = { oldPassword, newPassword }
      await authService.changePassword(requestData)
      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '密码修改失败',
      })
      throw err
    }
  },
}))
