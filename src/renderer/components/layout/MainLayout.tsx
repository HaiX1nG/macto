import { useEffect } from 'react'
import { ServerSidebar } from './ServerSidebar'
import { ChannelSidebar } from './ChannelSidebar'
import { MemberList } from '../members/MemberList'
import { useServerStore } from '@renderer/stores/serverStore'
import { useChannelStore } from '@renderer/stores/channelStore'
import { useAuthStore } from '@renderer/stores/authStore'
import { useUIStore, SIDEBAR_WIDTHS } from '@renderer/stores/uiStore'
import { useRoomWebSocket } from '@renderer/hooks/useRoomWebSocket'
import { useKeyboardShortcuts } from '@renderer/hooks/useKeyboardShortcuts'
import { useVoiceStore } from '@renderer/stores/voiceStore'
import { NavigationShell } from '@renderer/pages'
import { cn } from '@renderer/utils/cn'

export function MainLayout() {
  const { servers, currentServerId, setCurrentServer, fetchServers, fetchServerDetail } = useServerStore()
  const { setCurrentChannel } = useChannelStore()
  const { isAuthenticated, fetchUserInfo } = useAuthStore()
  const { initTheme } = useUIStore()
  const {
    memberListVisible,
    serverSidebarExpanded,
    updateBreakpoint,
    currentBreakpoint,
    mobileChannelSidebarOpen,
    closeMobileChannelSidebar,
    setActiveView,
    setCurrentServerId,
    setCurrentChannelId,
  } = useUIStore()
  const { setMute, isMuted } = useVoiceStore()

  useRoomWebSocket()

  // Register global keyboard shortcuts
  useKeyboardShortcuts([
    {
      id: 'toggleMute',
      handler: () => {
        setMute(!isMuted)
      },
      priority: 10,
    },
    {
      id: 'toggleDeafen',
      handler: () => {
        setMute(!isMuted)
      },
      priority: 10,
    },
    ...Array.from({ length: 9 }, (_, i) => ({
      id: `switchServer${i + 1}` as const,
      handler: () => {
        const server = servers[i]
        if (server) {
          setCurrentServer(server.id)
          setCurrentServerId(server.id)
          setActiveView('server-home', { serverId: server.id })
        }
      },
    })),
  ])

  useEffect(() => {
    initTheme()
  }, [initTheme])

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserInfo()
    }
  }, [isAuthenticated, fetchUserInfo])

  useEffect(() => {
    const loadServers = async () => {
      try {
        await fetchServers()
        const state = useServerStore.getState()
        if (state.servers.length > 0) {
          const firstServer = state.servers[0]
          setCurrentServer(firstServer.id)
          setCurrentServerId(firstServer.id)
          await fetchServerDetail(firstServer.id)
          setActiveView('server-home', { serverId: firstServer.id })
        }
      } catch (err) {
        console.error('Failed to fetch servers:', err)
      }
    }

    if (isAuthenticated && servers.length === 0) {
      loadServers()
    }
  }, [isAuthenticated, servers.length, fetchServers, setCurrentServer, fetchServerDetail, setActiveView, setCurrentServerId])

  useEffect(() => {
    const handleResize = () => {
      updateBreakpoint(window.innerWidth)
    }

    handleResize()

    let resizeTimeout: ReturnType<typeof setTimeout>
    const debouncedResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', debouncedResize)
    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(resizeTimeout)
    }
  }, [updateBreakpoint])

  // Suppress unused warnings - these are used in keyboard shortcuts and effects
  void setCurrentChannel
  void setCurrentChannelId

  const showChannelSidebar = currentServerId !== null && currentBreakpoint !== 'sm'
  const showMobileChannelSidebar = currentServerId !== null && currentBreakpoint === 'sm'
  const showMemberList = currentServerId !== null && memberListVisible && ['lg', 'xl', '2xl'].includes(currentBreakpoint)

  const getGridTemplate = () => {
    const serverWidth = serverSidebarExpanded
      ? `${SIDEBAR_WIDTHS.serverExpanded}px`
      : `${SIDEBAR_WIDTHS.server}px`
    const channelWidth = showChannelSidebar ? `${SIDEBAR_WIDTHS.channel}px` : '0px'
    const memberWidth = showMemberList ? `${SIDEBAR_WIDTHS.member}px` : '0px'

    return `${serverWidth} ${channelWidth} 1fr ${memberWidth}`
  }

  return (
    <div
      className={cn(
        'h-screen w-screen bg-[var(--color-bg-base)] text-[var(--color-text-normal)] overflow-hidden',
        'grid grid-rows-[1fr]',
        'transition-[grid-template-columns] duration-300 ease-out',
      )}
      style={{
        gridTemplateColumns: getGridTemplate(),
      }}
    >
      {/* Column 1: Server icon sidebar (72px / 200px expanded) */}
      <div className="h-full overflow-hidden">
        <ServerSidebar />
      </div>

      {/* Column 2: Channel list sidebar (240px) */}
      <div
        className={cn(
          'h-full overflow-hidden',
          'transition-all duration-300 ease-out',
          'will-change-[opacity]',
          showChannelSidebar
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        )}
      >
        {showChannelSidebar && <ChannelSidebar />}
      </div>

      {/* Mobile Channel Sidebar - Fixed Overlay */}
      {showMobileChannelSidebar && (
        <>
          {/* Backdrop */}
          {mobileChannelSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-[1040]"
              onClick={closeMobileChannelSidebar}
            />
          )}
          {/* Sidebar */}
          <div
            className={cn(
              'fixed left-0 top-0 h-screen z-[1050]',
              'transition-transform duration-300 ease-out',
              mobileChannelSidebarOpen
                ? 'translate-x-0 shadow-[var(--shadow-floating)]'
                : '-translate-x-full'
            )}
          >
            <ChannelSidebar />
          </div>
        </>
      )}

      {/* Column 3: Main content area (1fr) */}
      <div className="h-full flex flex-col min-w-0 overflow-hidden bg-[var(--color-bg-base)]">
        <NavigationShell />
      </div>

      {/* Column 4: Member list (240px, collapsible) */}
      <div
        className={cn(
          'h-full overflow-hidden',
          'transition-all duration-300 ease-out',
          'will-change-[opacity]',
          showMemberList
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        )}
      >
        {showMemberList && <MemberList />}
      </div>
    </div>
  )
}
