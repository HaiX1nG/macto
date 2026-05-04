import type { ReactNode } from 'react'
import { cn } from '@renderer/utils/cn'

interface ContentProps {
  children: ReactNode
  className?: string
}

export function Content({ children, className }: ContentProps) {
  return (
    <main className={cn(
      'flex-1 bg-[var(--color-bg-secondary-light)] dark:bg-[var(--color-bg-dark)]',
      'flex flex-col overflow-hidden',
      className
    )}>
      {children}
    </main>
  )
}

interface ContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Container = ({
  children,
  className,
  maxWidth = 'lg',
  padding = 'md'
}: ContainerProps) => {
  const maxWidths = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1400px]',
    '2xl': 'max-w-[1600px]',
    full: 'max-w-full',
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div className={cn(
      'mx-auto',
      maxWidths[maxWidth],
      paddings[padding],
      className
    )}>
      {children}
    </div>
  )
}

interface ContentHeaderProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  actions?: ReactNode
}

export const ContentHeader = ({
  children,
  className,
  title,
  subtitle,
  actions
}: ContentHeaderProps) => {
  if (title || actions) {
    return (
      <header className={cn(
        'h-16 flex items-center justify-between px-6',
        'border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
        'bg-white/80 dark:bg-[var(--color-bg-dark)]/80',
        'backdrop-blur-[var(--blur-md)]',
        'sticky top-0 z-[var(--z-sticky)]',
        'shadow-[var(--shadow-sm)]',
        className
      )}>
        <div>
          {title && (
            <h2 className="text-lg font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
        {children}
      </header>
    )
  }

  return (
    <header className={cn(
      'h-16 flex items-center justify-between px-6',
      'border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
      'bg-white/80 dark:bg-[var(--color-bg-dark)]/80',
      'backdrop-blur-[var(--blur-md)]',
      'sticky top-0 z-[var(--z-sticky)]',
      'shadow-[var(--shadow-sm)]',
      className
    )}>
      {children}
    </header>
  )
}

export const Title = ({ children, className }: { children: ReactNode; className?: string }) => (
  <h2 className={cn(
    'text-lg font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]',
    className
  )}>
    {children}
  </h2>
)

export const HeaderActions = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn(
    'flex items-center gap-3',
    className
  )}>
    {children}
  </div>
)

interface ChannelHeaderProps {
  children: ReactNode
  className?: string
}

export const ChannelHeader = ({
  children,
  className
}: ChannelHeaderProps) => (
  <div className={cn(
    'h-16 flex items-center justify-between px-6',
    'border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
    'bg-white/80 dark:bg-[var(--color-bg-dark)]/80',
    'backdrop-blur-[var(--blur-md)]',
    'sticky top-0 z-[var(--z-sticky)]',
    'shadow-[var(--shadow-sm)]',
    className
  )}>
    {children}
  </div>
)

export const ChannelTitle = ({
  children,
  icon,
  className
}: {
  children: ReactNode
  icon?: ReactNode
  className?: string
}) => (
  <div className={cn('flex items-center gap-3', className)}>
    {icon && (
      <div className={cn(
        'w-8 h-8 rounded-[var(--radius-md)]',
        'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10',
        'flex items-center justify-center',
        'text-[var(--color-primary)]'
      )}>
        {icon}
      </div>
    )}
    <h2 className="text-lg font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
      {children}
    </h2>
  </div>
)

interface SectionProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
}

export const Section = ({
  children,
  className,
  title,
  description
}: SectionProps) => (
  <section className={cn('mb-8', className)}>
    {(title || description) && (
      <div className="mb-6">
        {title && (
          <h3 className="text-xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mt-1">
            {description}
          </p>
        )}
      </div>
    )}
    {children}
  </section>
)
