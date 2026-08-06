/**
 * useKeyboardShortcuts Hook
 *
 * Provides global keyboard shortcut registration with conflict detection
 * and support for custom shortcut recording mode.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import {
  type ShortcutDefinition,
  type ShortcutCategory,
  normalizeKeys,
  keysFromEvent,
  eventMatchesShortcut,
  DEFAULT_SHORTCUTS,
  createInitialShortcuts,
} from '@renderer/config/shortcuts'

export type ShortcutHandler = (event: KeyboardEvent) => void

export interface ShortcutRegistration {
  /** The shortcut ID from DEFAULT_SHORTCUTS */
  id: string
  /** Handler function called when the shortcut is triggered */
  handler: ShortcutHandler
  /** Optional condition - shortcut only works when this returns true */
  condition?: () => boolean
  /** Priority - higher priority handlers are checked first */
  priority?: number
}

export interface ShortcutConflict {
  /** The shortcut keys that conflict */
  keys: string
  /** The IDs of shortcuts that use these keys */
  shortcutIds: string[]
  /** Human-readable description of the conflict */
  description: string
}

export interface RecordingState {
  /** Whether the system is in recording mode */
  isRecording: boolean
  /** The ID of the shortcut being recorded */
  recordingId: string | null
  /** The keys captured during recording */
  recordedKeys: string | null
}

/** Store for persistent shortcut state */
const STORAGE_KEY = 'macto-keyboard-shortcuts'

/** Load saved shortcuts from localStorage */
function loadSavedShortcuts(): Map<string, string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, string>
      return new Map(Object.entries(parsed))
    }
  } catch {
    // Ignore parse errors
  }
  return new Map()
}

