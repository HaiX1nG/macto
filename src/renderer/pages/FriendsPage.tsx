import type { ReactNode } from 'react'
import type { ViewPageProps } from '@renderer/config/viewRegistry'

/**
 * FriendsPage - 好友页面占位组件
 *
 * TODO: Phase 5b will implement full friends list UI.
 */
export function FriendsPage(_props: ViewPageProps): ReactNode {
  return (
    <div className="flex h-full items-center justify-center text-gray-400">
      <div className="text-center">
        <h2 className="mb-2 text-lg font-medium">好友</h2>
        <p className="text-sm">好友功能开发中...</p>
      </div>
    </div>
  )
}

export default FriendsPage
