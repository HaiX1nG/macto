import { useEffect } from 'react'
import { ServerSidebar } from './ServerSidebar'
import { ChannelSidebar } from './ChannelSidebar'
import { MemberList } from '../members/MemberList'
import { useRoomStore } from '@renderer/stores/serverStore'
import { useAuthStore } from '@renderer/stores/authStore'
import { useThemeStore } from '@renderer/stores/themeStore'
import { useLayoutStore, SIDEBAR_WIDTHS } from '@renderer/stores/layoutStore'
import { useRoomWebSocket } from '@renderer/hooks/useRoomWebSocket'
import { useKeyboardShortcuts } from '@renderer/hooks/useKeyboardShortcuts'
import { useAudioStore } from '@renderer/stores/voiceStore'
import { NavigationShell } from '@renderer/pages'
import { cn } from '@renderer/utils/cn'

export function MainLayout() {
  const { rooms, currentRoomId, setCurrentRoomId, setCurrentChannel, fetchRooms } = useRoomStore()
  const { isAuthenticated, fetchUserInfo } = useAuthStore()
  const { initTheme } = useThemeStore()
  const {
    memberListVisible,
    serverSidebarExpanded,
    updateBreakpoint,
    currentBreakpoint,
    mobileChannelSidebarOpen,
    closeMobileChannelSidebar,
    setActiveView,
  } = useLayoutStore()
  const { setMute, isMuted } = useAudioStore()

  const currentServerId = currentRoomId

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
        // Toggle deafen - implement via store if available
        setMute(!isMuted)
      },
      priority: 10,
    },
    ...Array.from({ length: 9 }, (_, i) => ({
      id: `switchServer${i + 1}` as const,
      handler: () => {
        const room = rooms[i]
        if (room) {
          setCurrentRoomId(String(room.id))
          setCurrentChannel(String(room.id))
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
    const loadRooms = async () => {
      try {
        await fetchRooms()
        const state = useRoomStore.getState()
        if (state.rooms.length > 0) {
          const firstRoom = state.rooms[0]
          setCurrentRoomId(String(firstRoom.id))
          setCurrentChannel(String(firstRoom.id))
          setActiveView('channel', { channelId: String(firstRoom.id) })
        }
      } catch (err) {
        console.error('Failed to fetch rooms:', err)
      }
    }

    if (isAuthenticated && rooms.length === 0) {
      loadRooms()
    }
  }, [isAuthenticated, rooms.length, fetchRooms, setCurrentRoomId, setCurrentChannel, setActiveView])

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

  const showChannelSidebar = currentServerId && currentBreakpoint !== 'sm'
  const showMobileChannelSidebar = currentServerId && currentBreakpoint === 'sm'
  const showMemberList = currentServerId && memberListVisible && ['lg', 'xl', '2xl'].includes(currentBreakpoint)

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
      <div className="h-full overflow-hidden">
        <ServerSidebar />
      </div>

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

      <div className="h-full flex flex-col min-w-0 overflow-hidden bg-[var(--color-bg-base)]">
        <NavigationShell />
      </div>

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