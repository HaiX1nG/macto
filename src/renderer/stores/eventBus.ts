import type { UserStatus } from '@shared/types/kook'
import type { AppTheme } from './settingsStore'
import type { MessageResponse } from '@shared/types/api'
import type { SessionParticipant } from '@shared/types/participant'

/**
 * Type-safe event bus for cross-domain communication
 * Replaces implicit store dependencies with explicit events
 */

// === Event Map ===
export interface EventMap {
  // User events
  'user:login': { userId: string; username: string }
  'user:logout': void
  'user:statusChanged': { userId: string; status: UserStatus }
  'user:profileUpdated': { userId: string }

  // Room events
  'room:joined': { roomId: number; roomName: string }
  'room:left': { roomId: number }
  'room:created': { roomId: number; roomName: string }
  'room:deleted': { roomId: number }
  'room:participantJoined': { roomId: number; participant: SessionParticipant }
  'room:participantLeft': { roomId: number; participantId: string }
  'room:participantUpdated': { roomId: number; participantId: string; updates: Partial<SessionParticipant> }

  // Voice events
  'voice:joined': { roomId: number }
  'voice:left': { roomId: number }
  'voice:participantMuted': { roomId: number; userId: number; muted: boolean }
  'voice:participantSpeaking': { roomId: number; userId: number; speaking: boolean }
  'voice:deviceChanged': { deviceId: string; kind: 'input' | 'output' }

  // Chat events
  'chat:messageReceived': { roomId: number; message: MessageResponse }
  'chat:messageSent': { roomId: number; message: MessageResponse }
  'chat:messageUpdated': { roomId: number; messageId: number; content: string }
  'chat:messageDeleted': { roomId: number; messageId: number }
  'chat:typingStarted': { roomId: number; userId: number; username: string }
  'chat:typingStopped': { roomId: number; userId: number }
  'chat:unreadCountChanged': { roomId: number; count: number }

  // Media events
  'media:screenShareStarted': { roomId: number; userId: number }
  'media:screenShareStopped': { roomId: number; userId: number }
  'media:remoteStreamAdded': { userId: number; username: string }
  'media:remoteStreamRemoved': { userId: number }
  'media:qualityChanged': { width: number; height: number; frameRate: number }

  // Settings events
  'settings:themeChanged': { theme: AppTheme }
  'settings:audioDeviceChanged': { deviceId: string; kind: 'input' | 'output' }
  'settings:volumeChanged': { volume: number }

  // WebSocket events
  'websocket:connected': void
  'websocket:disconnected': void
  'websocket:error': { error: Error }
  'websocket:reconnecting': { attempt: number }
}

export type EventName = keyof EventMap
export type EventPayload<T extends EventName> = EventMap[T]
export type EventHandler<T extends EventName> = (payload: EventPayload<T>) => void

// === Event Bus Implementation ===
class EventBus {
  private listeners: Map<EventName, Set<(...args: unknown[]) => void>> = new Map()

  on<T extends EventName>(event: T, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler as (...args: unknown[]) => void)

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler as (...args: unknown[]) => void)
    }
  }

  off<T extends EventName>(event: T, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler as (...args: unknown[]) => void)
  }

  emit<T extends EventName>(event: T, ...payload: EventPayload<T> extends void ? [] : [EventPayload<T>]): void {
    const handlers = this.listeners.get(event)
    if (!handlers) return

    for (const handler of [...handlers]) {
      try {
        if (payload.length > 0) {
          (handler as (p: EventPayload<T>) => void)(payload[0] as EventPayload<T>)
        } else {
          (handler as () => void)()
        }
      } catch (error) {
        console.error(`[EventBus] Error in handler for "${String(event)}":`, error)
      }
    }
  }

  once<T extends EventName>(event: T, handler: EventHandler<T>): () => void {
    const wrappedHandler = (...args: unknown[]) => {
      handler(args[0] as EventPayload<T>)
      this.off(event, wrappedHandler as unknown as EventHandler<T>)
    }
    return this.on(event, wrappedHandler as unknown as EventHandler<T>)
  }

  hasListeners<T extends EventName>(event: T): boolean {
    return (this.listeners.get(event)?.size ?? 0) > 0
  }

  clear(): void {
    this.listeners.clear()
  }
}

export const eventBus = new EventBus()

// === React Hook ===
import { useEffect } from 'react'

export function useEventBus<T extends EventName>(
  event: T,
  handler: EventHandler<T>
): void {
  useEffect(() => {
    return eventBus.on(event, handler)
  }, [event, handler])
}
