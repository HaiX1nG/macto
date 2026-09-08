import type { ReactNode } from 'react'
import { cn } from '@renderer/utils/cn'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'
type TooltipVariant = 'default' | 'light'

interface TooltipProps {
  children: ReactNode
  content: string
  position?: TooltipPosition
  delay?: number
  variant?: TooltipVariant
}

export const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 0,
  variant = 'default'
}: TooltipProps) => {
  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3',
  }

  const arrowClasses: Record<TooltipPosition, string> = {
    top: '-bottom-1.5 left-1/2 -translate-x-1/2 rotate-45',
    bottom: '-top-1.5 left-1/2 -translate-x-1/2 rotate-45',
    left: '-right-1.5 top-1/2 -translate-y-1/2 rotate-45',
    right: '-left-1.5 top-1/2 -translate-y-1/2 rotate-45',
  }

  const variants: Record<TooltipVariant, string> = {
    default: cn(
      'bg-[var(--color-bg-darkest)]',
      'text-[var(--color-bg-base)]'
    ),
    light: cn(
      'bg-[var(--color-bg-secondary)]',
      'text-[var(--color-text-normal)]',
      'border border-[var(--color-border)]',
      'shadow-lg'
    ),
  }

  return (
    <div className="relative inline-block group">
      {children}
      <div
        className={cn(
          'absolute z-50 px-3 py-2 rounded-lg text-sm font-medium',
          'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100',
          'invisible group-hover:visible',
          'transition-[opacity,transform] duration-150 ease-out',
          'pointer-events-none whitespace-nowrap',
          'shadow-xl',
          positionClasses[position],
          variants[variant]
        )}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {content}
        <div
          className={cn(
            'absolute w-3 h-3',
            arrowClasses[position],
            variant === 'default'
              ? 'bg-[var(--color-bg-darkest)]'
              : 'bg-[var(--color-bg-secondary)] border-b border-r border-[var(--color-border)]'
          )}
        />
      </div>
    </div>
  )
}

type IconButtonSize = 'sm' | 'md' | 'lg'
type IconButtonVariant = 'default' | 'primary' | 'danger'

interface IconButtonProps {
  icon: ReactNode
  onClick?: () => void
  tooltip?: string
  tooltipPosition?: TooltipPosition
  size?: IconButtonSize
  variant?: IconButtonVariant
  disabled?: boolean
  className?: string
}

const normalizeIconButtonSize = (size: IconButtonSize | 'small' | 'default' | 'large'): IconButtonSize => {
  const sizeMap: Record<string, IconButtonSize> = {
    'small': 'sm',
    'default': 'md',
    'large': 'lg',
  }
  return sizeMap[size] ?? size as IconButtonSize
}

export const IconButton = ({
  icon,
  onClick,
  tooltip,
  tooltipPosition = 'top',
  size = 'md',
  variant = 'default',
  disabled = false,
  className
}: IconButtonProps) => {
  const normalizedSize = normalizeIconButtonSize(size)

  const sizes: Record<IconButtonSize, string> = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }

  const variants: Record<IconButtonVariant, string> = {
    default: cn(
      'text-[var(--color-text-muted)]',
      'hover:bg-[var(--color-bg-tertiary)]',
      'hover:text-[var(--color-text-normal)]',
      'active:bg-[var(--color-bg-darker)]'
    ),
    primary: cn(
      'text-[var(--color-primary)]',
      'hover:bg-[var(--color-primary)]/10',
      'hover:text-[var(--color-primary)]',
      'active:bg-[var(--color-primary)]/20'
    ),
    danger: cn(
      'text-[var(--color-dnd)]',
      'hover:bg-[var(--color-dnd)]/10',
      'hover:text-[var(--color-dnd)]',
      'active:bg-[var(--color-dnd)]/20'
    ),
  }

  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-xl font-medium',
        'transition-colors duration-150 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[normalizedSize],
        variants[variant],
        className
      )}
    >
      {icon}
    </button>
  )

  if (tooltip) {
    return (
      <Tooltip content={tooltip} position={tooltipPosition}>
        {button}
      </Tooltip>
    )
  }

  return button
}