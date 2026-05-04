import type { ReactNode } from 'react'
import { cn } from '@renderer/utils/cn'

interface TooltipProps {
  children: ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  variant?: 'default' | 'light'
}

export const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 0,
  variant = 'default'
}: TooltipProps) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3',
  }

  const arrowClasses = {
    top: '-bottom-1.5 left-1/2 -translate-x-1/2 rotate-45',
    bottom: '-top-1.5 left-1/2 -translate-x-1/2 rotate-45',
    left: '-right-1.5 top-1/2 -translate-y-1/2 rotate-45',
    right: '-left-1.5 top-1/2 -translate-y-1/2 rotate-45',
  }

  const variants = {
    default: cn(
      'bg-gray-900 dark:bg-gray-800',
      'text-white'
    ),
    light: cn(
      'bg-white dark:bg-gray-800',
      'text-gray-900 dark:text-white',
      'border border-gray-200 dark:border-gray-700',
      'shadow-lg'
    ),
  }

  return (
    <div className="relative inline-block group">
      {children}
      <div
        className={cn(
          'absolute z-[1070] px-3 py-2 rounded-lg text-sm font-medium',
          'opacity-0 group-hover:opacity-100',
          'invisible group-hover:visible',
          'transition-all duration-200 ease-out',
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
              ? 'bg-gray-900 dark:bg-gray-800'
              : 'bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700'
          )}
        />
      </div>
    </div>
  )
}

interface IconButtonProps {
  icon: ReactNode
  onClick?: () => void
  tooltip?: string
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
  size?: 'small' | 'default' | 'large'
  variant?: 'default' | 'primary' | 'danger'
  disabled?: boolean
  className?: string
}

export const IconButton = ({
  icon,
  onClick,
  tooltip,
  tooltipPosition = 'top',
  size = 'default',
  variant = 'default',
  disabled = false,
  className
}: IconButtonProps) => {
  const sizes = {
    small: 'w-8 h-8 text-sm',
    default: 'w-10 h-10 text-base',
    large: 'w-12 h-12 text-lg',
  }

  const variants = {
    default: cn(
      'text-gray-600 dark:text-gray-400',
      'hover:bg-gray-100 dark:hover:bg-gray-800',
      'hover:text-gray-900 dark:hover:text-white',
      'active:bg-gray-200 dark:active:bg-gray-700'
    ),
    primary: cn(
      'text-blue-600 dark:text-blue-400',
      'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      'hover:text-blue-700 dark:hover:text-blue-300',
      'active:bg-blue-100 dark:active:bg-blue-900/30'
    ),
    danger: cn(
      'text-red-600 dark:text-red-400',
      'hover:bg-red-50 dark:hover:bg-red-900/20',
      'hover:text-red-700 dark:hover:text-red-300',
      'active:bg-red-100 dark:active:bg-red-900/30'
    ),
  }

  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-xl font-medium',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
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