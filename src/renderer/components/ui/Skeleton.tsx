/**
 * Skeleton Component
 *
 * Loading placeholder component with shimmer animation
 */

import { cn } from '@renderer/utils/cn'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'shimmer' | 'pulse' | 'none'
  style?: React.CSSProperties
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'shimmer',
  style,
}: SkeletonProps) {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  }

  const animations = {
    shimmer: 'animate-shimmer',
    pulse: 'animate-pulse-slow',
    none: '',
  }

  return (
    <div
      className={cn(
        variants[variant],
        animations[animation],
        animation === 'shimmer'
          ? 'bg-gradient-to-r from-[var(--color-bg-tertiary)] via-[var(--color-bg-darker)] to-[var(--color-bg-tertiary)] bg-[length:200%_100%]'
          : 'bg-[var(--color-bg-tertiary)]',
        className
      )}
      style={{
        width: width,
        height: height,
        willChange: animation === 'shimmer' ? 'background-position' : undefined,
        ...style,
      }}
    />
  )
}

// Skeleton for avatar
interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | number
  className?: string
}

export function SkeletonAvatar({ size = 'md', className }: SkeletonAvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const sizeClass = typeof size === 'number' ? '' : sizes[size]
  const sizeStyle = typeof size === 'number' ? { width: size, height: size } : undefined

  return (
    <Skeleton
      variant="circular"
      className={cn(sizeClass, className)}
      style={sizeStyle}
    />
  )
}

// Skeleton for text content
interface SkeletonTextProps {
  lines?: number
  className?: string
  lineHeight?: string | number
  lastLineWidth?: string
}

export function SkeletonText({
  lines = 3,
  className,
  lineHeight = '1rem',
  lastLineWidth = '60%',
}: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={lineHeight}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          className={i === lines - 1 ? 'mb-0' : ''}
        />
      ))}
    </div>
  )
}

// Skeleton for message item
export function SkeletonMessage({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-4 py-2', className)}>
      <SkeletonAvatar size={40} />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton variant="rounded" width={80} height={16} />
          <Skeleton variant="rounded" width={40} height={12} />
        </div>
        <SkeletonText lines={2} lastLineWidth="70%" />
      </div>
    </div>
  )
}

// Skeleton for channel item
export function SkeletonChannel({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 px-2 py-1.5', className)}>
      <Skeleton variant="rounded" width={20} height={20} />
      <Skeleton variant="text" width={100} height={14} />
    </div>
  )
}

// Skeleton for server icon
export function SkeletonServer({ className }: { className?: string }) {
  return (
    <Skeleton
      variant="circular"
      width={48}
      height={48}
      className={cn('mx-auto', className)}
    />
  )
}

// Skeleton for member item
export function SkeletonMember({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 px-2 py-1.5', className)}>
      <SkeletonAvatar size={32} />
      <div className="flex-1 space-y-1">
        <Skeleton variant="text" width={80} height={14} />
        <Skeleton variant="text" width={60} height={12} />
      </div>
    </div>
  )
}

// Skeleton for card
interface SkeletonCardProps {
  className?: string
  showAvatar?: boolean
  lines?: number
}

export function SkeletonCard({
  className,
  showAvatar = true,
  lines = 3,
}: SkeletonCardProps) {
  return (
    <div className={cn('p-4 space-y-4', className)}>
      {showAvatar && (
        <div className="flex items-center gap-3">
          <SkeletonAvatar />
          <div className="space-y-2">
            <Skeleton variant="text" width={100} height={16} />
            <Skeleton variant="text" width={60} height={12} />
          </div>
        </div>
      )}
      <SkeletonText lines={lines} />
    </div>
  )
}

// Skeleton list component
interface SkeletonListProps {
  count?: number
  itemSkeleton: React.ReactNode
  className?: string
}

export function SkeletonList({ count = 5, itemSkeleton, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{itemSkeleton}</div>
      ))}
    </div>
  )
}

// Skeleton for message list
export function SkeletonMessageList({ count = 8 }: { count?: number }) {
  return (
    <div className="px-4 py-4 space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMessage key={i} />
      ))}
    </div>
  )
}

// Skeleton for server sidebar
export function SkeletonServerSidebar() {
  return (
    <div className="w-[72px] bg-[var(--color-bg-darkest)] flex flex-col items-center py-3 gap-2 h-full">
      {/* Home button skeleton */}
      <SkeletonServer />
      {/* Divider */}
      <div className="w-8 h-[2px] bg-[var(--color-border)] rounded-full my-1" />
      {/* Server list skeleton */}
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonServer key={i} />
      ))}
      {/* Spacer */}
      <div className="flex-1" />
      {/* Settings skeleton */}
      <SkeletonServer />
      {/* Avatar skeleton */}
      <SkeletonAvatar size={40} />
    </div>
  )
}

// Skeleton for channel sidebar
export function SkeletonChannelSidebar() {
  return (
    <div className="w-[240px] bg-[var(--color-bg-secondary)] flex flex-col h-full">
      {/* Header skeleton */}
      <div className="h-12 px-4 flex items-center border-b border-[var(--color-border)]">
        <Skeleton variant="text" width={120} height={18} />
      </div>
      {/* Channel list skeleton */}
      <div className="flex-1 overflow-hidden py-3 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonChannel key={i} />
        ))}
      </div>
      {/* User panel skeleton */}
      <div className="h-14 px-2 flex items-center gap-2 border-t border-[var(--color-border)]">
        <SkeletonAvatar size={32} />
        <div className="flex-1 space-y-1">
          <Skeleton variant="text" width={80} height={14} />
          <Skeleton variant="text" width={50} height={12} />
        </div>
      </div>
    </div>
  )
}

export default Skeleton
