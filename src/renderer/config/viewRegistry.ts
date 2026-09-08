import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import type { ViewId, ViewParams } from '@shared/types/view'

// ── 页面组件 Props 契约 ──────────────────────────────

/**
 * 所有页面组件必须实现的 Props 接口。
 * NavigationShell 会将 uiStore 中的 activeViewParams 传入。
 */
export interface ViewPageProps {
  readonly params: ViewParams
}

// ── 注册表条目类型 ────────────────────────────────────

/**
 * 视图注册表中的一条记录。
 */
export interface ViewEntry {
  /** 视图标识符 */
  readonly id: ViewId
  /** 显示名称（可用于面包屑、标签页标题） */
  readonly title: string
  /** 懒加载的页面组件 */
  readonly component: LazyExoticComponent<ComponentType<ViewPageProps>>
}

// ── 懒加载页面组件 ────────────────────────────────────

const HomePage = lazy(() => import('@renderer/pages/HomePage'))
const ChannelPage = lazy(() => import('@renderer/pages/ChannelPage'))
const VoicePage = lazy(() => import('@renderer/pages/VoicePage'))
const SettingsPage = lazy(() => import('@renderer/pages/SettingsPage'))
const FriendsPage = lazy(() => import('@renderer/pages/FriendsPage'))

// ── 注册表实现 ────────────────────────────────────────

const registry = new Map<ViewId, ViewEntry>([
  ['server-home', { id: 'server-home', title: '服务器首页', component: HomePage }],
  ['text-channel', { id: 'text-channel', title: '文字频道', component: ChannelPage }],
  ['voice-channel', { id: 'voice-channel', title: '语音频道', component: VoicePage }],
  ['settings', { id: 'settings', title: '设置', component: SettingsPage }],
  ['friends', { id: 'friends', title: '好友', component: FriendsPage }],
])

/**
 * 按 ViewId 获取视图条目。
 * @returns 视图条目，未注册时返回 undefined
 */
export function getView(id: ViewId): ViewEntry | undefined {
  return registry.get(id)
}

/**
 * 获取所有已注册视图。
 */
export function getAllViews(): readonly ViewEntry[] {
  return Array.from(registry.values())
}

/**
 * 动态注册视图（供未来插件扩展使用）。
 * 如果 id 已存在，覆盖旧条目并打印警告。
 */
export function registerView(entry: ViewEntry): void {
  if (registry.has(entry.id)) {
    console.warn(`[ViewRegistry] 视图 "${entry.id}" 已注册，正在覆盖`)
  }
  registry.set(entry.id, entry)
}
