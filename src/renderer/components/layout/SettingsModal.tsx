import { Modal, Tabs } from 'antd'
import { DesktopOutlined, AudioOutlined, VideoCameraOutlined, BellOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons'
import { useThemeStore, type AppTheme } from '@renderer/stores/themeStore'
import { SettingsProfile } from '@renderer/features/settings'
import { cn } from '@renderer/utils/cn'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

const themeOptions: Array<{
  value: AppTheme
  label: string
  description: string
  preview: React.ReactNode
}> = [
  {
    value: 'sakura',
    label: '日本樱花风',
    description: '柔和的粉色系，温馨浪漫',
    preview: (
      <div className="flex gap-1">
        <div className="w-5 h-5 rounded bg-[#f8b4c4]" />
        <div className="w-5 h-5 rounded bg-[#ffd6e0]" />
        <div className="w-5 h-5 rounded bg-[#fff5f7]" />
      </div>
    ),
  },
  {
    value: 'ancient',
    label: '中国古风',
    description: '典雅的金棕色，古朴大气',
    preview: (
      <div className="flex gap-1">
        <div className="w-5 h-5 rounded bg-[#c9a86c]" />
        <div className="w-5 h-5 rounded bg-[#231e19]" />
        <div className="w-5 h-5 rounded bg-[#e8dcc8]" />
      </div>
    ),
  },
  {
    value: 'tech',
    label: '科技风',
    description: '炫酷的霓虹蓝，未来感十足',
    preview: (
      <div className="flex gap-1">
        <div className="w-5 h-5 rounded bg-[#00d4ff]" />
        <div className="w-5 h-5 rounded bg-[#7b2dff]" />
        <div className="w-5 h-5 rounded bg-[#0a0e17]" />
      </div>
    ),
  },
]

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useThemeStore()

  const items = [
    {
      key: 'profile',
      label: (
        <span className="flex items-center gap-2 px-2">
          <UserOutlined />
          <span>个人资料</span>
        </span>
      ),
      children: <SettingsProfile />,
    },
    {
      key: 'appearance',
      label: (
        <span className="flex items-center gap-2 px-2">
          <DesktopOutlined />
          <span>外观</span>
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-normal)] mb-1">主题</h3>
            <p className="text-sm text-[var(--color-text-muted)]">选择您喜欢的界面风格</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  'p-3 rounded-lg border-2 cursor-pointer text-left',
                  'transition-all duration-200',
                  theme === t.value
                    ? 'border-[var(--color-primary)] bg-[var(--color-bg-tertiary)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                )}
              >
                <div className="mb-2">{t.preview}</div>
                <h4 className="font-semibold text-[var(--color-text-normal)] text-sm">{t.label}</h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{t.description}</p>
                {theme === t.value && (
                  <div className="mt-2 text-xs text-[var(--color-primary)] font-medium">
                    ✓ 已选择
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'audio',
      label: (
        <span className="flex items-center gap-2 px-2">
          <AudioOutlined />
          <span>音频</span>
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-normal)] mb-1">音频设置</h3>
            <p className="text-sm text-[var(--color-text-muted)]">配置麦克风和扬声器</p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] text-center">
            <p className="text-[var(--color-text-muted)]">音频设置功能开发中...</p>
          </div>
        </div>
      ),
    },
    {
      key: 'video',
      label: (
        <span className="flex items-center gap-2 px-2">
          <VideoCameraOutlined />
          <span>视频</span>
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-normal)] mb-1">视频设置</h3>
            <p className="text-sm text-[var(--color-text-muted)]">配置摄像头和画质</p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] text-center">
            <p className="text-[var(--color-text-muted)]">视频设置功能开发中...</p>
          </div>
        </div>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span className="flex items-center gap-2 px-2">
          <BellOutlined />
          <span>通知</span>
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-normal)] mb-1">通知设置</h3>
            <p className="text-sm text-[var(--color-text-muted)]">管理消息提醒</p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] text-center">
            <p className="text-[var(--color-text-muted)]">通知设置功能开发中...</p>
          </div>
        </div>
      ),
    },
    {
      key: 'about',
      label: (
        <span className="flex items-center gap-2 px-2">
          <InfoCircleOutlined />
          <span>关于</span>
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-normal)] mb-1">关于 Macto</h3>
          </div>
          <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] space-y-2">
            <p className="text-[var(--color-text-normal)]">Macto - KOOK 风格语音聊天应用</p>
            <p className="text-sm text-[var(--color-text-muted)]">版本: 0.1.0</p>
          </div>
        </div>
      ),
    },
  ]

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      title={
        <span className="text-[var(--color-text-normal)] font-semibold">设置</span>
      }
      styles={{
        content: {
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          border: 'none',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
        header: {
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-normal)',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '0',
          padding: '16px 24px',
        },
        body: {
          backgroundColor: 'var(--color-bg-secondary)',
          padding: '16px 24px 24px',
        },
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
      classNames={{
        content: 'settings-modal-content',
      }}
    >
      <Tabs
        defaultActiveKey="profile"
        items={items}
        tabPlacement="left"
        style={{ minHeight: 380 }}
        styles={{
          inkBar: {
            backgroundColor: 'var(--color-primary)',
            width: 3,
          },
          tab: {
            color: 'var(--color-text-muted)',
            padding: '8px 12px',
          },
        }}
      />
    </Modal>
  )
}