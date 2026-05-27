import { create } from 'zustand'
import { authService } from '../services'
import type { LoginResponse, UserInfoResponse, UpdateProfileRequest, ChangePasswordRequest, SetCustomStatusRequest } from '@shared/types/api'
import type { User, UserStatus } from '@shared/types/kook'

interface AuthState {
  currentUser: UserInfoResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  status: UserStatus
  cachedUsers: Map<string, User>

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
  setStatus: (status: UserStatus) => void
  cacheUser: (user: User) => void
  getCachedUser: (userId: string) => User | undefined
  getUsersByIds: (userIds: string[]) => User[]
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,
  status: 'online',
  cachedUsers: new Map(),

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
        status: 'online',
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
        status: 'online',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  logout: () => {
    authService.logout()
    set({ currentUser: null, isAuthenticated: false, error: null, status: 'online' })
  },

  fetchUserInfo: async () => {
    if (!authService.isAuthenticated()) return

    set({ isLoading: true })
    try {
      const userInfo = await authService.getUserInfo()
      const customStatus = userInfo.customStatus || ''
      const newStatus: UserStatus = customStatus === '' ? 'online' :
                                   customStatus === '空闲' ? 'idle' :
                                   customStatus === '请勿打扰' ? 'dnd' : 'offline'
      set({ currentUser: userInfo, isLoading: false, isAuthenticated: true, status: newStatus })
    } catch (_err) {
      authService.logout()
      set({ currentUser: null, isLoading: false, isAuthenticated: false, status: 'online' })
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await authService.updateProfile(data)
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
      const customStatus = data.customStatus || ''
      const newStatus: UserStatus = customStatus === '' ? 'online' :
                                   customStatus === '空闲' ? 'idle' :
                                   customStatus === '请勿打扰' ? 'dnd' : 'offline'
      set((state) => ({
        currentUser: state.currentUser
          ? { ...state.currentUser, customStatus }
          : null,
        status: newStatus,
      }))
    } catch (err) {
      console.error('Failed to set custom status:', err)
    }
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  setStatus: (status) => set((state) => ({
    status,
    currentUser: state.currentUser
      ? { ...state.currentUser, customStatus: status === 'online' ? '' : status === 'idle' ? '空闲' : status === 'dnd' ? '请勿打扰' : '隐身' }
      : null,
  })),

  cacheUser: (user) => set((state) => {
    const newCachedUsers = new Map(state.cachedUsers)
    newCachedUsers.set(user.id, user)
    return { cachedUsers: newCachedUsers }
  }),

  getCachedUser: (userId) => {
    return get().cachedUsers.get(userId)
  },

  getUsersByIds: (userIds) => {
    const state = get()
    return userIds.map(id => state.cachedUsers.get(id)).filter(Boolean) as User[]
  },
}))

// Listen for logout events from apiClient
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout()
  })
}

export default useAuthStore