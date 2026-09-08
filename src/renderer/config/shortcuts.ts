/**
 * Keyboard Shortcuts Configuration
 *
 * Defines default shortcut mappings with platform-specific key bindings.
 * Supports macOS, Windows, and Linux with appropriate modifier keys.
 */

export type Platform = 'mac' | 'win' | 'linux'

export interface ShortcutDefinition {
  /** Unique identifier for the shortcut */
  id: string
  /** Human-readable description */
  description: string
  /** Category for grouping in settings */
  category: ShortcutCategory
  /** Default key combination (platform-agnostic format) */
  defaultKeys: string
  /** Current key combination (customized by user) */
  currentKeys?: string
}

export type ShortcutCategory =
  | 'navigation'
  | 'voice'
  | 'chat'
  | 'general'

export interface ShortcutAction {
  id: string
  description: string
  category: ShortcutCategory
  defaultKeys: string
}

export const SHORTCUT_CATEGORIES: Record<ShortcutCategory, { label: string; order: number }> = {
  navigation: { label: '导航', order: 0 },
  voice: { label: '语音', order: 1 },
  chat: { label: '聊天', order: 2 },
  general: { label: '通用', order: 3 },
}

/** Detect current platform */
export function getPlatform(): Platform {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('mac') || userAgent.includes('darwin')) return 'mac'
  if (userAgent.includes('win')) return 'win'
  return 'linux'
}

/** Check if current platform is macOS */
export function isMac(): boolean {
  return getPlatform() === 'mac'
}

/**
 * Default shortcuts configuration.
 * Keys are stored in a normalized format: modifiers + key.
 * Format: "mod+shift+key" or "key" for simple keys.
 * "mod" is mapped to Cmd on macOS and Ctrl on Windows/Linux.
 */
export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  // Navigation
  {
    id: 'openSearch',
    description: '打开搜索',
    category: 'navigation',
    defaultKeys: 'mod+k',
  },
  {
    id: 'switchServer1',
    description: '切换到服务器 1',
    category: 'navigation',
    defaultKeys: 'mod+1',
  },
  {
    id: 'switchServer2',
    description: '切换到服务器 2',
    category: 'navigation',
    defaultKeys: 'mod+2',
  },
  {
    id: 'switchServer3',
    description: '切换到服务器 3',
    category: 'navigation',
    defaultKeys: 'mod+3',
  },
  {
    id: 'switchServer4',
    description: '切换到服务器 4',
    category: 'navigation',
    defaultKeys: 'mod+4',
  },
  {
    id: 'switchServer5',
    description: '切换到服务器 5',
    category: 'navigation',
    defaultKeys: 'mod+5',
  },
  {
    id: 'switchServer6',
    description: '切换到服务器 6',
    category: 'navigation',
    defaultKeys: 'mod+6',
  },
  {
    id: 'switchServer7',
    description: '切换到服务器 7',
    category: 'navigation',
    defaultKeys: 'mod+7',
  },
  {
    id: 'switchServer8',
    description: '切换到服务器 8',
    category: 'navigation',
    defaultKeys: 'mod+8',
  },
  {
    id: 'switchServer9',
    description: '切换到服务器 9',
    category: 'navigation',
    defaultKeys: 'mod+9',
  },

  // Voice
  {
    id: 'toggleMute',
    description: '切换静音',
    category: 'voice',
    defaultKeys: 'mod+shift+m',
  },
  {
    id: 'toggleDeafen',
    description: '切换耳机（取消声音输出）',
    category: 'voice',
    defaultKeys: 'mod+shift+d',
  },
  {
    id: 'pushToTalk',
    description: '按住说话（推送对讲）',
    category: 'voice',
    defaultKeys: 'mod+`',
  },

  // Chat
  {
    id: 'focusMessageInput',
    description: '聚焦到消息输入框',
    category: 'chat',
    defaultKeys: 'mod+n',
  },

  // General
  {
    id: 'closeModal',
    description: '关闭弹窗 / 取消',
    category: 'general',
    defaultKeys: 'escape',
  },
]

/** Create a map of shortcuts by ID for quick lookup */
export function createShortcutsMap(shortcuts: ShortcutDefinition[]): Map<string, ShortcutDefinition> {
  return new Map(shortcuts.map(s => [s.id, s]))
}

/**
 * Normalize a key string to internal format.
 * Converts platform-specific modifiers to normalized format.
 */
export function normalizeKeys(keys: string): string {
  return keys
    .toLowerCase()
    .replace(/command|cmd|⌘/g, 'mod')
    .replace(/control|ctrl/g, 'mod')
    .replace(/shift/g, 'shift')
    .replace(/alt|option|⌥/g, 'alt')
    .replace(/\s+/g, '')
    .split('+')
    .sort((a, b) => {
      const order = { mod: 0, shift: 1, alt: 2 }
      const aOrder = order[a as keyof typeof order] ?? 3
      const bOrder = order[b as keyof typeof order] ?? 3
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.localeCompare(b)
    })
    .join('+')
}

/**
 * Convert normalized keys to display format for the current platform.
 */
export function formatKeysForDisplay(keys: string): string {
  const platform = getPlatform()
  const parts = keys.split('+')

  return parts
    .map(part => {
      switch (part) {
        case 'mod':
          return platform === 'mac' ? '⌘' : 'Ctrl'
        case 'shift':
          return platform === 'mac' ? '⇧' : 'Shift'
        case 'alt':
          return platform === 'mac' ? '⌥' : 'Alt'
        default:
          return part.charAt(0).toUpperCase() + part.slice(1)
      }
    })
    .join(' + ')
}

/**
 * Convert display format back to normalized keys.
 * Used when capturing user input.
 */
export function keysFromEvent(event: KeyboardEvent): string {
  const parts: string[] = []

  if (event.metaKey || event.ctrlKey) {
    parts.push('mod')
  }
  if (event.shiftKey) {
    parts.push('shift')
  }
  if (event.altKey) {
    parts.push('alt')
  }

  // Get the key, handling special cases
  let key = event.key.toLowerCase()

  // Ignore modifier keys themselves
  if (['control', 'alt', 'shift', 'meta', 'os'].includes(key)) {
    return parts.join('+')
  }

  // Handle special keys
  if (key === ' ') key = 'space'
  if (key === 'escape') key = 'esc'
  if (key === 'arrowup') key = 'up'
  if (key === 'arrowdown') key = 'down'
  if (key === 'arrowleft') key = 'left'
  if (key === 'arrowright') key = 'right'

  parts.push(key)

  return parts.join('+')
}

/** Check if a keyboard event matches a given shortcut keys */
export function eventMatchesShortcut(event: KeyboardEvent, keys: string): boolean {
  const eventKeys = keysFromEvent(event)
  return normalizeKeys(eventKeys) === normalizeKeys(keys)
}

/** Get the default shortcut by ID */
export function getDefaultShortcut(id: string): ShortcutDefinition | undefined {
  return DEFAULT_SHORTCUTS.find(s => s.id === id)
}

/** Create initial shortcuts state with defaults */
export function createInitialShortcuts(): ShortcutDefinition[] {
  return DEFAULT_SHORTCUTS.map(s => ({
    ...s,
    currentKeys: s.defaultKeys,
  }))
}
