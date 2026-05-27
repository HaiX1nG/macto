import { Tag } from 'antd'
import { cn } from '@renderer/utils/cn'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'accent' | 'purple' | 'cyan' | 'pink'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  /** @deprecated Use 'sm' | 'md' | 'lg' instead */
  size?: BadgeSize | 'small' | 'default' | 'large'
  dot?: boolean
  removable?: boolean
  onRemove?: () => void
  className?: string
}

const normalizeSize = (size: BadgeSize | 'small' | 'default' | 'large'): BadgeSize => {
  const sizeMap: Record<string, BadgeSize> = {
    'small': 'sm',
    'default': 'md',
    'large': 'lg',
  }
  return sizeMap[size] ?? size as BadgeSize
}

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  removable = false,
  onRemove,
  className
}: BadgeProps) => {
  const normalizedSize = normalizeSize(size)

  const variants: Record<BadgeVariant, string> = {
    default: cn(
      'bg-[var(--color-bg-tertiary)] text-[var(--color-text-normal)]',
      'border border-[var(--color-border)]'
    ),
    primary: cn(
      'bg-[var(--color-primary)]/20 text-[var(--color-primary)]',
      'border border-[var(--color-primary)]/30'
    ),
    success: cn(
      'bg-[var(--color-online)]/20 text-[var(--color-online)]',
      'border border-[var(--color-online)]/30'
    ),
    warning: cn(
      'bg-[var(--color-idle)]/20 text-[var(--color-idle)]',
      'border border-[var(--color-idle)]/30'
    ),
    error: cn(
      'bg-[var(--color-dnd)]/20 text-[var(--color-dnd)]',
      'border border-[var(--color-dnd)]/30'
    ),
    info: cn(
      'bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]',
      'border border-[var(--color-secondary)]/30'
    ),
    accent: cn(
      'bg-[var(--color-accent)]/20 text-[var(--color-accent)]',
      'border border-[var(--color-accent)]/30'
    ),
    purple: cn(
      'bg-[var(--color-accent)]/20 text-[var(--color-accent)]',
      'border border-[var(--color-accent)]/30'
    ),
    cyan: cn(
      'bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]',
      'border border-[var(--color-secondary)]/30'
    ),
    pink: cn(
      'bg-[var(--color-dnd)]/20 text-[var(--color-dnd)]',
      'border border-[var(--color-dnd)]/30'
    ),
  }

  const sizes: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-[var(--color-text-muted)]',
    primary: 'bg-[var(--color-primary)]',
    success: 'bg-[var(--color-online)]',
    warning: 'bg-[var(--color-idle)]',
    error: 'bg-[var(--color-dnd)]',
    info: 'bg-[var(--color-secondary)]',
    accent: 'bg-[var(--color-accent)]',
    purple: 'bg-[var(--color-accent)]',
    cyan: 'bg-[var(--color-secondary)]',
    pink: 'bg-[var(--color-dnd)]',
  }

  return (
    <Tag
      className={cn(
        'rounded-full font-medium border',
        'inline-flex items-center gap-1.5',
        'transition-colors duration-150 ease-out',
        variants[variant],
        sizes[normalizedSize],
        className
      )}
      closable={removable}
      onClose={onRemove}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          dotColors[variant]
        )} />
      )}
      {children}
    </Tag>
  )
}

type StatusType = 'online' | 'away' | 'busy' | 'offline'
type StatusBadgeSize = 'sm' | 'md' | 'lg'

interface StatusBadgeProps {
  status: StatusType
  showLabel?: boolean
  /** @deprecated Use 'sm' | 'md' | 'lg' instead */
  size?: StatusBadgeSize | 'small' | 'default' | 'large'
  className?: string
}

export const StatusBadge = ({
  status,
  showLabel = true,
  size = 'md',
  className
}: StatusBadgeProps) => {
  const normalizedSize = normalizeSize(size)

  const statusConfig: Record<StatusType, { label: string; variant: BadgeVariant }> = {
    online: { label: '在线', variant: 'success' },
    away: { label: '离开', variant: 'warning' },
    busy: { label: '忙碌', variant: 'error' },
    offline: { label: '离线', variant: 'default' },
  }

  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      size={normalizedSize}
      dot
      className={className}
    >
      {showLabel && config.label}
    </Badge>
  )
}

type CountBadgeSize = 'sm' | 'md'

interface CountBadgeProps {
  count: number
  max?: number
  showZero?: boolean
  /** @deprecated Use 'sm' | 'md' instead */
  size?: CountBadgeSize | 'small' | 'default'
  className?: string
}

const normalizeCountSize = (size: CountBadgeSize | 'small' | 'default'): CountBadgeSize => {
  const sizeMap: Record<string, CountBadgeSize> = {
    'small': 'sm',
    'default': 'md',
  }
  return sizeMap[size] ?? size as CountBadgeSize
}

export const CountBadge = ({
  count,
  max = 99,
  showZero = false,
  size = 'md',
  className
}: CountBadgeProps) => {
  if (count === 0 && !showZero) return null

  const normalizedSize = normalizeCountSize(size)
  const displayCount = count > max ? `${max}+` : count

  const sizes: Record<CountBadgeSize, string> = {
    sm: 'min-w-[18px] h-[18px] text-[10px] px-1.5',
    md: 'min-w-[22px] h-[22px] text-xs px-2',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'bg-[var(--color-dnd)] text-[var(--color-bg-base)] font-bold',
        'rounded-full',
        sizes[normalizedSize],
        className
      )}
    >
      {displayCount}
    </span>
  )
}