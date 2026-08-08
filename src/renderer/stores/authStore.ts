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

  // Actions
  initAuth: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, email?: string) => Promise<void>
  logout: () => void
  clearError: () => void
  fetchUserInfo: () => Promise<void>
  setStatus: (status: UserStatus) => void
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