/** Save shortcuts to localStorage */
function saveShortcuts(shortcuts: Map<string, string>): void {
  try {
    const obj = Object.fromEntries(shortcuts)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch {
    // Ignore storage errors
  }
}

/** Global registry of active shortcut handlers */
class ShortcutRegistry {
  private handlers: Map<string, ShortcutRegistration[]>
  private customShortcuts: Map<string, string>
  private recordingState: RecordingState
  private recordingCallback: ((keys: string) => void) | null

  constructor() {
    this.handlers = new Map()
    this.customShortcuts = loadSavedShortcuts()
    this.recordingState = {
      isRecording: false,
      recordingId: null,
      recordedKeys: null,
    }
    this.recordingCallback = null
  }

  /** Get the effective keys for a shortcut (respects custom overrides) */
  getEffectiveKeys(shortcutId: string): string | undefined {
    const custom = this.customShortcuts.get(shortcutId)
    if (custom) return custom

    const defaultShortcut = DEFAULT_SHORTCUTS.find(s => s.id === shortcutId)
    return defaultShortcut?.defaultKeys
  }

  /** Register a handler for a shortcut */
  register(registration: ShortcutRegistration): () => void {
    const keys = this.getEffectiveKeys(registration.id)
    if (!keys) {
      console.warn(`[ShortcutRegistry] Unknown shortcut ID: ${registration.id}`)
      return () => {}
    }

    const normalizedKeys = normalizeKeys(keys)
    const existing = this.handlers.get(normalizedKeys) || []
    this.handlers.set(normalizedKeys, [...existing, registration])

    // Sort by priority (higher first)
    this.handlers.set(
      normalizedKeys,
      [...existing, registration].sort((a, b) => (b.priority || 0) - (a.priority || 0))
    )

    return () => {
      this.unregister(registration.id, normalizedKeys)
    }
  }

  /** Unregister a handler */
  unregister(id: string, keys?: string): void {
    if (keys) {
      const normalizedKeys = normalizeKeys(keys)
      const existing = this.handlers.get(normalizedKeys) || []
      this.handlers.set(
        normalizedKeys,
        existing.filter(h => h.id !== id)
      )
    } else {
      // Search all keys
      for (const [key, handlers] of this.handlers) {
        const filtered = handlers.filter(h => h.id !== id)
        if (filtered.length === 0) {
          this.handlers.delete(key)
        } else {
          this.handlers.set(key, filtered)
        }
      }
    }
  }

  /** Check if a shortcut is registered */
  isRegistered(keys: string): boolean {
    return this.handlers.has(normalizeKeys(keys))
  }

  /** Handle a keyboard event */
  handleEvent(event: KeyboardEvent): boolean {
    // If in recording mode, capture the keys
    if (this.recordingState.isRecording) {
      event.preventDefault()
      event.stopPropagation()

      const keys = keysFromEvent(event)
      if (keys && keys !== 'mod' && keys !== 'shift' && keys !== 'alt') {
        this.recordingState.recordedKeys = keys
        this.recordingCallback?.(keys)
        this.stopRecording()
      }
      return true
    }

    const keys = keysFromEvent(event)
    const normalizedKeys = normalizeKeys(keys)
    const handlers = this.handlers.get(normalizedKeys)

    if (handlers && handlers.length > 0) {
      for (const registration of handlers) {
        if (!registration.condition || registration.condition()) {
          event.preventDefault()
          event.stopPropagation()
          registration.handler(event)
          return true
        }
      }
    }

    return false
  }

  /** Start recording mode for a shortcut */
  startRecording(id: string, callback: (keys: string) => void): void {
    this.recordingState = {
      isRecording: true,
      recordingId: id,
      recordedKeys: null,
    }
    this.recordingCallback = callback
  }

  /** Stop recording mode */
  stopRecording(): void {
    this.recordingState = {
      isRecording: false,
      recordingId: null,
      recordedKeys: this.recordingState.recordedKeys,
    }
    this.recordingCallback = null
  }

  /** Get current recording state */
  getRecordingState(): RecordingState {
    return { ...this.recordingState }
  }

  /** Get all registered shortcuts */
  getRegisteredShortcuts(): ShortcutDefinition[] {
    const result: ShortcutDefinition[] = []
    for (const shortcut of DEFAULT_SHORTCUTS) {
      const customKeys = this.customShortcuts.get(shortcut.id)
      result.push({
        ...shortcut,
        currentKeys: customKeys || shortcut.defaultKeys,
      })
    }
    return result
  }

  /** Update a shortcut's key binding */
  updateShortcut(id: string, keys: string | null): void {
    if (keys === null) {
      this.customShortcuts.delete(id)
    } else {
      this.customShortcuts.set(id, keys)
    }
    saveShortcuts(this.customShortcuts)
  }

  /** Reset a shortcut to its default */
  resetToDefault(id: string): void {
    this.customShortcuts.delete(id)
    saveShortcuts(this.customShortcuts)
  }

  /** Reset all shortcuts to defaults */
  resetAllToDefaults(): void {
    this.customShortcuts.clear()
    saveShortcuts(this.customShortcuts)
  }

  /** Detect conflicts between shortcuts */
  detectConflicts(): ShortcutConflict[] {
    const conflicts: ShortcutConflict[] = []
    const keyMap = new Map<string, string[]>()

    // Build map of keys -> shortcut IDs
    for (const shortcut of DEFAULT_SHORTCUTS) {
      const keys = this.customShortcuts.get(shortcut.id) || shortcut.defaultKeys
      const normalizedKeys = normalizeKeys(keys)
      const existing = keyMap.get(normalizedKeys) || []
      keyMap.set(normalizedKeys, [...existing, shortcut.id])
    }

    // Find conflicts (same keys used by multiple shortcuts)
    for (const [keys, ids] of keyMap) {
      if (ids.length > 1) {
        const shortcutNames = ids
          .map(id => DEFAULT_SHORTCUTS.find(s => s.id === id)?.description || id)
          .join(', ')

        conflicts.push({
          keys,
          shortcutIds: ids,
          description: `快捷键冲突: ${shortcutNames} 使用了相同的按键组合`,
        })
      }
    }

    return conflicts
  }
}

// Singleton instance
const registry = new ShortcutRegistry()

/**
 * React Hook for keyboard shortcuts
 *
 * @param registrations - Array of shortcut registrations
 * @returns Object with shortcut management methods
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     id: 'openSearch',
 *     handler: () => setSearchOpen(true),
 *     condition: () => !isModalOpen,
 *   },
 *   {
 *     id: 'toggleMute',
 *     handler: () => toggleMute(),
 *     priority: 10,
 *   },
 * ])
 * ```
 */
export function useKeyboardShortcuts(registrations: ShortcutRegistration[]) {
  const [conflicts, setConflicts] = useState<ShortcutConflict[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>(createInitialShortcuts)

  // Store cleanup functions
  const cleanupRef = useRef<(() => void)[]>([])

  // Register/unregister shortcuts
  useEffect(() => {
    // Clean up previous registrations
    cleanupRef.current.forEach(cleanup => cleanup())
    cleanupRef.current = []

    // Register new handlers
    const cleanups = registrations.map(registration =>
      registry.register(registration)
    )
    cleanupRef.current = cleanups

    return () => {
      cleanups.forEach(cleanup => cleanup())
    }
  }, [registrations])

  // Global keyboard event listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      registry.handleEvent(event)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Sync shortcuts state with registry on mount (picks up persisted customizations)
  useEffect(() => {
    setShortcuts(registry.getRegisteredShortcuts())
  }, [])

  /** Start recording a new shortcut */
  const startRecording = useCallback((id: string): Promise<string> => {
    return new Promise((resolve) => {
      setIsRecording(true)
      setRecordingId(id)
      registry.startRecording(id, (keys) => {
        setIsRecording(false)
        setRecordingId(null)
        resolve(keys)
      })
    })
  }, [])

  /** Stop recording */
  const stopRecording = useCallback(() => {
    registry.stopRecording()
    setIsRecording(false)
    setRecordingId(null)
  }, [])

  /** Update a shortcut's key binding */
  const updateShortcut = useCallback((id: string, keys: string | null) => {
    registry.updateShortcut(id, keys)
    setShortcuts(registry.getRegisteredShortcuts())
  }, [])

  /** Reset a shortcut to its default */
  const resetShortcut = useCallback((id: string) => {
    registry.resetToDefault(id)
    setShortcuts(registry.getRegisteredShortcuts())
  }, [])

  /** Reset all shortcuts to defaults */
  const resetAllShortcuts = useCallback(() => {
    registry.resetAllToDefaults()
    setShortcuts(registry.getRegisteredShortcuts())
  }, [])

  /** Get all registered shortcuts with their current bindings */
  const getShortcuts = useCallback(() => {
    return registry.getRegisteredShortcuts()
  }, [])

  /** Detect conflicts */
  const detectConflicts = useCallback(() => {
    const detected = registry.detectConflicts()
    setConflicts(detected)
    return detected
  }, [])

  return {
    shortcuts,
    conflicts,
    isRecording,
    recordingId,
    startRecording,
    stopRecording,
    updateShortcut,
    resetShortcut,
    resetAllShortcuts,
    getShortcuts,
    detectConflicts,
  }
}

/** Standalone function to check if a key event matches a specific shortcut */
export function isShortcutMatch(event: KeyboardEvent, shortcutId: string): boolean {
  const shortcut = DEFAULT_SHORTCUTS.find(s => s.id === shortcutId)
  if (!shortcut) return false
  return eventMatchesShortcut(event, shortcut.defaultKeys)
}

/** Get the display label for a shortcut category */
export function getCategoryLabel(category: ShortcutCategory): string {
  const labels: Record<ShortcutCategory, string> = {
    navigation: '导航',
    voice: '语音',
    chat: '聊天',
    general: '通用',
  }
  return labels[category]
}
