/**
 * Collapsible Component
 *
 * A sidebar that can be collapsed/expanded for responsive design
 */

import { useState, useEffect, useCallback } from 'react'
import { Tooltip } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

interface CollapsibleSidebarProps {
  children: React.ReactNode
  side: 'left' | 'right'
  defaultCollapsed?: boolean
  minWidth?: number
  maxWidth?: number
  className?: string
  showToggle?: boolean
  togglePosition?: 'inside' | 'outside'
  persistKey?: string
  onCollapseChange?: (collapsed: boolean) => void
}

export function CollapsibleSidebar({
  children,
  side,
  defaultCollapsed = false,
  minWidth = 0,
  maxWidth = 240,
  className,
  showToggle = true,
  togglePosition = 'outside',
  persistKey,
  onCollapseChange,
}: CollapsibleSidebarProps) {
  // Initialize from localStorage if persistKey provided
  const getInitialState = useCallback(() => {
    if (persistKey) {
      const stored = localStorage.getItem(`sidebar-collapsed-${persistKey}`)
      if (stored !== null) {
        return stored === 'true'
      }
    }
    return defaultCollapsed
  }, [persistKey, defaultCollapsed])

  const [collapsed, setCollapsed] = useState(getInitialState)

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !collapsed) {
        setCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [collapsed])

  const toggle = useCallback(() => {
    const newState = !collapsed
    setCollapsed(newState)
    onCollapseChange?.(newState)
    if (persistKey) {
      localStorage.setItem(`sidebar-collapsed-${persistKey}`, String(newState))
    }
  }, [collapsed, persistKey, onCollapseChange])

  const width = collapsed ? minWidth : maxWidth

  return (
    <div
      className={cn(
        'relative flex flex-col h-full transition-[width] duration-300 ease-out',
        className
      )}
      style={{ width }}
    >
      {/* Content */}
      <div
        className={cn(
          'flex-1 overflow-hidden transition-opacity duration-200 ease-out',
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        {children}
      </div>

      {/* Toggle button */}
      {showToggle && (
        <Tooltip
          title={collapsed ? '展开' : '收起'}
          placement={side === 'left' ? 'right' : 'left'}
        >
          <button
            onClick={toggle}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 z-20',
              'w-6 h-12 flex items-center justify-center',
              'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)]',
              'border border-[var(--color-border)]',
              'text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]',
              'transition-colors duration-150 ease-out',
              side === 'left' ? (
                togglePosition === 'outside'
                  ? 'right-[-24px] rounded-r-lg'
                  : 'right-0 rounded-l-lg'
              ) : (
                togglePosition === 'outside'
                  ? 'left-[-24px] rounded-l-lg'
                  : 'left-0 rounded-r-lg'
              ),
              'group'
            )}
          >
            {side === 'left' ? (
              collapsed ? (
                <RightOutlined className="text-xs group-hover:text-sm transition-transform duration-150 ease-out" />
              ) : (
                <LeftOutlined className="text-xs group-hover:text-sm transition-transform duration-150 ease-out" />
              )
            ) : (
              collapsed ? (
                <LeftOutlined className="text-xs group-hover:text-sm transition-transform duration-150 ease-out" />
              ) : (
                <RightOutlined className="text-xs group-hover:text-sm transition-transform duration-150 ease-out" />
              )
            )}
          </button>
        </Tooltip>
      )}
    </div>
  )
}

// Simple collapsible panel component
interface CollapsiblePanelProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
  className?: string
  headerClassName?: string
  onToggle?: (expanded: boolean) => void
}

export function CollapsiblePanel({
  title,
  children,
  defaultExpanded = true,
  className,
  headerClassName,
  onToggle,
}: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const toggle = () => {
    const newState = !expanded
    setExpanded(newState)
    onToggle?.(newState)
  }

  return (
    <div className={cn('mb-2', className)}>
      <button
        onClick={toggle}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-1.5',
          'text-xs font-semibold uppercase tracking-wide',
          'text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]',
          'transition-colors duration-150 ease-out',
          headerClassName
        )}
      >
        <LeftOutlined
          className={cn(
            'text-[10px] transition-transform duration-300 ease-out',
            !expanded && '-rotate-90'
          )}
        />
        <span>{title}</span>
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

// Responsive sidebar wrapper - handles mobile/desktop
interface ResponsiveSidebarProps {
  children: React.ReactNode
  className?: string
  mobilePosition?: 'left' | 'right'
}

export function ResponsiveSidebar({
  children,
  className,
  mobilePosition = 'left',
}: ResponsiveSidebarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) {
    return (
      <div className={className}>
        {children}
      </div>
    )
  }

  // Mobile: show as overlay
  return (
    <>
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed top-0 bottom-0 z-50',
          mobilePosition === 'left' ? 'left-0' : 'right-0',
          'transition-transform duration-300 ease-out',
          mobileOpen
            ? 'translate-x-0'
            : mobilePosition === 'left'
              ? '-translate-x-full'
              : 'translate-x-full',
          className
        )}
      >
        {children}
      </div>

      {/* Toggle button (mobile only) */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className={cn(
          'fixed top-4 z-50 md:hidden',
          mobilePosition === 'left' ? 'left-4' : 'right-4',
          'w-10 h-10 rounded-full',
          'bg-[var(--color-bg-secondary)] border border-[var(--color-border)]',
          'flex items-center justify-center',
          'text-[var(--color-text-muted)]'
        )}
      >
        {mobileOpen ? (
          <MenuFoldOutlined />
        ) : (
          <MenuUnfoldOutlined />
        )}
      </button>
    </>
  )
}

export default CollapsibleSidebar