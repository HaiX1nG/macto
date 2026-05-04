import { create } from 'zustand'
import type { User, CurrentUser, UserStatus } from '@shared/types/kook'

interface UserState {
  currentUser: CurrentUser | null
  users: Map<string, User>
  status: UserStatus

  // Actions
  setCurrentUser: (user: CurrentUser) => void
  updateUser: (updates: Partial<CurrentUser>) => void
  setStatus: (status: UserStatus) => void
  setCustomStatus: (status: string) => void
  clearCustomStatus: () => void

  // User cache
  setUser: (user: User) => void
  getUsers: (ids: string[]) => User[]
  getUser: (id: string) => User | undefined
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  users: new Map(),
  status: 'online',

  setCurrentUser: (user) => set({ currentUser: user, status: user.status }),

  updateUser: (updates) => set((state) => ({
    currentUser: state.currentUser
      ? { ...state.currentUser, ...updates }
      : null
  })),

  setStatus: (status) => set((state) => ({
    status,
    currentUser: state.currentUser
      ? { ...state.currentUser, status }
      : null
  })),

  setCustomStatus: (customStatus) => set((state) => ({
    currentUser: state.currentUser
      ? { ...state.currentUser, customStatus }
      : null
  })),

  clearCustomStatus: () => set((state) => ({
    currentUser: state.currentUser
      ? { ...state.currentUser, customStatus: undefined }
      : null
  })),

  setUser: (user) => set((state) => {
    const newUsers = new Map(state.users)
    newUsers.set(user.id, user)
    return { users: newUsers }
  }),

  getUsers: (ids) => {
    const state = get()
    return ids.map(id => state.users.get(id)).filter(Boolean) as User[]
  },

  getUser: (id) => {
    return get().users.get(id)
  }
}))