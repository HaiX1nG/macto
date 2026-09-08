import type { CardProps as AntdCardProps } from 'antd';
import { Card as AntdCard } from 'antd'
import { cn } from '@renderer/utils/cn'

type CardVariant = 'default' | 'bordered' | 'elevated' | 'glass'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'
type CardBorderColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'default'

interface CardProps extends Omit<AntdCardProps, 'className' | 'variant' | 'bordered'> {
  className?: string
  title?: React.ReactNode
  subtitle?: string
  extra?: React.ReactNode
  children: React.ReactNode
  variant?: CardVariant
  hoverable?: boolean
  padding?: CardPadding
  borderColor?: CardBorderColor
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
  const variants: Record<CardVariant, string> = {
    default: cn(
      'bg-[var(--color-bg-secondary)]',
      'border border-[var(--color-border)]',
      'shadow-sm'
    ),
    bordered: cn(
      'bg-[var(--color-bg-secondary)]',
      'border-2 border-[var(--color-border)]'
    ),
    elevated: cn(
      'bg-[var(--color-bg-secondary)]',
      'border border-[var(--color-border)]',
      'shadow-lg'
    ),
    glass: cn(
      'bg-[var(--color-bg-secondary)]/80',
      'backdrop-blur-xl',
      'border border-[var(--color-border)]',
      'shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
    ),
  }

  const borderColors: Record<CardBorderColor, string> = {
    default: '',
    blue: 'border-l-4 border-l-[var(--color-primary)]',
    green: 'border-l-4 border-l-[var(--color-online)]',
    purple: 'border-l-4 border-l-[var(--color-accent)]',
    orange: 'border-l-4 border-l-[var(--color-idle)]',
    red: 'border-l-4 border-l-[var(--color-dnd)]',
  }

  const paddings: Record<CardPadding, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  }

  return (
    <AntdCard
      className={cn(
        'rounded-2xl overflow-hidden',
        'transition-shadow duration-200 ease-out transition-transform',
        variants[variant],
        borderColors[borderColor],
        hoverable && cn(
          'hover:shadow-xl hover:-translate-y-1',
          'hover:border-[var(--color-primary)]/30',
          'cursor-pointer'
        ),
        className
      )}
      title={title ? (
        <div className="flex items-center gap-3">
          {title}
          {subtitle && (
            <span className="text-xs text-[var(--color-text-muted)] font-normal">
              {subtitle}
            </span>
          )}
        </div>
      ) : undefined}
      extra={extra}
      styles={{
        body: { padding: padding === 'none' ? 0 : undefined },
        header: {
          borderBottom: '1px solid var(--color-border)',
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
    'px-5 py-4 border-b border-[var(--color-border)]',
    'flex items-center justify-between',
    className
  )}>
    <div className="flex items-center gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
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
  padding?: CardPadding
}) => {
  const paddings: Record<CardPadding, string> = {
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
    'px-5 py-4 border-t border-[var(--color-border)]',
    'bg-[var(--color-bg-tertiary)]/50',
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
    'text-lg font-bold text-[var(--color-text-normal)]',
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
    'text-sm text-[var(--color-text-muted)] mt-1',
    className
  )}>
    {children}
  </p>
)
