import { create } from 'zustand'
import type { UserStatus } from '@shared/types/kook'
import type { UpdateProfileRequest, ChangePasswordRequest } from '@shared/types/api'
import { authService } from '../services/authService'
import { apiClient } from '../services/apiClient'

export interface User {
  id: string
  username: string
  nickname?: string
  avatar?: string
  email?: string
  phone?: string
  status?: UserStatus
  customStatus?: string
}

export interface AuthState {
  // State
  isAuthenticated: boolean
  currentUser: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  status: UserStatus

  // Actions
  initAuth: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, email?: string) => Promise<void>
  logout: () => void
  clearError: () => void
  fetchUserInfo: () => Promise<void>
  setStatus: (status: UserStatus) => void
  setCustomStatus: (status: { customStatus: string }) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  currentUser: null,
  token: null,
  isLoading: false,
  error: null,
  status: 'online',

  // Initialize auth from stored tokens (called on app startup)
  initAuth: async () => {
    if (apiClient.isAuthenticated()) {
      set({ isAuthenticated: true, token: apiClient.getAccessToken() })
      try {
        await get().fetchUserInfo()
      } catch {
        // If fetching user info fails (e.g. token expired), the apiClient
        // interceptor will dispatch auth:logout which resets state via logout()
      }
    }
  },

  // Login action
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.login(username, password)
      set({
        isAuthenticated: true,
        currentUser: {
          id: String(response.userId),
          username: response.username,
          nickname: response.username,
          email: response.email,
          avatar: response.avatarUrl || undefined,
          status: 'online',
        },
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
  // Backend POST /auth/register only returns {userId, username, email} (no token).
  // We attempt authService.register (which expects LoginResponse) in a try-catch.
  // If registration succeeds on the backend, the apiClient.register call may fail
  // when trying to access the missing token fields. We catch that error and then
  // call authService.login to obtain actual tokens and complete the flow.
  register: async (username: string, password: string, email?: string) => {
    set({ isLoading: true, error: null })
    try {
      const emailValue = email || ''
      try {
        // Attempt register - may fail because backend doesn't return tokens
        await authService.register(username, password, emailValue)
      } catch (registerErr) {
        // If register endpoint returned a non-2xx status, this is a real error
        // (e.g. username already exists). Check the status code to decide.
        // ApiClientError with statusCode 400/409 etc. means registration failed.
        const apiErr = registerErr as { statusCode?: number }
        if (apiErr && apiErr.statusCode && apiErr.statusCode >= 400 && apiErr.statusCode < 500) {
          throw registerErr
        }
        // For other errors (e.g. response parsing due to missing token fields),
        // we assume registration might have succeeded and try login.
      }
      // Always login after successful registration to get tokens
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
        currentUser: {
          id: String(userInfo.userId),
          username: userInfo.username,
          email: userInfo.email,
          avatar: userInfo.avatarUrl || undefined,
          customStatus: userInfo.customStatus || undefined,
          status: userInfo.isOnline ? 'online' : 'offline',
        },
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

  // Set custom status
  setCustomStatus: async (status: { customStatus: string }) => {
    set({ isLoading: true, error: null })
    try {
      await authService.setCustomStatus({ customStatus: status.customStatus })
      set((state) => ({
        isLoading: false,
        currentUser: state.currentUser
          ? { ...state.currentUser, customStatus: status.customStatus }
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
  updateProfile: async (data: Partial<User>) => {
    set({ isLoading: true, error: null })
    try {
      const updateData: UpdateProfileRequest = {}
      if (data.username !== undefined) updateData.username = data.username
      if (data.email !== undefined) updateData.email = data.email
      if (data.avatar !== undefined) updateData.avatarUrl = data.avatar

      await authService.updateProfile(updateData)
      set((state) => ({
        isLoading: false,
        currentUser: state.currentUser
          ? { ...state.currentUser, ...data }
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
