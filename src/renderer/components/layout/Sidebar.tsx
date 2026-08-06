/**
 * @deprecated 此组件已在页面结构重塑（Phase 1A-1D）中弃用。
 * 侧边栏现由 ServerSidebar / ChannelSidebar 替代。
 * 后续清理阶段将删除此文件，请勿在新代码中引用。
 */
import { Menu, Badge, Avatar, Tooltip, Button } from 'antd'
import { HomeOutlined, MoonOutlined, SunOutlined, TeamOutlined, AudioOutlined, VideoCameraOutlined, SettingOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useTheme } from '@renderer/hooks/useTheme'
import { useLayoutStore, SIDEBAR_WIDTHS } from '@renderer/stores/layoutStore'

interface SidebarProps {
  children: React.ReactNode
  className?: string
  collapsed?: boolean
  variant?: 'primary' | 'secondary'
}

export function Sidebar({ children, className, collapsed = false, variant = 'primary' }: SidebarProps) {
  const width = collapsed ? SIDEBAR_WIDTHS.channelCollapsed : SIDEBAR_WIDTHS.channel

  return (
    <aside
      className={cn(
        'flex-shrink-0 h-full',
        'flex flex-col',
        'transition-all duration-300 ease-out',
        'will-change-[width]',
        variant === 'primary' && 'bg-white dark:bg-[var(--color-bg-dark)] border-r border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
        variant === 'secondary' && 'bg-[var(--color-bg-secondary)]',
        className
      )}
      style={{ width }}
    >
      {children}
    </aside>
  )
}

export function SidebarHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      'px-4 py-4 border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
      'bg-gradient-to-r from-[var(--color-sidebar-header-gradient-start)] to-[var(--color-sidebar-header-gradient-end)]',
      'flex-shrink-0'
    )}>
      {children}
    </div>
  )
}

export function SidebarNav({ children }: { children: React.ReactNode }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
      {children}
    </nav>
  )
}

interface SidebarNavItemProps {
  active?: boolean
  icon?: React.ReactNode
  badge?: number
  onClick?: () => void
  children?: React.ReactNode
}

export function SidebarNavItem({ active, icon, badge, onClick, children }: SidebarNavItemProps) {
  return (
    <Menu.Item
      icon={icon}
      className={cn(
        'text-sm font-medium rounded-[var(--radius-lg)]',
        'transition-all duration-200 ease-out',
        'hover:scale-[1.02] active:scale-[0.98]',
        active
          ? cn(
              'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10',
              'text-[var(--color-primary)] dark:text-[var(--color-primary)]',
              'border-r-4 border-[var(--color-primary)]'
            )
          : 'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]'
      )}
      onClick={onClick}
    >
      <span className="flex-1">{children}</span>
      {badge !== undefined && badge > 0 && (
        <Badge
          count={badge}
          size="small"
          className="ml-2"
          style={{ backgroundColor: '#f5222d' }}
        />
      )}
    </Menu.Item>
  )
}

export function SidebarSection({ children, title }: { children: React.ReactNode, title?: string }) {
  return (
    <div className="px-4 py-3">
      {title && (
        <p className="text-xs font-semibold text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
          {title}
        </p>
      )}
      {children}
    </div>
  )
}

export function SidebarChannel({
  children,
  active,
  onClick,
  icon,
}: {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  icon?: React.ReactNode
  type?: 'text' | 'voice'
}) {
  return (
    <Menu.Item
      icon={icon}
      className={cn(
        'text-sm font-medium rounded-[var(--radius-lg)]',
        'transition-all duration-200 ease-out',
        'hover:scale-[1.01] active:scale-[0.99]',
        active
          ? cn(
              'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10',
              'text-[var(--color-primary)] dark:text-[var(--color-primary)]',
              'shadow-[var(--shadow-sm)]'
            )
          : 'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]'
      )}
      onClick={onClick}
    >
      {children}
    </Menu.Item>
  )
}

export function SidebarFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      'px-4 py-4 border-t border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
      'bg-[var(--color-bg-secondary-light)]/50 dark:bg-[var(--color-bg-dark)]/50',
      'flex-shrink-0'
    )}>
      {children}
    </div>
  )
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const isLight = theme === 'sakura'

  return (
    <Tooltip title={isLight ? '切换到暗黑模式' : '切换到明亮模式'}>
      <Button
        type="text"
        icon={isLight ? <MoonOutlined /> : <SunOutlined />}
        className={cn(
          'w-10 h-10 rounded-[var(--radius-lg)]',
          'transition-all duration-150 ease-out',
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

export function UserAvatar({ name, size = 'default' }: { name: string, size?: 'small' | 'default' | 'large' }) {
  const colors = [
    'bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)]',
    'bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)]',
    'bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)]',
    'bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)]',
    'bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)]',
    'bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)]',
  ]

  const colorIndex = name.charCodeAt(0) % colors.length
  const color = colors[colorIndex]

  const sizeMap = {
    small: 32,
    default: 40,
    large: 48,
  }

  return (
    <Avatar
      size={sizeMap[size]}
      className={cn(color, 'text-white font-bold shadow-[var(--shadow-lg)]')}
    >
      {name.charAt(0).toUpperCase()}
    </Avatar>
  )
}

// Main Navigation Sidebar Component
interface MainSidebarProps {
  activeTab?: 'home' | 'channel' | 'voice' | 'screen' | 'settings'
  onTabChange?: (tab: 'home' | 'channel' | 'voice' | 'screen' | 'settings') => void
  channels?: Array<{
    id: string
    name: string
    type: 'voice' | 'video' | 'meeting'
    unread?: number
  }>
  onEnterChannel?: () => void
  onCreateChannel?: () => void
}

export function MainSidebar({
  activeTab = 'home',
  onTabChange,
  channels = [],
}: MainSidebarProps) {
  const { channelSidebarCollapsed } = useLayoutStore()

  return (
    <Sidebar collapsed={channelSidebarCollapsed}>
      {/* Logo Header */}
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl',
            'bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)]',
            'flex items-center justify-center',
            'text-white font-bold text-lg',
            'shadow-[var(--shadow-lg)] shadow-[var(--color-primary)]/30'
          )}>
            M
          </div>
          {!channelSidebarCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">Macto</h1>
              <p className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">语音 & 屏幕</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarNav>
        <SidebarNavItem
          active={activeTab === 'home'}
          icon={<HomeOutlined />}
          onClick={() => onTabChange?.('home')}
        >
          首页
        </SidebarNavItem>
        <SidebarNavItem
          active={activeTab === 'channel'}
          icon={<TeamOutlined />}
          badge={channels.filter(c => c.unread && c.unread > 0).length}
          onClick={() => onTabChange?.('channel')}
        >
          频道列表
        </SidebarNavItem>
        <SidebarNavItem
          active={activeTab === 'voice'}
          icon={<AudioOutlined />}
          onClick={() => onTabChange?.('voice')}
        >
          语音频道
        </SidebarNavItem>
        <SidebarNavItem
          active={activeTab === 'screen'}
          icon={<VideoCameraOutlined />}
          onClick={() => onTabChange?.('screen')}
        >
          屏幕分享
        </SidebarNavItem>
        <SidebarNavItem
          active={activeTab === 'settings'}
          icon={<SettingOutlined />}
          onClick={() => onTabChange?.('settings')}
        >
          设置
        </SidebarNavItem>
      </SidebarNav>

      {/* Footer */}
      <SidebarFooter>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar name="用户" size="small" />
            {!channelSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] truncate">用户</div>
                <div className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">在线</div>
              </div>
            )}
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
