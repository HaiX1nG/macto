import { createContext, useContext, useEffect, useState } from 'react'
import { useRoomStore, type Session } from '@renderer/stores/roomStore'
import type { SessionParticipant } from '@shared/types'
import type { CreateRoomRequest, JoinRoomRequest, RoomListRequest, RoomInfoResponse } from '@shared/types/api'

interface SessionContextType {
  // Room-based state
  rooms: RoomInfoResponse[]
  currentRoom: RoomInfoResponse | null
  currentRoomId: string
  participants: SessionParticipant[]
  isLoading: boolean
  isCreating: boolean
  error: string | null

  // Room actions
  fetchRooms: (params?: RoomListRequest) => Promise<void>
  createRoom: (data: CreateRoomRequest) => Promise<RoomInfoResponse>
  joinRoom: (roomId: number, data?: JoinRoomRequest) => Promise<void>
  leaveRoom: (roomId: number) => Promise<void>
  setCurrentRoom: (room: RoomInfoResponse | null) => void

  // Participant actions
  addParticipant: (participant: SessionParticipant) => void
  removeParticipant: (participantId: string) => void
  updateParticipant: (participantId: string, updates: Partial<SessionParticipant>) => void

  // Legacy session-based API (for backward compatibility)
  sessions: Session[]
  currentSessionId: string
  fetchSessions: () => Promise<void>
  createSession: (name: string, roomType?: number, isPrivate?: boolean, maxParticipants?: number) => Promise<string>
  joinSession: (sessionId: string, inviteCode?: string) => Promise<void>
  leaveSession: (sessionId: string) => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

/**
 * Convert RoomInfoResponse to legacy Session format
 */
function roomToSession(room: RoomInfoResponse): Session {
  return {
    id: String(room.id),
    name: room.roomName,
    hostId: String(room.hostUserId),
    participants: [],
    createdAt: new Date(room.createdAt).getTime(),
    isActive: true,
  }
}

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    rooms,
    currentRoom,
    currentRoomId,
    participants,
    isLoading,
    isCreating,
    error,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    setCurrentRoom,
    addParticipant,
    removeParticipant,
    updateParticipant,
  } = useRoomStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Convert rooms to sessions for backward compatibility
  const sessions: Session[] = rooms.map(roomToSession)
  const currentSessionId = currentRoomId

  // Legacy session-based API wrappers
  const fetchSessions = async () => {
    await fetchRooms()
  }

  const createSession = async (name: string, roomType = 2, isPrivate = false, maxParticipants = 10): Promise<string> => {
    const room = await createRoom({
      roomName: name,
      roomType: roomType as 1 | 2,
      isPrivate,
      maxParticipants,
    })
    return String(room.id)
  }

  const joinSession = async (sessionId: string, inviteCode?: string): Promise<void> => {
    await joinRoom(Number(sessionId), inviteCode ? { inviteCode } : undefined)
  }

  const leaveSession = async (sessionId: string): Promise<void> => {
    await leaveRoom(Number(sessionId))
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <SessionContext.Provider value={{
      // Room-based state
      rooms,
      currentRoom,
      currentRoomId,
      participants,
      isLoading,
      isCreating,
      error,

      // Room actions
      fetchRooms,
      createRoom,
      joinRoom,
      leaveRoom,
      setCurrentRoom,

      // Participant actions
      addParticipant,
      removeParticipant,
      updateParticipant,

      // Legacy session-based API
      sessions,
      currentSessionId,
      fetchSessions,
      createSession,
      joinSession,
      leaveSession,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
