import { useSettings } from '@renderer/hooks/useSettings'
import { Card, Switch } from 'antd'
import { MoonOutlined, SunOutlined, DesktopOutlined, BellOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

export const SettingsGeneral = () => {
  const { theme, setTheme, autoJoinLastSession, setAutoJoinLastSession, showNotification, setShowNotification } = useSettings()

  const themeOptions = [
    { value: 'light', label: '明亮', icon: <SunOutlined />, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { value: 'dark', label: '暗黑', icon: <MoonOutlined />, color: 'bg-blue-900 text-blue-400 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'system', label: '系统', icon: <DesktopOutlined />, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card
        className={cn(
          'rounded-[var(--radius-2xl)]',
          'hover:shadow-[var(--shadow-lg)] transition-shadow'
        )}
        styles={{ body: { padding: '24px' } }}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn(
              'w-10 h-10 rounded-[var(--radius-xl)]',
              'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10',
              'flex items-center justify-center',
              'text-[var(--color-primary)] dark:text-[var(--color-primary)]'
            )}>
              <DesktopOutlined className="text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">外观</h3>
              <p className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">自定义应用外观</p>
            </div>
          </div>

          <div>
            <span className="font-semibold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] mb-4 block">
              主题模式
            </span>
            <div className="grid grid-cols-3 gap-4">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                  className={cn(
                    'p-4 rounded-[var(--radius-xl)] border-2 cursor-pointer',
                    'transition-[var(--transition-all)]',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    theme === option.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10 shadow-[var(--shadow-md)]'
                      : 'border-[var(--color-border-light)] dark:border-[var(--color-border-dark)] hover:border-[var(--color-border-secondary-light)] dark:hover:border-[var(--color-border-secondary-dark)]'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-[var(--radius-xl)] mx-auto mb-3',
                    'flex items-center justify-center',
                    option.color
                  )}>
                    {option.icon}
                  </div>
                  <span className="font-medium text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] text-sm">
                    {option.label}
                  </span>
                  {theme === option.value && (
                    <div className="mt-2 text-xs text-[var(--color-primary)] dark:text-[var(--color-primary)] font-medium">
                      已选择
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card
        className={cn(
          'rounded-[var(--radius-2xl)]',
          'hover:shadow-[var(--shadow-lg)] transition-shadow'
        )}
        styles={{ body: { padding: '24px' } }}
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn(
              'w-10 h-10 rounded-[var(--radius-xl)]',
              'bg-purple-100 dark:bg-purple-900/30',
              'flex items-center justify-center',
              'text-purple-600 dark:text-purple-400'
            )}>
              <BellOutlined className="text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">偏好设置</h3>
              <p className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">应用偏好设置</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-[var(--radius-xl)] bg-[var(--color-bg-tertiary-light)] dark:bg-[var(--color-bg-tertiary-dark)]/50">
            <div className="flex items-center gap-3">
              <DesktopOutlined className="text-lg text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]" />
              <div>
                <span className="font-medium text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
                  自动加入上次会话
                </span>
                <p className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mt-0.5">
                  启动时自动加入上次会话
                </p>
              </div>
            </div>
            <Switch
              checked={autoJoinLastSession}
              onChange={setAutoJoinLastSession}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-[var(--radius-xl)] bg-[var(--color-bg-tertiary-light)] dark:bg-[var(--color-bg-tertiary-dark)]/50">
            <div className="flex items-center gap-3">
              <BellOutlined className="text-lg text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]" />
              <div>
                <span className="font-medium text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
                  显示通知
                </span>
                <p className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mt-0.5">
                  接收桌面通知
                </p>
              </div>
            </div>
            <Switch
              checked={showNotification}
              onChange={setShowNotification}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}