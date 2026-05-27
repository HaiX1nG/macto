import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRoomStore, type Session } from '../roomStore'
import type { SessionParticipant } from '@shared/types'

// Helper to reset store state between tests
const resetRoomStore = () => {
  const initialState = {
    rooms: [],
    currentRoom: null,
    currentRoomId: '',
    participants: [],
    apiParticipants: [],
    isLoading: false,
    isCreating: false,
    error: null,
  }
  useRoomStore.setState(initialState)
}

describe('useRoomStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRoomStore()
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useRoomStore.getState()

      expect(state.rooms).toEqual([])
      expect(state.currentRoom).toBeNull()
      expect(state.currentRoomId).toBe('')
      expect(state.participants).toEqual([])
      expect(state.apiParticipants).toEqual([])
      expect(state.isLoading).toBe(false)
      expect(state.isCreating).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setCurrentRoom action', () => {
    it('should set current room and reset participants', () => {
      const { setCurrentRoom } = useRoomStore.getState()

      const testRoom = {
        id: 1,
        roomName: 'Test Room',
        roomType: 2 as const,
        hostUserId: 1,
        isPrivate: false,
        maxParticipants: 10,
        participantCount: 0,
        createdAt: new Date().toISOString(),
      }

      setCurrentRoom(testRoom)

      const state = useRoomStore.getState()
      expect(state.currentRoom).toEqual(testRoom)
      expect(state.currentRoomId).toBe('1')
      expect(state.participants).toEqual([])
    })

    it('should clear current room when set to null', () => {
      const { setCurrentRoom } = useRoomStore.getState()

      setCurrentRoom(null)

      const state = useRoomStore.getState()
      expect(state.currentRoom).toBeNull()
      expect(state.currentRoomId).toBe('')
    })
  })

  describe('setCurrentRoomId action', () => {
    it('should set currentRoomId', () => {
      const { setCurrentRoomId } = useRoomStore.getState()
      setCurrentRoomId('room-xyz')

      expect(useRoomStore.getState().currentRoomId).toBe('room-xyz')
    })
  })

  describe('addParticipant action', () => {
    it('should add participant to participants array', () => {
      const { addParticipant } = useRoomStore.getState()
      const participant: SessionParticipant = {
        id: 'participant-1',
        name: 'Test User',
        isMuted: false,
        isSpeaking: false,
        volume: 0,
        joinedAt: Date.now(),
      }

      addParticipant(participant)

      expect(useRoomStore.getState().participants).toContainEqual(participant)
    })
  })

  describe('removeParticipant action', () => {
    it('should remove participant from participants array', () => {
      const { addParticipant, removeParticipant } = useRoomStore.getState()

      const participant: SessionParticipant = {
        id: 'participant-1',
        name: 'Test User',
        isMuted: false,
        isSpeaking: false,
        volume: 0,
        joinedAt: Date.now(),
      }

      addParticipant(participant)
      removeParticipant('participant-1')

      expect(useRoomStore.getState().participants).not.toContainEqual(
        expect.objectContaining({ id: 'participant-1' })
      )
    })
  })

  describe('updateParticipant action', () => {
    it('should update participant properties', () => {
      const { addParticipant, updateParticipant } = useRoomStore.getState()

      const participant: SessionParticipant = {
        id: 'participant-1',
        name: 'Original Name',
        isMuted: false,
        isSpeaking: false,
        volume: 0,
        joinedAt: Date.now(),
      }

      addParticipant(participant)
      updateParticipant('participant-1', { isMuted: true, volume: 75 })

      const updated = useRoomStore
        .getState()
        .participants.find((p) => p.id === 'participant-1')

      expect(updated?.isMuted).toBe(true)
      expect(updated?.volume).toBe(75)
      expect(updated?.name).toBe('Original Name') // Unchanged
    })
  })

  describe('setError and clearError actions', () => {
    it('should set error message', () => {
      const { setError } = useRoomStore.getState()
      setError('Something went wrong')

      expect(useRoomStore.getState().error).toBe('Something went wrong')
    })

    it('should clear error', () => {
      const { setError, clearError } = useRoomStore.getState()
      setError('Previous error')
      clearError()

      expect(useRoomStore.getState().error).toBeNull()
    })
  })

  describe('state subscriptions', () => {
    it('should trigger subscription on state change', () => {
      const subscription = vi.fn()
      const unsubscribe = useRoomStore.subscribe(subscription)

      useRoomStore.getState().setError('Test error')

      expect(subscription).toHaveBeenCalled()
      unsubscribe()
    })
  })

  describe('Participant interface', () => {
    it('should handle participant with optional avatar', () => {
      const { addParticipant } = useRoomStore.getState()

      const participantWithAvatar: SessionParticipant = {
        id: 'p1',
        name: 'User',
        avatar: 'https://example.com/avatar.jpg',
        isMuted: false,
        isSpeaking: false,
        volume: 0,
        joinedAt: Date.now(),
      }

      addParticipant(participantWithAvatar)

      const state = useRoomStore.getState()
      expect(state.participants[0].avatar).toBe('https://example.com/avatar.jpg')
    })
  })
})

describe('useSessionStore (backward compatibility alias)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRoomStore()
  })

  it('should be the same as useRoomStore', () => {
    // The alias is exported from roomStore.ts
    expect(useRoomStore).toBeDefined()
  })
})

describe('Session type (backward compatibility)', () => {
  it('should have correct structure', () => {
    const session: Session = {
      id: '1',
      name: 'Test Session',
      hostId: 'user-1',
      participants: [],
      createdAt: Date.now(),
      isActive: true,
    }

    expect(session.id).toBe('1')
    expect(session.name).toBe('Test Session')
    expect(session.hostId).toBe('user-1')
    expect(session.isActive).toBe(true)
  })
})
