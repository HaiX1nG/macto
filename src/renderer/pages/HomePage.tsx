import type { ReactNode } from 'react'
import { NoChannelSelected } from '@renderer/components/ui/EmptyState'
import type { ViewPageProps } from '@renderer/config/viewRegistry'

/**
 * HomePage - 欢迎页/空状态。
 *
 * 无选中频道时展示。后续可扩展为仪表盘（统计卡片、快速操作）。
 */
export function HomePage(_props: ViewPageProps): ReactNode {
  return (
    <div className="flex-1 flex items-center justify-center">
      <NoChannelSelected />
    </div>
  )
}

export default HomePage
