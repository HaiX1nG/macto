import { Tag } from 'antd'
import { cn } from '@renderer/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'cyan' | 'pink'
  size?: 'small' | 'default' | 'large'
  dot?: boolean
  removable?: boolean
  onRemove?: () => void
  className?: string
}

export const Badge = ({
  children,
  variant = 'default',
  size = 'default',
  dot = false,
  removable = false,
  onRemove,
  className
}: BadgeProps) => {
  const variants = {
    default: cn(
      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      'border border-gray-200 dark:border-gray-700'
    ),
    primary: cn(
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'border border-blue-200 dark:border-blue-800'
    ),
    success: cn(
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'border border-green-200 dark:border-green-800'
    ),
    warning: cn(
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'border border-amber-200 dark:border-amber-800'
    ),
    error: cn(
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'border border-red-200 dark:border-red-800'
    ),
    info: cn(
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      'border border-cyan-200 dark:border-cyan-800'
    ),
    purple: cn(
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'border border-purple-200 dark:border-purple-800'
    ),
    cyan: cn(
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      'border border-cyan-200 dark:border-cyan-800'
    ),
    pink: cn(
      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      'border border-pink-200 dark:border-pink-800'
    ),
  }

  const sizes = {
    small: 'text-[10px] px-2 py-0.5',
    default: 'text-xs px-2.5 py-1',
    large: 'text-sm px-3 py-1.5',
  }

  return (
    <Tag
      className={cn(
        'rounded-full font-medium border',
        'inline-flex items-center gap-1.5',
        'transition-all duration-200',
        variants[variant],
        sizes[size],
        className
      )}
      closable={removable}
      onClose={onRemove}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' && 'bg-green-500',
          variant === 'warning' && 'bg-amber-500',
          variant === 'error' && 'bg-red-500',
          variant === 'primary' && 'bg-blue-500',
          variant === 'default' && 'bg-gray-500',
          variant === 'info' && 'bg-cyan-500',
          variant === 'purple' && 'bg-purple-500',
          variant === 'cyan' && 'bg-cyan-500',
          variant === 'pink' && 'bg-pink-500',
        )} />
      )}
      {children}
    </Tag>
  )
}

interface StatusBadgeProps {
  status: 'online' | 'away' | 'busy' | 'offline'
  showLabel?: boolean
  size?: 'small' | 'default' | 'large'
  className?: string
}

export const StatusBadge = ({
  status,
  showLabel = true,
  size = 'default',
  className
}: StatusBadgeProps) => {
  const statusConfig = {
    online: {
      label: '在线',
      variant: 'success' as const,
      dotClass: 'bg-green-500 shadow-green-500/50',
    },
    away: {
      label: '离开',
      variant: 'warning' as const,
      dotClass: 'bg-amber-500 shadow-amber-500/50',
    },
    busy: {
      label: '忙碌',
      variant: 'error' as const,
      dotClass: 'bg-red-500 shadow-red-500/50',
    },
    offline: {
      label: '离线',
      variant: 'default' as const,
      dotClass: 'bg-gray-400',
    },
  }

  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot
      className={className}
    >
      {showLabel && config.label}
    </Badge>
  )
}

interface CountBadgeProps {
  count: number
  max?: number
  showZero?: boolean
  size?: 'small' | 'default'
  className?: string
}

export const CountBadge = ({
  count,
  max = 99,
  showZero = false,
  size = 'default',
  className
}: CountBadgeProps) => {
  if (count === 0 && !showZero) return null

  const displayCount = count > max ? `${max}+` : count

  const sizes = {
    small: 'min-w-[18px] h-[18px] text-[10px] px-1.5',
    default: 'min-w-[22px] h-[22px] text-xs px-2',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'bg-red-500 text-white font-bold',
        'rounded-full',
        sizes[size],
        className
      )}
    >
      {displayCount}
    </span>
  )
}