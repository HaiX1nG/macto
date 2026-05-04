import { createContext, useContext, useEffect, useState } from 'react'
import { useSessionStore, type Session, type Participant } from '@renderer/stores/sessionStore'

interface SessionContextType {
  sessions: Session[]
  currentSessionId: string
  participants: Participant[]
  isCreating: boolean
  error: string | null
  fetchSessions: () => Promise<void>
  createSession: (name: string, roomType?: number, isPrivate?: boolean, maxParticipants?: number) => Promise<string>
  joinSession: (sessionId: string, inviteCode?: string) => Promise<void>
  leaveSession: (sessionId: string) => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    sessions,
    currentSessionId,
    participants,
    isCreating,
    error,
    fetchSessions,
    createSession,
    joinSession,
    leaveSession,
  } = useSessionStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <SessionContext.Provider value={{
      sessions,
      currentSessionId,
      participants,
      isCreating,
      error,
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
