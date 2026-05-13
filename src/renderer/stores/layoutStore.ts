import { create } from 'zustand'

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
  server: 72,      // Server icon bar
  channel: 240,    // Channel list (expanded)
  channelCollapsed: 60, // Channel list (collapsed)
  member: 240,     // Member list
} as const

// Header height
export const HEADER_HEIGHT = 48

interface LayoutState {
  // Sidebar states
  channelSidebarCollapsed: boolean
  memberListVisible: boolean

  // Responsive breakpoint
  currentBreakpoint: Breakpoint

  // Actions
  toggleChannelSidebar: () => void
  setChannelSidebarCollapsed: (collapsed: boolean) => void
  toggleMemberList: () => void
  setMemberListVisible: (visible: boolean) => void
  updateBreakpoint: (width: number) => void

  // Computed helpers
  isSmallScreen: () => boolean
  isMediumScreen: () => boolean
  isLargeScreen: () => boolean
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  channelSidebarCollapsed: false,
  memberListVisible: true,
  currentBreakpoint: 'lg',

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

    set({
      currentBreakpoint: breakpoint,
      memberListVisible: currentState.memberListVisible && newMemberListVisible,
      channelSidebarCollapsed: newChannelSidebarCollapsed,
    })
  },

  isSmallScreen: () => get().currentBreakpoint === 'sm',
  isMediumScreen: () => get().currentBreakpoint === 'md',
  isLargeScreen: () => ['lg', 'xl', '2xl'].includes(get().currentBreakpoint),
}))