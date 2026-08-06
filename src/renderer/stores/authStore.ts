import { create } from 'zustand'
import type { UserStatus } from '@shared/types/kook'

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

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  isAuthenticated: false,
  currentUser: null,
  token: null,
  isLoading: false,
  error: null,
  status: 'online',

  // Login action
  login: async (username: string, _password: string) => {
    set({ isLoading: true, error: null })
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      const mockUser: User = {
        id: '1',
        username,
        nickname: username,
        status: 'online',
      }
      set({
        isAuthenticated: true,
        currentUser: mockUser,
        token: 'mock-token',
        isLoading: false,
        error: null,
      })
    } catch (_err) {
      set({
        isLoading: false,
        error: _err instanceof Error ? _err.message : '登录失败',
      })
      throw _err
    }
  },

  // Register action
  register: async (username: string, _password: string, email?: string) => {
    set({ isLoading: true, error: null })
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      const mockUser: User = {
        id: '1',
        username,
        email,
        status: 'online',
      }
      set({
        isAuthenticated: true,
        currentUser: mockUser,
        token: 'mock-token',
        isLoading: false,
        error: null,
      })
    } catch (_err) {
      set({
        isLoading: false,
        error: _err instanceof Error ? _err.message : '注册失败',
      })
      throw _err
    }
  },

  // Logout action
  logout: () => {
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      set({ isLoading: false })
    } catch (_err) {
      set({ isLoading: false })
    }
  },

  // Set status
  setStatus: (status: UserStatus) => {
    set({ status })
  },

  // Set custom status
  setCustomStatus: async (status: { customStatus: string }) => {
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, customStatus: status.customStatus }
        : null,
    }))
  },

  // Update profile
  updateProfile: async (data: Partial<User>) => {
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, ...data }
        : null,
    }))
  },

  // Change password
  changePassword: async (_oldPassword: string, _newPassword: string) => {
    set({ isLoading: true })
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      set({ isLoading: false })
    } catch (_err) {
      set({
        isLoading: false,
        error: _err instanceof Error ? _err.message : '密码修改失败',
      })
      throw _err
    }
  },
}))
