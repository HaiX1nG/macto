import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import type { ViewId, ViewParams } from '@shared/types/view'
import { ConnectionState, type ConnectionFailureCode, type ConnectionStatePayload } from '@shared/types/voice'

// ==================== Layout Constants ====================

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export const SIDEBAR_WIDTHS = {
  server: 72,
  serverExpanded: 200,
  channel: 240,
  channelCollapsed: 60,
  member: 240,
} as const

export const HEADER_HEIGHT = 48

// ==================== Theme ====================

export type AppTheme = 'sakura' | 'ancient' | 'tech'

// ==================== Settings ====================

export interface AppSettings {
  audioInputDeviceId: string
  audioOutputDeviceId: string
  defaultVolume: number
  autoJoinLastSession: boolean
  showNotification: boolean
}

// ==================== Store State ====================

export interface UIState {
  // Navigation
  activeViewId: ViewId
  activeViewParams: ViewParams
  currentServerId: number | null
  currentChannelId: number | null
  contextGeneration: number

  // Layout
  serverSidebarExpanded: boolean
  channelSidebarCollapsed: boolean
  memberListVisible: boolean
  mobileChannelSidebarOpen: boolean
  currentBreakpoint: Breakpoint

  // Theme
  theme: AppTheme

  // Settings
  settings: AppSettings

  // WebSocket connection status (extended lifecycle state machine)
  wsConnectionStatus: ConnectionState
  wsReconnectAttempt: number
  wsMaxReconnectAttempts: number
  wsLastConnectedAt: number | null
  wsLastDisconnectedAt: number | null
  wsFailureCode: ConnectionFailureCode | null
  wsFailureMessage: string | null

  // ==================== Navigation Actions ====================
  setActiveView: (viewId: ViewId, params?: ViewParams) => void
  clearActiveView: () => void
  setCurrentServerId: (id: number | null) => void
  setCurrentChannelId: (id: number | null) => void
  bumpContextGeneration: () => number

  // ==================== Layout Actions ====================
  toggleServerSidebar: () => void
  setServerSidebarExpanded: (expanded: boolean) => void
  toggleChannelSidebar: () => void
  setChannelSidebarCollapsed: (collapsed: boolean) => void
  toggleMemberList: () => void
  setMemberListVisible: (visible: boolean) => void
  toggleMobileChannelSidebar: () => void
  closeMobileChannelSidebar: () => void
  updateBreakpoint: (width: number) => void

  // ==================== Theme Actions ====================
  setTheme: (theme: AppTheme) => void
  initTheme: () => void

  // ==================== Settings Actions ====================
  setAudioInputDevice: (deviceId: string) => void
  setAudioOutputDevice: (deviceId: string) => void
  setDefaultVolume: (volume: number) => void
  setAutoJoinLastSession: (enabled: boolean) => void
  setShowNotification: (enabled: boolean) => void

  // ==================== WebSocket Status Actions ====================
  setConnectionStatus: (status: ConnectionState, payload?: ConnectionStatePayload) => void
  resetConnectionStatus: () => void

  // ==================== Computed Helpers ====================
  isSmallScreen: () => boolean
  isMediumScreen: () => boolean
  isLargeScreen: () => boolean
}

// ==================== Helpers ====================

const DEFAULT_VIEW: ViewId = 'server-home'
const DEFAULT_PARAMS: ViewParams = {}

function applyThemeToDocument(theme: AppTheme): void {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('app-theme', theme)
}

