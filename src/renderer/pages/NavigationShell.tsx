import { Suspense } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLayoutStore } from '@renderer/stores/layoutStore'
import { useMediaStore } from '@renderer/stores/mediaStore'
import { getView } from '@renderer/config/viewRegistry'
import { RemoteScreensContainer } from '@renderer/components/screen/RemoteScreensContainer'
import { SkeletonMessageList } from '@renderer/components/ui/Skeleton'
import { NoChannelSelected } from '@renderer/components/ui/EmptyState'
import { cn } from '@renderer/utils/cn'

export interface NavigationShellProps {
  /** 可选 className 覆盖 */
  readonly className?: string
}

function PageSkeleton(): ReactNode {
  return <SkeletonMessageList count={6} />
}

/**
 * NavigationShell - 导航壳组件。
 *
 * 根据 layoutStore 中的 activeViewId 解析对应的页面组件并渲染。
 * - 有远程屏幕共享时在顶部渲染 RemoteScreensContainer
 * - 使用 Suspense + 骨架屏 fallback 处理懒加载
 * - 使用 framer-motion AnimatePresence (mode="wait") 实现淡入淡出过渡
 * - 视图未注册时渲染 NoChannelSelected 空状态
 */
export function NavigationShell({ className }: NavigationShellProps): ReactNode {
  const activeViewId = useLayoutStore((s) => s.activeViewId)
  const activeViewParams = useLayoutStore((s) => s.activeViewParams)
  const hasRemoteScreens = useMediaStore((s) => s.remoteScreens.size > 0)

  const entry = getView(activeViewId)
  const PageComponent = entry?.component

  return (
    <div
      className={cn(
        'h-full flex flex-col min-w-0 overflow-hidden bg-[var(--color-bg-base)]',
        className,
      )}
    >
      {/* 远程屏幕浮层：有远程屏幕共享时在顶部显示 */}
      {hasRemoteScreens && <RemoteScreensContainer />}

      {/* 活动视图：按 activeViewId 渲染，带过渡动画 */}
      <Suspense fallback={<PageSkeleton />}>
        <AnimatePresence mode="wait">
          {PageComponent ? (
            <motion.div
              key={activeViewId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex-1 min-h-0 flex flex-col"
            >
              <PageComponent params={activeViewParams} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <NoChannelSelected />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  )
}

export default NavigationShell
