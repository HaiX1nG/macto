import type { CardProps as AntdCardProps } from 'antd';
import { Card as AntdCard } from 'antd'
import { cn } from '@renderer/utils/cn'

interface CardProps extends Omit<AntdCardProps, 'className'> {
  className?: string
  title?: React.ReactNode
  subtitle?: string
  extra?: React.ReactNode
  children: React.ReactNode
  variant?: 'default' | 'bordered' | 'elevated' | 'glass'
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  borderColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'default'
}

export const Card = ({
  className,
  title,
  subtitle,
  extra,
  children,
  variant = 'default',
  hoverable = false,
  padding = 'md',
  borderColor = 'default',
  ...props
}: CardProps) => {
  const variants = {
    default: cn(
      'bg-white dark:bg-[var(--color-bg-tertiary-dark)]',
      'border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
      'shadow-[var(--shadow-sm)]'
    ),
    bordered: cn(
      'bg-white dark:bg-[var(--color-bg-tertiary-dark)]',
      'border-2 border-[var(--color-border-secondary-light)] dark:border-[var(--color-border-secondary-dark)]'
    ),
    elevated: cn(
      'bg-white dark:bg-[var(--color-bg-tertiary-dark)]',
      'border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
      'shadow-[var(--shadow-lg)]'
    ),
    glass: cn(
      'bg-[var(--color-glass-light)] dark:bg-[var(--color-glass-dark)]',
      'backdrop-blur-[var(--blur-xl)]',
      'border border-[var(--color-glass-border-light)] dark:border-[var(--color-glass-border-dark)]',
      'shadow-[var(--shadow-floating)]'
    ),
  }

  const borderColors = {
    default: '',
    blue: 'border-l-4 border-l-[var(--color-primary)]',
    green: 'border-l-4 border-l-[var(--color-success)]',
    purple: 'border-l-4 border-l-purple-500',
    orange: 'border-l-4 border-l-[var(--color-warning)]',
    red: 'border-l-4 border-l-[var(--color-error)]',
  }

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  }

  return (
    <AntdCard
      className={cn(
        'rounded-[var(--radius-xl)] overflow-hidden',
        'transition-[var(--transition-all)] ease-out',
        variants[variant],
        borderColors[borderColor],
        hoverable && cn(
          'hover:shadow-[var(--shadow-xl)] hover:-translate-y-1',
          'hover:border-[var(--color-border-secondary-light)] dark:hover:border-[var(--color-border-secondary-dark)]',
          'cursor-pointer'
        ),
        className
      )}
      title={title ? (
        <div className="flex items-center gap-3">
          {title}
          {subtitle && (
            <span className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] font-normal">
              {subtitle}
            </span>
          )}
        </div>
      ) : undefined}
      extra={extra}
      styles={{
        body: { padding: padding === 'none' ? 0 : undefined },
        header: {
          borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
          padding: '16px 20px',
        },
      }}
      {...props}
    >
      <div className={cn(paddings[padding])}>
        {children}
      </div>
    </AntdCard>
  )
}

export const CardHeader = ({
  children,
  className,
  icon,
  action
}: {
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}) => (
  <div className={cn(
    'px-5 py-4 border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
    'flex items-center justify-between',
    className
  )}>
    <div className="flex items-center gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10 flex items-center justify-center text-[var(--color-primary)]">
          {icon}
        </div>
      )}
      <div>{children}</div>
    </div>
    {action && <div>{action}</div>}
  </div>
)

export const CardContent = ({
  children,
  className,
  padding = 'md'
}: {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  }

  return (
    <div className={cn(paddings[padding], className)}>
      {children}
    </div>
  )
}

export const CardFooter = ({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn(
    'px-5 py-4 border-t border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
    'bg-[var(--color-bg-secondary-light)]/50 dark:bg-[var(--color-bg-secondary-dark)]/50',
    className
  )}>
    {children}
  </div>
)

export const CardTitle = ({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) => (
  <h3 className={cn(
    'text-lg font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]',
    className
  )}>
    {children}
  </h3>
)

export const CardDescription = ({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) => (
  <p className={cn(
    'text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mt-1',
    className
  )}>
    {children}
  </p>
)
