import { create } from 'zustand'
import type { ViewId, ViewParams } from '@shared/types/view'

// Layout breakpoints following Tailwind conventions
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// Sidebar widths
export const SIDEBAR_WIDTHS = {
  server: 72,           // Server icon bar (collapsed)
  serverExpanded: 200,  // Server sidebar (expanded)
  channel: 240,         // Channel list (expanded)
  channelCollapsed: 60, // Channel list (collapsed)
  member: 240,          // Member list
} as const

// Header height
export const HEADER_HEIGHT = 48

interface LayoutState {
  // Sidebar states
  serverSidebarExpanded: boolean
  channelSidebarCollapsed: boolean
  memberListVisible: boolean

  // Mobile sidebar state
  mobileChannelSidebarOpen: boolean

  // Responsive breakpoint
  currentBreakpoint: Breakpoint

  // ── 活动视图状态 ──
  /** 当前活动视图 ID */
  activeViewId: ViewId
  /** 当前活动视图参数 */
  activeViewParams: ViewParams

  // Actions
  toggleServerSidebar: () => void
  setServerSidebarExpanded: (expanded: boolean) => void
  toggleChannelSidebar: () => void
  setChannelSidebarCollapsed: (collapsed: boolean) => void
  toggleMemberList: () => void
  setMemberListVisible: (visible: boolean) => void
  updateBreakpoint: (width: number) => void
  toggleMobileChannelSidebar: () => void
  closeMobileChannelSidebar: () => void

  // ── 视图导航 actions ──
  /** 设置活动视图 */
  setActiveView: (viewId: ViewId, params?: ViewParams) => void
  /** 重置为默认视图（home） */
  clearActiveView: () => void

  // Computed helpers
  isSmallScreen: () => boolean
  isMediumScreen: () => boolean
  isLargeScreen: () => boolean
}

// 默认视图
const DEFAULT_VIEW: ViewId = 'home'
const DEFAULT_PARAMS: ViewParams = {}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  serverSidebarExpanded: false,
  channelSidebarCollapsed: false,
  memberListVisible: true,
  mobileChannelSidebarOpen: false,
  currentBreakpoint: 'lg',
  activeViewId: DEFAULT_VIEW,
  activeViewParams: DEFAULT_PARAMS,

  toggleServerSidebar: () => set((state) => ({
    serverSidebarExpanded: !state.serverSidebarExpanded
  })),

  setServerSidebarExpanded: (expanded) => set({
    serverSidebarExpanded: expanded
  }),

  toggleChannelSidebar: () => set((state) => ({
    channelSidebarCollapsed: !state.channelSidebarCollapsed
  })),

  setChannelSidebarCollapsed: (collapsed) => set({
    channelSidebarCollapsed: collapsed
  }),

  toggleMemberList: () => set((state) => ({
    memberListVisible: !state.memberListVisible
  })),

  setMemberListVisible: (visible) => set({
    memberListVisible: visible
  }),

  toggleMobileChannelSidebar: () => set((state) => ({
    mobileChannelSidebarOpen: !state.mobileChannelSidebarOpen
  })),

  closeMobileChannelSidebar: () => set({ mobileChannelSidebarOpen: false }),

  setActiveView: (viewId, params = DEFAULT_PARAMS) =>
    set({ activeViewId: viewId, activeViewParams: params }),

  clearActiveView: () =>
    set({ activeViewId: DEFAULT_VIEW, activeViewParams: DEFAULT_PARAMS }),

  updateBreakpoint: (width) => {
    let breakpoint: Breakpoint
    if (width >= BREAKPOINTS['2xl']) breakpoint = '2xl'
    else if (width >= BREAKPOINTS.xl) breakpoint = 'xl'
    else if (width >= BREAKPOINTS.lg) breakpoint = 'lg'
    else if (width >= BREAKPOINTS.md) breakpoint = 'md'
    else breakpoint = 'sm'

    const currentState = get()

    // Auto-adjust sidebar states based on breakpoint
    const newMemberListVisible = width >= BREAKPOINTS.lg
    const newChannelSidebarCollapsed = width < BREAKPOINTS.md

    // If switching to non-mobile breakpoint, close mobile sidebar
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

  isSmallScreen: () => get().currentBreakpoint === 'sm',
  isMediumScreen: () => get().currentBreakpoint === 'md',
  isLargeScreen: () => ['lg', 'xl', '2xl'].includes(get().currentBreakpoint),
}))
