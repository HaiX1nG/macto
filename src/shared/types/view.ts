/**
 * View & Navigation Types
 *
 * Defines the type contract for the page-based navigation system.
 * Each ViewId corresponds to a page component under src/renderer/pages/.
 */

/**
 * 视图标识符。
 * 每个值对应 pages/ 目录下的一个页面组件。
 */
export type ViewId = 'home' | 'channel' | 'voice' | 'screen' | 'settings'

/**
 * 传递给页面组件的导航参数。
 * 所有字段可选，不同页面按需读取。
 */
export interface ViewParams {
  /** 当前房间 ID */
  readonly roomId?: string
  /** 当前频道 ID */
  readonly channelId?: string
  /** 会话 ID（语音/屏幕共享会话） */
  readonly sessionId?: string
}
