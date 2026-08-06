/**
 * @deprecated 此组件已在页面结构重塑（Phase 1A-1D）中弃用。
 * 页面头部现由各 Page 组件自行渲染。
 * 后续清理阶段将删除此文件，请勿在新代码中引用。
 */
import { Button, Space, Avatar, Tooltip } from 'antd'
import { MoonOutlined, SunOutlined, BellOutlined, SearchOutlined, MenuOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useTheme } from '@renderer/hooks/useTheme'
import { useLayoutStore } from '@renderer/stores/layoutStore'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  showSearch?: boolean
  showNotifications?: boolean
  showUser?: boolean
  className?: string
}

export function Header({
  title,
  subtitle,
  actions,
  showSearch = false,
  showNotifications = false,
  showUser = false,
  className
}: HeaderProps) {
  const { currentBreakpoint, toggleMobileChannelSidebar } = useLayoutStore()

  return (
    <header
      className={cn(
        'flex items-center justify-between px-4',
        'border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
        'bg-white/80 dark:bg-[var(--color-bg-dark)]/80',
        'backdrop-blur-[var(--blur-xl)]',
        'transition-[var(--transition-colors)] duration-300',
        'sticky top-0 z-[var(--z-sticky)]',
        'shadow-[var(--shadow-sm)]',
        'flex-shrink-0',
        className
      )}
      style={{ height: 'var(--header-height)' }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        {currentBreakpoint === 'sm' && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={toggleMobileChannelSidebar}
            className={cn(
              'w-[44px] h-[44px] flex items-center justify-center',
              'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]',
              'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
              'transition-colors'
            )}
          />
        )}
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right Section */}
      <Space size="middle">
        {showSearch && (
          <Tooltip title="搜索">
            <Button
              type="text"
              icon={<SearchOutlined />}
              className={cn(
                'w-9 h-9 rounded-[var(--radius-lg)]',
                'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]',
                'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
                'hover:text-[var(--color-text-light)] dark:hover:text-[var(--color-text-dark)]',
                'transition-[var(--transition-all)]'
              )}
            />
          </Tooltip>
        )}
        {showNotifications && (
          <Tooltip title="通知">
            <Button
              type="text"
              icon={<BellOutlined />}
              className={cn(
                'w-9 h-9 rounded-[var(--radius-lg)]',
                'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]',
                'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
                'hover:text-[var(--color-text-light)] dark:hover:text-[var(--color-text-dark)]',
                'transition-[var(--transition-all)]'
              )}
            />
          </Tooltip>
        )}
        {showUser && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-lg)] hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)] transition-colors cursor-pointer">
            <Avatar
              size={32}
              className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold shadow-[var(--shadow-md)]"
            >
              U
            </Avatar>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">用户</div>
              <div className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">在线</div>
            </div>
          </div>
        )}
        {actions}
        <HeaderThemeToggle />
      </Space>
    </header>
  )
}

interface TitleProps {
  children: React.ReactNode
  className?: string
}

export function Title({ children, className }: TitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]', className)}>
      {children}
    </h2>
  )
}

interface HeaderActionsProps {
  children: React.ReactNode
  className?: string
}

export function HeaderActions({ children, className }: HeaderActionsProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {children}
    </div>
  )
}

export function HeaderThemeToggle() {
  const { theme, setTheme } = useTheme()

  const isLight = theme === 'sakura'

  return (
    <Tooltip title={isLight ? '切换到暗黑模式' : '切换到明亮模式'}>
      <Button
        type="text"
        icon={isLight ? <MoonOutlined /> : <SunOutlined />}
        className={cn(
          'w-9 h-9 rounded-[var(--radius-lg)] transition-[var(--transition-all)]',
          'hover:scale-110 active:scale-95',
          isLight
            ? 'text-[var(--color-text-secondary-light)] hover:bg-[var(--color-border-light)] dark:text-[var(--color-text-secondary-dark)] dark:hover:bg-[var(--color-bg-tertiary-dark)]'
            : 'text-[var(--color-text-secondary-dark)] hover:bg-[var(--color-bg-tertiary-dark)] dark:text-[var(--color-text-dark)] dark:hover:bg-[var(--color-border-dark)]'
        )}
        onClick={() => setTheme(isLight ? 'tech' : 'sakura')}
      />
    </Tooltip>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  iconColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon,
  iconColor = 'blue',
  badge,
  actions,
  className
}: PageHeaderProps) {
  const iconColors = {
    blue: 'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10 text-[var(--color-primary)]',
    green: 'bg-[var(--color-success-light)] dark:bg-[var(--color-success-light)]/10 text-[var(--color-success)]',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-[var(--color-warning-light)] dark:bg-[var(--color-warning-light)]/10 text-[var(--color-warning)]',
    red: 'bg-[var(--color-error-light)] dark:bg-[var(--color-error-light)]/10 text-[var(--color-error)]',
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4',
        'border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
        'bg-white dark:bg-[var(--color-bg-dark)]',
        'sticky top-0 z-[var(--z-sticky)]',
        'flex-shrink-0',
        className
      )}
      style={{ height: 'var(--header-height)' }}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className={cn(
            'w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center',
            iconColors[iconColor]
          )}>
            <span className="text-xl">{icon}</span>
          </div>
        )}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}