// ==================== Store ====================

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // ==================== Initial State ====================

        // Navigation
        activeViewId: DEFAULT_VIEW,
        activeViewParams: DEFAULT_PARAMS,
        currentServerId: null,
        currentChannelId: null,
        contextGeneration: 0,

        // Layout
        serverSidebarExpanded: false,
        channelSidebarCollapsed: false,
        memberListVisible: true,
        mobileChannelSidebarOpen: false,
        currentBreakpoint: 'lg',

        // Theme
        theme: 'sakura',

        // Settings
        settings: {
          audioInputDeviceId: '',
          audioOutputDeviceId: '',
          defaultVolume: 100,
          autoJoinLastSession: false,
          showNotification: true,
        },

        // WebSocket
        wsConnectionStatus: ConnectionState.Disconnected,
        wsReconnectAttempt: 0,
        wsMaxReconnectAttempts: 10,
        wsLastConnectedAt: null,
        wsLastDisconnectedAt: null,
        wsFailureCode: null,
        wsFailureMessage: null,

        // ==================== Navigation Actions ====================

        setActiveView: (viewId, params = DEFAULT_PARAMS) =>
          set({ activeViewId: viewId, activeViewParams: params }),

        clearActiveView: () =>
          set({ activeViewId: DEFAULT_VIEW, activeViewParams: DEFAULT_PARAMS }),

        setCurrentServerId: (id) =>
          set((state) => {
            if (state.currentServerId === id) {
              return state
            }

            return {
              currentServerId: id,
              currentChannelId: null,
              activeViewId: DEFAULT_VIEW,
              activeViewParams: {},
              contextGeneration: state.contextGeneration + 1,
            }
          }),

        setCurrentChannelId: (id) =>
          set((state) => {
            if (state.currentChannelId === id) {
              return state
            }

            return {
              currentChannelId: id,
              contextGeneration: state.contextGeneration + 1,
            }
          }),

        bumpContextGeneration: () => {
          let nextGeneration = 0
          set((state) => {
            nextGeneration = state.contextGeneration + 1
            return { contextGeneration: nextGeneration }
          })
          return nextGeneration
        },

        // ==================== Layout Actions ====================

        toggleServerSidebar: () =>
          set((state) => ({ serverSidebarExpanded: !state.serverSidebarExpanded })),

        setServerSidebarExpanded: (expanded) =>
          set({ serverSidebarExpanded: expanded }),

        toggleChannelSidebar: () =>
          set((state) => ({ channelSidebarCollapsed: !state.channelSidebarCollapsed })),

        setChannelSidebarCollapsed: (collapsed) =>
          set({ channelSidebarCollapsed: collapsed }),

        toggleMemberList: () =>
          set((state) => ({ memberListVisible: !state.memberListVisible })),

        setMemberListVisible: (visible) =>
          set({ memberListVisible: visible }),

        toggleMobileChannelSidebar: () =>
          set((state) => ({ mobileChannelSidebarOpen: !state.mobileChannelSidebarOpen })),

        closeMobileChannelSidebar: () =>
          set({ mobileChannelSidebarOpen: false }),

        updateBreakpoint: (width) => {
          let breakpoint: Breakpoint
          if (width >= BREAKPOINTS['2xl']) breakpoint = '2xl'
          else if (width >= BREAKPOINTS.xl) breakpoint = 'xl'
          else if (width >= BREAKPOINTS.lg) breakpoint = 'lg'
          else if (width >= BREAKPOINTS.md) breakpoint = 'md'
          else breakpoint = 'sm'

          const currentState = get()
          const newMemberListVisible = width >= BREAKPOINTS.lg
          const newChannelSidebarCollapsed = width < BREAKPOINTS.md

          if (breakpoint !== 'sm') {
            set({
              currentBreakpoint: breakpoint,
              memberListVisible: currentState.memberListVisible && newMemberListVisible,
              channelSidebarCollapsed: newChannelSidebarCollapsed,
              mobileChannelSidebarOpen: false,
            })
          } else {
            set({
              currentBreakpoint: breakpoint,
              memberListVisible: currentState.memberListVisible && newMemberListVisible,
              channelSidebarCollapsed: newChannelSidebarCollapsed,
            })
          }
        },

        // ==================== Theme Actions ====================

        setTheme: (theme) => {
          set({ theme })
          applyThemeToDocument(theme)
        },

        initTheme: () => {
          const savedTheme = localStorage.getItem('app-theme') as AppTheme | null
          if (savedTheme && ['sakura', 'ancient', 'tech'].includes(savedTheme)) {
            set({ theme: savedTheme })
            applyThemeToDocument(savedTheme)
          } else {
            applyThemeToDocument('sakura')
          }
        },

        // ==================== Settings Actions ====================

        setAudioInputDevice: (deviceId) =>
          set((state) => ({
            settings: { ...state.settings, audioInputDeviceId: deviceId },
          })),

        setAudioOutputDevice: (deviceId) =>
          set((state) => ({
            settings: { ...state.settings, audioOutputDeviceId: deviceId },
          })),

        setDefaultVolume: (volume) =>
          set((state) => ({
            settings: { ...state.settings, defaultVolume: volume },
          })),

        setAutoJoinLastSession: (enabled) =>
          set((state) => ({
            settings: { ...state.settings, autoJoinLastSession: enabled },
          })),

        setShowNotification: (enabled) =>
          set((state) => ({
            settings: { ...state.settings, showNotification: enabled },
          })),

        // ==================== WebSocket Status Actions ====================

        setConnectionStatus: (status, payload) => {
          const now = Date.now()
          set((state) => ({
            wsConnectionStatus: status,
            wsReconnectAttempt: payload?.reconnectAttempt ?? (status === ConnectionState.Reconnecting ? state.wsReconnectAttempt + 1 : 0),
            wsMaxReconnectAttempts: payload?.maxReconnectAttempts ?? state.wsMaxReconnectAttempts,
            wsLastConnectedAt: status === ConnectionState.Connected ? now : state.wsLastConnectedAt,
            wsLastDisconnectedAt: status === ConnectionState.Disconnected || status === ConnectionState.Failed ? now : state.wsLastDisconnectedAt,
            wsFailureCode: payload?.failureCode ?? null,
            wsFailureMessage: payload?.failureMessage ?? null,
          }))
        },

        resetConnectionStatus: () =>
          set({
            wsConnectionStatus: ConnectionState.Disconnected,
            wsReconnectAttempt: 0,
            wsLastConnectedAt: null,
            wsLastDisconnectedAt: null,
            wsFailureCode: null,
            wsFailureMessage: null,
          }),

        // ==================== Computed Helpers ====================

        isSmallScreen: () => get().currentBreakpoint === 'sm',
        isMediumScreen: () => get().currentBreakpoint === 'md',
        isLargeScreen: () => ['lg', 'xl', '2xl'].includes(get().currentBreakpoint),
      }),
      {
        name: 'macto-ui-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          theme: state.theme,
          settings: state.settings,
          serverSidebarExpanded: state.serverSidebarExpanded,
          channelSidebarCollapsed: state.channelSidebarCollapsed,
          memberListVisible: state.memberListVisible,
        }),
        version: 1,
        migrate: (persistedState, version) => {
          const state = persistedState as Partial<UIState>
          if (version === 0) {
            // Migrate from old macto-settings store (v0)
            return {
              ...state,
              theme: state.theme ?? 'sakura',
              settings: state.settings ?? {
                audioInputDeviceId: '',
                audioOutputDeviceId: '',
                defaultVolume: 100,
                autoJoinLastSession: false,
                showNotification: true,
              },
            } as UIState
          }
          return state as UIState
        },
      }
    ),
    { name: 'UIStore', enabled: import.meta.env.DEV }
  )
)

// ==================== Backward Compatibility Aliases ====================

export const useLayoutStore = useUIStore
export const useSettingsStore = useUIStore
export const useThemeStore = useUIStore
export const useWebSocketStore = useUIStore

export default useUIStore
