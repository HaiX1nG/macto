import type { ReactNode } from 'react'
import { SettingsView } from '@renderer/components/layout/SettingsView'
import type { ViewPageProps } from '@renderer/config/viewRegistry'

/**
 * SettingsPage - 设置页。
 *
 * 包裹现有 SettingsView。SettingsView 使用 h-full 适配内容区。
 */
export function SettingsPage(_props: ViewPageProps): ReactNode {
  return <SettingsView />
}

export default SettingsPage
