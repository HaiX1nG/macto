import { useEffect } from 'react'
import { ServerSidebar } from './ServerSidebar'
import { ChannelSidebar } from './ChannelSidebar'
import { ChatView } from '../chat/ChatView'
import { MemberList } from '../members/MemberList'
import { RemoteScreensContainer } from '../screen/RemoteScreensContainer'
import { useServerStore } from '@renderer/stores/serverStore'
import { useAuthStore } from '@renderer/stores/authStore'
import { useThemeStore } from '@renderer/stores/themeStore'
import { useLayoutStore } from '@renderer/stores/layoutStore'
import { useRoomWebSocket } from '@renderer/hooks/useRoomWebSocket'
import { roomService } from '@renderer/services'
import { cn } from '@renderer/utils/cn'
import type { RoomInfoResponse } from '@shared/types/api'

// Convert API room to local server format
function roomToServer(room: RoomInfoResponse) {
  return {
    id: String(room.id),
    name: room.roomName,
    icon: undefined,
    banner: undefined,
    description: undefined,
    ownerId: String(room.hostUserId),
    channels: [
      { id: String(room.id), serverId: String(room.id), name: '聊天室', type: 'text' as const, position: 0, topic: '' },
      { id: `${room.id}-voice`, serverId: String(room.id), name: '语音室', type: 'voice' as const, position: 1 },
    ],
    roles: [],
    memberCount: room.participantCount,
    createdAt: new Date(room.createdAt).getTime(),
  }
}

export function MainLayout() {
  const { currentServerId, servers, setServers } = useServerStore()
  const { isAuthenticated, fetchUserInfo } = useAuthStore()
  const { initTheme } = useThemeStore()
  const {
    memberListVisible,
    updateBreakpoint,
    currentBreakpoint
  } = useLayoutStore()

  // Connect to room WebSocket to set user online status
  useRoomWebSocket()

  // Initialize theme
  useEffect(() => {
    initTheme()
  }, [initTheme])

  // Fetch user info if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserInfo()
    }
  }, [isAuthenticated, fetchUserInfo])

  // Fetch rooms from API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const rooms = await roomService.getRoomList()
        const convertedServers = rooms.map(roomToServer)
        setServers(convertedServers)

        if (convertedServers.length > 0) {
          useServerStore.getState().setCurrentServer(convertedServers[0].id)
          const textChannel = convertedServers[0].channels.find(c => c.type === 'text')
          if (textChannel) {
            useServerStore.getState().setCurrentChannel(textChannel.id)
          }
        }
      } catch (err) {
        console.error('Failed to fetch rooms:', err)
      }
    }

    if (isAuthenticated && servers.length === 0) {
      fetchRooms()
    }
  }, [isAuthenticated, servers.length, setServers])

  // Handle responsive breakpoint updates
  useEffect(() => {
    const handleResize = () => {
      updateBreakpoint(window.innerWidth)
    }

    // Initial check
    handleResize()

    // Add resize listener with debounce
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

  // Compute sidebar visibility based on breakpoint
  const showChannelSidebar = currentServerId && currentBreakpoint !== 'sm'
  const showMemberList = currentServerId && memberListVisible && ['lg', 'xl', '2xl'].includes(currentBreakpoint)

  // Dynamic grid template based on visible panels
  const getGridTemplate = () => {
    // Server sidebar is always visible on md+ screens
    const serverWidth = '72px'
    // Channel sidebar width
    const channelWidth = showChannelSidebar ? '240px' : '0px'
    // Member list width
    const memberWidth = showMemberList ? '240px' : '0px'

    return `${serverWidth} ${channelWidth} 1fr ${memberWidth}`
  }

  return (
    <div
      className={cn(
        'h-screen w-screen bg-[var(--color-bg-base)] text-[var(--color-text-normal)] overflow-hidden',
        'grid grid-rows-[1fr]',
      )}
      style={{
        gridTemplateColumns: getGridTemplate(),
        transition: 'grid-template-columns 200ms ease-in-out',
      }}
    >
      {/* Server icon bar - leftmost */}
      <div className="h-full overflow-hidden">
        <ServerSidebar />
      </div>

      {/* Channel list */}
      <div
        className={cn(
          'h-full overflow-hidden',
          'transition-opacity duration-200',
          showChannelSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {showChannelSidebar && <ChannelSidebar />}
      </div>

      {/* Main content area */}
      <div className="h-full flex flex-col min-w-0 overflow-hidden">
        {/* Remote screen shares */}
        <RemoteScreensContainer />
        <ChatView />
      </div>

      {/* Member list */}
      <div
        className={cn(
          'h-full overflow-hidden',
          'transition-opacity duration-200',
          showMemberList ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {showMemberList && <MemberList />}
      </div>
    </div>
  )
}
