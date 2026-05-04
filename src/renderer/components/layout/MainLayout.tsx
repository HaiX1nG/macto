import { useEffect } from 'react'
import { ServerSidebar } from './ServerSidebar'
import { ChannelSidebar } from './ChannelSidebar'
import { ChatView } from '../chat/ChatView'
import { MemberList } from '../members/MemberList'
import { useServerStore } from '@renderer/stores/serverStore'
import { useAuthStore } from '@renderer/stores/authStore'
import { useThemeStore } from '@renderer/stores/themeStore'
import { roomService } from '@renderer/services'
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
      { id: `${room.id}-text`, serverId: String(room.id), name: '聊天室', type: 'text' as const, position: 0 },
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

        // Select first server and channel by default
        if (convertedServers.length > 0) {
          useServerStore.getState().setCurrentServer(convertedServers[0].id)
          const firstTextChannel = convertedServers[0].channels.find(c => c.type === 'text')
          if (firstTextChannel) {
            useServerStore.getState().setCurrentChannel(firstTextChannel.id)
          }
        }
      } catch (err) {
        console.error('Failed to fetch rooms:', err)
      }
    }

    // Only fetch if authenticated and no servers loaded
    if (isAuthenticated && servers.length === 0) {
      fetchRooms()
    }
  }, [isAuthenticated, servers.length, setServers])

  return (
    <div className="flex h-screen w-screen bg-[var(--color-bg-base)] text-[var(--color-text-normal)] overflow-hidden">
      {/* Server icon bar - leftmost */}
      <ServerSidebar />

      {/* Channel list */}
      {currentServerId && <ChannelSidebar />}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatView />
      </div>

      {/* Member list */}
      {currentServerId && <MemberList />}
    </div>
  )
}
