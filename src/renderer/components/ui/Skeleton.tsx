/**
 * Skeleton Component
 *
 * Loading placeholder component with pulse animation.
 * Supports circle, text, and rect variants.
 */

import { cn } from '@renderer/utils/cn'

export interface SkeletonProps {
  className?: string
  variant?: 'circle' | 'text' | 'rect'
  width?: string | number
  height?: string | number
  style?: React.CSSProperties
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  style,
}: SkeletonProps) {
  const variants = {
    circle: 'rounded-full',
    text: 'rounded',
    rect: 'rounded-lg',
  }

  return (
    <div
      className={cn(
        variants[variant],
        'animate-pulse bg-bg-tertiary',
        className
      )}
      style={{
        width: width,
        height: height,
        ...style,
      }}
    />
  )
}

/**
 * SkeletonMessageList
 *
 * Loading placeholder for a list of chat messages.
 * Renders `count` skeleton rows, each mimicking an avatar + text lines.
 */
export interface SkeletonMessageListProps {
  /** Number of skeleton message rows to render */
  count?: number
  className?: string
}

export function SkeletonMessageList({ count = 5, className }: SkeletonMessageListProps) {
  return (
    <div className={cn('flex flex-col gap-4 p-4', className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton variant="circle" width={40} height={40} className="flex-shrink-0" />
          <div className="flex flex-col gap-2 flex-1 py-1">
            <Skeleton variant="rect" width={120} height={12} className="rounded" />
            <Skeleton variant="rect" width="80%" height={12} className="rounded" />
            <Skeleton variant="rect" width="60%" height={12} className="rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * SkeletonAvatar
 *
 * Circular skeleton placeholder for avatars.
 */
export interface SkeletonAvatarProps {
  size?: number
  className?: string
}

export function SkeletonAvatar({ size = 40, className }: SkeletonAvatarProps) {
  return <Skeleton variant="circle" width={size} height={size} className={className} />
}

/**
 * SkeletonMember
 *
 * Loading placeholder for a single member row (avatar + name).
 */
export function SkeletonMember() {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl">
      <Skeleton variant="circle" width={36} height={36} className="flex-shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton variant="rect" width={100} height={12} className="rounded" />
        <Skeleton variant="rect" width={60} height={10} className="rounded" />
      </div>
    </div>
  )
}

/**
 * SkeletonCard
 *
 * Loading placeholder for a card with optional avatar and text lines.
 */
export interface SkeletonCardProps {
  showAvatar?: boolean
  lines?: number
  className?: string
}

export function SkeletonCard({ showAvatar = true, lines = 3, className }: SkeletonCardProps) {
  return (
    <div className={cn('p-4 rounded-2xl bg-bg-tertiary', className)}>
      {showAvatar && <Skeleton variant="circle" width={48} height={48} className="mb-3" />}
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          variant="rect"
          width={i === lines - 1 ? '60%' : '100%'}
          height={12}
          className="rounded mb-2"
        />
      ))}
    </div>
  )
}

export default Skeleton
