/**
 * ScreenView Component
 *
 * The screen sharing view for real-time screen sharing.
 */

import React, { useState } from 'react'
import { Button, Typography, Modal } from 'antd'
import { VideoCameraOutlined, VideoCameraAddOutlined, DesktopOutlined, CloseOutlined, WindowsOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

const { Text } = Typography

interface Screen {
  id: string
  name: string
  icon: React.ReactNode
  thumbnail?: string
}

interface Participant {
  id: string
  name: string
  status: 'online' | 'away' | 'busy'
  isSharingScreen?: boolean
}

interface ScreenViewProps {
  isSharing?: boolean
  availableScreens?: Screen[]
  participants?: Participant[]
  onShare?: (screenId: string) => void
  onUnshare?: () => void
  onScreenSelectionCancel?: () => void
}

export const ScreenView: React.FC<ScreenViewProps> = ({
  isSharing = false,
  availableScreens = [],
  participants = [],
  onShare,
  onUnshare,
  onScreenSelectionCancel,
}) => {
  const [showScreenSelector, setShowScreenSelector] = useState(false)

  const screens = availableScreens.length > 0 ? availableScreens : [
    { id: 'desktop', name: '整个屏幕', icon: <DesktopOutlined /> },
    { id: 'window', name: '特定窗口', icon: <WindowsOutlined /> },
    { id: 'browser', name: '浏览器标签页', icon: <VideoCameraOutlined /> },
  ]

  return (
    <div className="flex h-screen bg-[var(--color-bg-secondary-light)] dark:bg-[var(--color-bg-dark)] transition-colors duration-300">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={cn(
          'h-16 bg-white dark:bg-[var(--color-bg-dark)]',
          'border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
          'flex items-center justify-between px-6',
          'sticky top-0 z-10',
          'transition-colors duration-300'
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-10 h-10 rounded-xl',
              'bg-purple-100 dark:bg-purple-900/30',
              'flex items-center justify-center',
              'text-purple-600 dark:text-purple-400'
            )}>
              <VideoCameraOutlined className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">屏幕分享</h1>
              <Text type="secondary" className="text-xs">实时屏幕共享</Text>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isSharing && (
              <span className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full',
                'bg-[var(--color-success-light)] dark:bg-[var(--color-success-light)]/10',
                'text-[var(--color-success)] dark:text-[var(--color-success)]',
                'text-sm font-medium animate-pulse'
              )}>
                <span className="w-2 h-2 bg-[var(--color-success)] rounded-full" />
                正在分享
              </span>
            )}
            <Button
              type="text"
              icon={isSharing ? <CloseOutlined /> : <VideoCameraAddOutlined />}
              onClick={isSharing ? onUnshare : () => setShowScreenSelector(true)}
              className={cn(
                'w-10 h-10 rounded-xl',
                isSharing
                  ? 'text-[var(--color-error)] hover:bg-[var(--color-error-light)] dark:hover:bg-[var(--color-error-light)]/10'
                  : 'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]'
              )}
            />
          </div>
        </div>

        {/* Screen Preview */}
        <div className="flex-1 p-6 flex items-center justify-center overflow-y-auto pb-72">
          {!isSharing ? (
            <div className="text-center max-w-2xl">
              <div className={cn(
                'w-32 h-32 mx-auto mb-8 rounded-3xl',
                'bg-gradient-to-br from-purple-500 to-[var(--color-primary)]',
                'flex items-center justify-center',
                'shadow-2xl shadow-purple-500/30'
              )}>
                <VideoCameraAddOutlined className="text-6xl text-white" />
              </div>
              <h3 className="text-3xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] mb-4">
                开始屏幕分享
              </h3>
              <p className="text-lg text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-10">
                选择要分享的屏幕，与频道中的其他成员实时共享
              </p>
              <Button
                type="primary"
                size="large"
                icon={<DesktopOutlined />}
                onClick={() => setShowScreenSelector(true)}
                className="px-10 rounded-xl font-semibold"
              >
                选择屏幕
              </Button>

              {/* Quick Selection */}
              <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
                {screens.map((screen) => (
                  <div
                    key={screen.id}
                    onClick={() => onShare?.(screen.id)}
                    className={cn(
                      'p-6 rounded-2xl cursor-pointer',
                      'bg-white dark:bg-[var(--color-bg-tertiary-dark)]',
                      'border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
                      'hover:border-purple-500 dark:hover:border-purple-500',
                      'hover:shadow-xl hover:-translate-y-1',
                      'transition-all duration-300 group'
                    )}
                  >
                    <div className={cn(
                      'w-14 h-14 mx-auto mb-4 rounded-xl',
                      'bg-purple-100 dark:bg-purple-900/30',
                      'flex items-center justify-center',
                      'text-purple-600 dark:text-purple-400',
                      'group-hover:scale-110 transition-transform'
                    )}>
                      <span className="text-2xl">{screen.icon}</span>
                    </div>
                    <h4 className="font-semibold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] mb-2">
                      {screen.name}
                    </h4>
                    <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                      {screen.id === 'desktop' && '分享整个显示器'}
                      {screen.id === 'window' && '选择要分享的应用窗口'}
                      {screen.id === 'browser' && '分享浏览器中的特定标签页'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className={cn(
                'w-40 h-40 rounded-3xl',
                'bg-gradient-to-br from-purple-500 to-[var(--color-primary)]',
                'flex items-center justify-center',
                'shadow-2xl shadow-purple-500/30 animate-pulse'
              )}>
                <VideoCameraOutlined className="text-8xl text-white" />
              </div>
              <h3 className="text-3xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] mt-8 mb-4">
                正在分享屏幕
              </h3>
              <p className="text-lg text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-10">
                其他成员可以看到您的屏幕内容
              </p>
              <Button
                danger
                size="large"
                icon={<CloseOutlined />}
                onClick={onUnshare}
                className="px-10 rounded-xl font-semibold"
              >
                停止分享
              </Button>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className={cn(
          'h-64 bg-white dark:bg-[var(--color-bg-dark)]',
          'border-t border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
          'p-5 overflow-y-auto',
          'transition-colors duration-300'
        )}>
          <div className="flex items-center justify-between mb-4">
            <Text className="font-semibold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
              参与者 ({participants.length})
            </Text>
            <Button
              type="text"
              icon={<VideoCameraAddOutlined />}
              onClick={() => setShowScreenSelector(true)}
              className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] hover:text-[var(--color-primary)]"
            >
              分享屏幕
            </Button>
          </div>
          <div className="space-y-2">
            {participants.map((participant) => (
              <ParticipantItem key={participant.id} participant={participant} />
            ))}
          </div>
        </div>
      </div>

      {/* Screen Selection Modal */}
      <Modal
        title="选择要分享的屏幕"
        open={showScreenSelector}
        onCancel={() => {
          setShowScreenSelector(false)
          onScreenSelectionCancel?.()
        }}
        footer={null}
        width={600}
        style={{ borderRadius: '16px' }}
      >
        <div className="space-y-4 py-4">
          {screens.map((screen) => (
            <div
              key={screen.id}
              onClick={() => {
                onShare?.(screen.id)
                setShowScreenSelector(false)
              }}
              className={cn(
                'p-5 rounded-xl cursor-pointer',
                'border-2 border-dashed border-gray-300 dark:border-gray-600',
                'hover:border-blue-500 dark:hover:border-blue-500',
                'hover:bg-blue-50 dark:hover:bg-blue-900/20',
                'transition-all duration-200 group'
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-16 h-12 rounded-lg',
                  'bg-gray-200 dark:bg-gray-700',
                  'flex items-center justify-center',
                  'group-hover:scale-110 transition-transform'
                )}>
                  <span className="text-2xl text-gray-600 dark:text-gray-400">
                    {screen.icon}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {screen.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {screen.id === 'desktop' && '分享整个显示器'}
                    {screen.id === 'window' && '选择要分享的应用窗口'}
                    {screen.id === 'browser' && '分享浏览器中的特定标签页'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

interface ParticipantItemProps {
  participant: Participant
}

const ParticipantItem = ({ participant }: ParticipantItemProps) => {
  const statusColors = {
    online: 'bg-[var(--color-success)] shadow-[var(--color-success)]/30',
    away: 'bg-[var(--color-warning)] shadow-[var(--color-warning)]/30',
    busy: 'bg-[var(--color-error)] shadow-[var(--color-error)]/30',
  }

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'bg-gradient-to-br from-[var(--color-primary)] to-purple-600',
      'bg-gradient-to-br from-[var(--color-success)] to-teal-600',
      'bg-gradient-to-br from-orange-500 to-[var(--color-error)]',
      'bg-gradient-to-br from-pink-500 to-rose-600',
    ]
    return gradients[name.charCodeAt(0) % gradients.length]
  }

  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-xl',
      'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
      'transition-colors group'
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          'text-sm font-bold text-white shadow-md',
          getAvatarGradient(participant.name),
          statusColors[participant.status]
        )}>
          {participant.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
            {participant.name}
          </div>
          <div className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
            {participant.isSharingScreen ? '正在分享屏幕' : '观看中'}
          </div>
        </div>
      </div>
      {participant.isSharingScreen && (
        <span className={cn(
          'px-3 py-1 rounded-full text-xs font-medium',
          'bg-[var(--color-success-light)] dark:bg-[var(--color-success-light)]/10',
          'text-[var(--color-success)] dark:text-[var(--color-success)]'
        )}>
          分享中
        </span>
      )}
    </div>
  )
}