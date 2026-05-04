import { create } from 'zustand'
import { authService } from '../services'
import type { LoginResponse, UserInfoResponse, UpdateProfileRequest, ChangePasswordRequest, SetCustomStatusRequest } from '@shared/types/api'

interface AuthState {
  currentUser: UserInfoResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, email: string) => Promise<void>
  logout: () => void
  fetchUserInfo: () => Promise<void>
  updateProfile: (data: UpdateProfileRequest) => Promise<void>
  changePassword: (data: ChangePasswordRequest) => Promise<void>
  setCustomStatus: (data: SetCustomStatusRequest) => Promise<void>
  setError: (error: string | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null })
    try {
      const response: LoginResponse = await authService.login(username, password)
      set({
        currentUser: {
          userId: response.userId,
          username: response.username,
          email: response.email,
          avatarUrl: response.avatarUrl,
          isOnline: true,
          customStatus: '',
          createdAt: new Date().toISOString(),
        },
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  register: async (username, password, email) => {
    set({ isLoading: true, error: null })
    try {
      const response: LoginResponse = await authService.register(username, password, email)
      set({
        currentUser: {
          userId: response.userId,
          username: response.username,
          email: response.email,
          avatarUrl: response.avatarUrl,
          isOnline: true,
          customStatus: '',
          createdAt: new Date().toISOString(),
        },
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  logout: () => {
    authService.logout()
    set({ currentUser: null, isAuthenticated: false, error: null })
  },

  fetchUserInfo: async () => {
    if (!authService.isAuthenticated()) return

    set({ isLoading: true })
    try {
      const userInfo = await authService.getUserInfo()
      set({ currentUser: userInfo, isLoading: false, isAuthenticated: true })
    } catch (_err) {
      // Token is invalid, clear auth state
      authService.logout()
      set({ currentUser: null, isLoading: false, isAuthenticated: false })
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await authService.updateProfile(data)
      // Re-fetch user info to ensure data is synced
      const userInfo = await authService.getUserInfo()
      set({ currentUser: userInfo, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  changePassword: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await authService.changePassword(data)
      set({ isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  setCustomStatus: async (data) => {
    try {
      await authService.setCustomStatus(data)
      set((state) => ({
        currentUser: state.currentUser
          ? { ...state.currentUser, customStatus: data.customStatus || '' }
          : null,
      }))
    } catch (err) {
      console.error('Failed to set custom status:', err)
    }
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))

// Listen for logout events from apiClient
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout()
  })
}

export default useAuthStore