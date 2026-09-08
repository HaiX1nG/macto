/**
 * View & Navigation Types
 *
 * Defines the type contract for the page-based navigation system.
 * Each ViewId corresponds to a page component under src/renderer/pages/.
 */

/**
 * View identifiers for the KOOK-style navigation system.
 * Each value corresponds to a page component in pages/.
 */
export type ViewId =
  | 'server-home'
  | 'text-channel'
  | 'voice-channel'
  | 'settings'
  | 'friends'

/**
 * Navigation parameters passed to page components.
 * All fields optional; different pages read what they need.
 */
export interface ViewParams {
  /** Current server ID */
  readonly serverId?: number
  /** Current channel ID */
  readonly channelId?: number
}
