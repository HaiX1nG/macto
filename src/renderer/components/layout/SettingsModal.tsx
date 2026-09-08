import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DesktopOutlined, AudioOutlined, VideoCameraOutlined, BellOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons'
import { useThemeStore, type AppTheme } from '@renderer/stores/themeStore'
import { SettingsProfile, SettingsAudio, SettingsVideo, SettingsNotifications } from '@renderer/features/settings'
import { cn } from '@renderer/utils/cn'
import { backdropVariants, modalVariants } from '@renderer/utils/animations'

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
    label: 'Japanese Sakura',
    description: 'Soft pink tones, warm and romantic',
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
    label: 'Chinese Ancient',
    description: 'Elegant gold and brown, classic and refined',
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
    label: 'Tech Neon',
    description: 'Cool neon blue, futuristic',
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
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      content: <SettingsProfile />,
    },
    {
      key: 'appearance',
      icon: <DesktopOutlined />,
      label: 'Appearance',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-normal)] mb-1">Theme</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Choose your preferred interface style</p>
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
                    Selected
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
      icon: <AudioOutlined />,
      label: 'Audio',
      content: <SettingsAudio />,
    },
    {
      key: 'video',
      icon: <VideoCameraOutlined />,
      label: 'Video',
      content: <SettingsVideo />,
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
      content: <SettingsNotifications />,
    },
    {
      key: 'about',
      icon: <InfoCircleOutlined />,
      label: 'About',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-normal)] mb-1">About Macto</h3>
          </div>
          <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] space-y-2">
            <p className="text-[var(--color-text-normal)]">Macto - KOOK-style voice chat application</p>
            <p className="text-sm text-[var(--color-text-muted)]">Version: 0.1.0</p>
          </div>
        </div>
      ),
    },
  ]

  const activeContent = tabs.find(tab => tab.key === activeTab)?.content

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            key="settings-backdrop"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-[var(--color-overlay)] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            key="settings-modal"
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'relative w-full max-w-[680px] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)]',
              'bg-[var(--color-bg-secondary)]',
              'border border-[var(--color-border)]'
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--color-border)]">
              <h3 className="text-xl font-bold text-[var(--color-text-normal)]">
                Settings
              </h3>
              <button
                onClick={onClose}
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  'text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]',
                  'hover:bg-[var(--color-bg-tertiary)]',
                  'transition-colors duration-150 ease-out',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30'
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex min-h-[380px]">
              {/* Sidebar Tabs */}
              <div className="w-52 border-r border-[var(--color-border)] py-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3',
                      'transition-colors duration-150 ease-out',
                      'text-left',
                      activeTab === tab.key
                        ? 'text-[var(--color-primary)] bg-[var(--color-bg-tertiary)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] hover:bg-[var(--color-bg-tertiary)]/50'
                    )}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 px-6 py-4 overflow-y-auto max-h-[60vh]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    {activeContent}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}