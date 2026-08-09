import { createContext, useContext, useEffect, useState } from 'react'
import { useServerStore } from '@renderer/stores/serverStore'
import type { Server, ServerDetail, ServerMember } from '@shared/types/server'
import type { CreateServerRequest, JoinServerRequest } from '@shared/types/server'

/**
 * SessionContext (legacy compatibility shim)
 *
 * The old session/room concept has been replaced by the KOOK-style
 * server/channel architecture. This context wraps the new serverStore
 * and uiStore to provide a backward-compatible API for components
 * that haven't been migrated yet.
 */

interface SessionContextType {
  // Server-based state (replaces old room state)
  servers: Server[]
  currentServer: ServerDetail | null
  currentServerId: number | null
  members: ServerMember[]
  isLoading: boolean
  error: string | null

  // Server actions
  fetchServers: () => Promise<void>
  fetchServerDetail: (id: number) => Promise<void>
  createServer: (data: CreateServerRequest) => Promise<ServerDetail>
  joinServer: (id: number, data: JoinServerRequest) => Promise<void>
  leaveServer: (id: number) => Promise<void>
  setCurrentServer: (id: number) => void
  fetchMembers: (serverId: number) => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    servers,
    currentServer,
    currentServerId,
    members,
    isLoading,
    error,
    fetchServers,
    fetchServerDetail,
    createServer,
    joinServer,
    leaveServer,
    setCurrentServer,
    fetchMembers,
  } = useServerStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <SessionContext.Provider
      value={{
        servers,
        currentServer,
        currentServerId,
        members,
        isLoading,
        error,
        fetchServers,
        fetchServerDetail,
        createServer,
        joinServer,
        leaveServer,
        setCurrentServer,
        fetchMembers,
      }}
    >
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
