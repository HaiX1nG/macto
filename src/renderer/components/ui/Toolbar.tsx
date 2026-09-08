import React from 'react'
import { cn } from '@renderer/utils/cn'

/**
 * Toolbar Props Interface
 */
interface ToolbarProps {
  /** Additional class names */
  className?: string
  /** Child elements (typically buttons) */
  children: React.ReactNode
}

/**
 * ToolbarDivider Props Interface
 */
interface ToolbarDividerProps {
  /** Additional class names */
  className?: string
}

/**
 * ToolbarDivider - Vertical separator within a Toolbar
 */
export const ToolbarDivider = ({ className }: ToolbarDividerProps): React.ReactNode => (
  <div
    className={cn(
      'h-5 w-px bg-[var(--color-divider)] mx-1 flex-shrink-0',
      className
    )}
    aria-hidden="true"
  />
)

/**
 * Toolbar - A container for grouping action buttons with consistent spacing and styling
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Button variant="ghost" size="sm">Copy</Button>
 *   <Button variant="ghost" size="sm">Paste</Button>
 *   <ToolbarDivider />
 *   <Button variant="ghost" size="sm">Delete</Button>
 * </Toolbar>
 * ```
 */
export const Toolbar = ({ className, children }: ToolbarProps): React.ReactNode => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 rounded-lg',
        'bg-[var(--color-bg-tertiary)]/80',
        'backdrop-blur-sm',
        className
      )}
      role="toolbar"
    >
      {children}
    </div>
  )
}

Toolbar.displayName = 'Toolbar'
ToolbarDivider.displayName = 'ToolbarDivider'
