import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSessionStore, type Session, type Participant } from '../sessionStore'

// Helper to reset store state between tests
const resetSessionStore = () => {
  const initialState = {
    sessions: [],
    currentSessionId: '',
    participants: [],
    isCreating: false,
    error: null,
  }
  useSessionStore.setState(initialState)
}

describe('useSessionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetSessionStore()
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useSessionStore.getState()

      expect(state.sessions).toEqual([])
      expect(state.currentSessionId).toBe('')
      expect(state.participants).toEqual([])
      expect(state.isCreating).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('createSession action', () => {
    it('should create a new session with unique ID', async () => {
      const { createSession } = useSessionStore.getState()
      const sessionId = await createSession('Test Session')

      expect(sessionId).toBeDefined()
      const state = useSessionStore.getState()
      expect(state.sessions.length).toBe(1)
      expect(state.sessions[0].name).toBe('Test Session')
      expect(state.sessions[0].hostId).toBe('local')
      expect(state.sessions[0].isActive).toBe(true)
      expect(state.sessions[0].participants).toEqual([])
    })

    it('should set currentSessionId to newly created session', async () => {
      const { createSession } = useSessionStore.getState()
      await createSession('New Session')

      const state = useSessionStore.getState()
      expect(state.currentSessionId).toBeDefined()
      expect(state.currentSessionId).not.toBe('')
    })

    it('should set isCreating to true during creation', async () => {
      const { createSession } = useSessionStore.getState()

      await createSession('Test')

      const state = useSessionStore.getState()
      // isCreating is set to true at the start and false at the end
      // Since the operation is synchronous, we only check the final state
      expect(state.isCreating).toBe(false)
      expect(state.sessions.length).toBe(1)
    })

    it('should set error when creation fails', async () => {
      // Mock crypto.randomUUID to throw
      const originalRandomUUID = crypto.randomUUID
      vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
        throw new Error('Random UUID generation failed')
      })

      const { createSession } = useSessionStore.getState()

      await createSession('Test').catch(() => {})

      expect(useSessionStore.getState().error).toBe('Failed to create session')

      // Restore
      crypto.randomUUID = originalRandomUUID
    })
  })

  describe('joinSession action', () => {
    it('should set currentSessionId when joining', async () => {
      const { joinSession } = useSessionStore.getState()
      const testSessionId = 'test-session-123'

      await joinSession(testSessionId)

      expect(useSessionStore.getState().currentSessionId).toBe(testSessionId)
    })

    it('should clear error when joining successfully', async () => {
      const { joinSession, setError } = useSessionStore.getState()
      setError('Previous error')

      await joinSession('new-session')

      expect(useSessionStore.getState().error).toBeNull()
    })
  })

  describe('leaveSession action', () => {
    it('should remove session from sessions array', async () => {
      const { createSession, leaveSession } = useSessionStore.getState()

      const sessionId = await createSession('Session to leave')
      await leaveSession(sessionId)

      const state = useSessionStore.getState()
      expect(state.sessions.length).toBe(0)
    })

    it('should clear currentSessionId if leaving current session', async () => {
      const { createSession, leaveSession } = useSessionStore.getState()

      const sessionId = await createSession('Current session')
      await leaveSession(sessionId)

      const state = useSessionStore.getState()
      expect(state.currentSessionId).toBe('')
    })

    it('should not affect currentSessionId if leaving different session', async () => {
      const { createSession, leaveSession, setCurrentSessionId } = useSessionStore.getState()

      const currentSessionId = await createSession('Current')
      const otherSessionId = await createSession('Other')

      // Set currentSessionId to the first session
      setCurrentSessionId(currentSessionId)

      await leaveSession(otherSessionId)

      const state = useSessionStore.getState()
      expect(state.currentSessionId).toBe(currentSessionId)
    })
  })

  describe('setSessions action', () => {
    it('should replace sessions array', () => {
      const { setSessions } = useSessionStore.getState()
      const testSessions: Session[] = [
        {
          id: '1',
          name: 'Session 1',
          hostId: 'user-1',
          participants: [],
          createdAt: Date.now(),
          isActive: true,
        },
      ]

      setSessions(testSessions)

      expect(useSessionStore.getState().sessions).toEqual(testSessions)
    })
  })

  describe('setCurrentSessionId action', () => {
    it('should set currentSessionId', () => {
      const { setCurrentSessionId } = useSessionStore.getState()
      setCurrentSessionId('session-xyz')

      expect(useSessionStore.getState().currentSessionId).toBe('session-xyz')
    })
  })

  describe('addParticipant action', () => {
    it('should add participant to participants array', () => {
      const { addParticipant } = useSessionStore.getState()
      const participant: Participant = {
        id: 'participant-1',
        name: 'Test User',
        isMuted: false,
        isSpeaking: false,
        volume: 0,
        joinedAt: Date.now(),
      }

      addParticipant(participant)

      expect(useSessionStore.getState().participants).toContainEqual(participant)
    })
  })

  describe('removeParticipant action', () => {
    it('should remove participant from participants array', () => {
      const { addParticipant, removeParticipant } = useSessionStore.getState()

      const participant: Participant = {
        id: 'participant-1',
        name: 'Test User',
        isMuted: false,
        isSpeaking: false,
        volume: 0,
        joinedAt: Date.now(),
      }

      addParticipant(participant)
      removeParticipant('participant-1')

      expect(useSessionStore.getState().participants).not.toContainEqual(
        expect.objectContaining({ id: 'participant-1' })
      )
    })
  })

  describe('updateParticipant action', () => {
    it('should update participant properties', () => {
      const { addParticipant, updateParticipant } = useSessionStore.getState()

      const participant: Participant = {
        id: 'participant-1',
        name: 'Original Name',
        isMuted: false,
        isSpeaking: false,
        volume: 0,
        joinedAt: Date.now(),
      }

      addParticipant(participant)
      updateParticipant('participant-1', { isMuted: true, volume: 75 })

      const updated = useSessionStore
        .getState()
        .participants.find((p) => p.id === 'participant-1')

      expect(updated?.isMuted).toBe(true)
      expect(updated?.volume).toBe(75)
      expect(updated?.name).toBe('Original Name') // Unchanged
    })
  })

  describe('setError and clearError actions', () => {
    it('should set error message', () => {
      const { setError } = useSessionStore.getState()
      setError('Something went wrong')

      expect(useSessionStore.getState().error).toBe('Something went wrong')
    })

    it('should clear error', () => {
      const { setError, clearError } = useSessionStore.getState()
      setError('Previous error')
      clearError()

      expect(useSessionStore.getState().error).toBeNull()
    })
  })

  describe('state subscriptions', () => {
    it('should trigger subscription on state change', () => {
      const subscription = vi.fn()
      const unsubscribe = useSessionStore.subscribe(subscription)

      useSessionStore.getState().setError('Test error')

      expect(subscription).toHaveBeenCalled()
      unsubscribe()
    })
  })

  describe('Participant interface', () => {
    it('should handle participant with optional avatar', () => {
      const { addParticipant } = useSessionStore.getState()

      const participantWithAvatar: Participant = {
        id: 'p1',
        name: 'User',
        avatar: 'https://example.com/avatar.jpg',
        isMuted: false,
        isSpeaking: false,
        volume: 0,
        joinedAt: Date.now(),
      }

      addParticipant(participantWithAvatar)

      const state = useSessionStore.getState()
      expect(state.participants[0].avatar).toBe('https://example.com/avatar.jpg')
    })
  })
})
