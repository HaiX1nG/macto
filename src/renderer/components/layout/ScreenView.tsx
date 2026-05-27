/**
 * ScreenView Component
 *
 * The screen sharing view for real-time screen sharing.
 */

import React, { useState } from 'react'
import { Button, Typography, Modal } from 'antd'
import { VideoCameraOutlined, VideoCameraAddOutlined, DesktopOutlined, CloseOutlined, WindowsOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { Skeleton } from '@renderer/components/ui/Skeleton'
import { getAvatarGradient, getAvatarInitial } from '@renderer/utils/avatar'
import { statusColorMap } from '@renderer/utils/status'
import type { ScreenParticipant } from '@shared/types/participant'

const { Text } = Typography

interface Screen {
  id: string
  name: string
  icon: React.ReactNode
  thumbnail?: string
}

interface ScreenViewProps {
  isSharing?: boolean
  availableScreens?: Screen[]
  participants?: ScreenParticipant[]
  onShare?: (screenId: string) => void
  onUnshare?: () => void
  onScreenSelectionCancel?: () => void
  loading?: boolean
}

export const ScreenView: React.FC<ScreenViewProps> = ({
  isSharing = false,
  availableScreens = [],
  participants = [],
  onShare,
  onUnshare,
  onScreenSelectionCancel,
  loading = false,
}) => {
  const [showScreenSelector, setShowScreenSelector] = useState(false)

  const screens = availableScreens.length > 0 ? availableScreens : [
    { id: 'desktop', name: '整个屏幕', icon: <DesktopOutlined /> },
    { id: 'window', name: '特定窗口', icon: <WindowsOutlined /> },
    { id: 'browser', name: '浏览器标签页', icon: <VideoCameraOutlined /> },
  ]

  return (
    <div className="flex h-screen bg-[var(--color-bg-secondary)] animate-fade-in will-change-[opacity]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={cn(
          'h-[var(--header-height)] bg-[var(--color-bg-base)]',
          'border-b border-[var(--color-border)]',
          'flex items-center justify-between px-6',
          'sticky top-0 z-10',
          'transition-colors duration-200'
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-10 h-10 rounded-xl',
              'bg-[var(--color-accent)]/10',
              'flex items-center justify-center',
              'text-[var(--color-accent)]'
            )}>
              <VideoCameraOutlined className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-normal)]">屏幕分享</h1>
              <Text className="text-xs text-[var(--color-text-muted)]">实时屏幕共享</Text>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isSharing && (
              <span className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full',
                'bg-[var(--color-online)]/10',
                'text-[var(--color-online)]',
                'text-sm font-medium animate-pulse'
              )}>
                <span className="w-2 h-2 bg-[var(--color-online)] rounded-full" />
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
                  ? 'text-[var(--color-dnd)] hover:bg-[var(--color-dnd)]/10'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]'
              )}
            />
          </div>
        </div>

        {/* Screen Preview */}
        <div className="flex-1 p-6 flex items-center justify-center overflow-y-auto pb-72">
          {loading ? (
            <div className="w-full max-w-4xl space-y-6">
              <Skeleton variant="rounded" height={256} className="rounded-2xl" />
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={120} className="rounded-xl" />
                ))}
              </div>
            </div>
          ) : !isSharing ? (
            <div className="flex flex-col items-center text-center">
              <EmptyState
                iconType="video"
                title="开始屏幕分享"
                description="选择要分享的屏幕，与频道中的其他成员实时共享"
                action={{
                  label: '选择屏幕',
                  onClick: () => setShowScreenSelector(true),
                  icon: <DesktopOutlined />,
                  variant: 'primary',
                }}
                size="lg"
              />

              {/* Quick Selection */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                {screens.map((screen) => (
                  <div
                    key={screen.id}
                    onClick={() => onShare?.(screen.id)}
                    className={cn(
                      'p-5 rounded-xl cursor-pointer',
                      'bg-[var(--color-bg-base)]',
                      'border border-[var(--color-border)]',
                      'hover:border-[var(--color-accent)]',
                      'hover:shadow-xl hover:-translate-y-1',
                      'transition-[transform,box-shadow,border-color] duration-200 group'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 mx-auto mb-4 rounded-xl',
                      'bg-[var(--color-accent)]/10',
                      'flex items-center justify-center',
                      'text-[var(--color-accent)]',
                      'group-hover:scale-110 transition-transform'
                    )}>
                      <span className="text-2xl">{screen.icon}</span>
                    </div>
                    <h4 className="font-semibold text-[var(--color-text-normal)] mb-2 text-center">
                      {screen.name}
                    </h4>
                    <p className="text-sm text-[var(--color-text-muted)] text-center">
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
                'w-16 h-16 rounded-2xl',
                'bg-[var(--color-bg-darker)]',
                'flex items-center justify-center mb-6',
                'animate-pulse'
              )}>
                <VideoCameraOutlined className="text-4xl text-[var(--color-accent)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-normal)] mb-2">
                正在分享屏幕
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">
                其他成员可以看到您的屏幕内容
              </p>
              <Button
                danger
                size="large"
                icon={<CloseOutlined />}
                onClick={onUnshare}
                className="px-8 rounded-xl font-semibold"
              >
                停止分享
              </Button>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className={cn(
          'h-64 bg-[var(--color-bg-base)]',
          'border-t border-[var(--color-border)]',
          'p-5 overflow-y-auto',
          'transition-colors duration-200'
        )}>
          <div className="flex items-center justify-between mb-4">
            <Text className="font-semibold text-[var(--color-text-normal)]">
              参与者 ({participants.length})
            </Text>
            <Button
              type="text"
              icon={<VideoCameraAddOutlined />}
              onClick={() => setShowScreenSelector(true)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
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
        zIndex={2000}
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
                'border-2 border-dashed border-[var(--color-border)]',
                'hover:border-[var(--color-primary)]',
                'hover:bg-[var(--color-primary)]/5',
                'transition-[border-color,background-color] duration-150 group'
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-16 h-12 rounded-lg',
                  'bg-[var(--color-bg-tertiary)]',
                  'flex items-center justify-center',
                  'group-hover:scale-110 transition-transform'
                )}>
                  <span className="text-2xl text-[var(--color-text-muted)]">
                    {screen.icon}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-text-normal)]">
                    {screen.name}
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)]">
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
  participant: ScreenParticipant
}

const ParticipantItem = ({ participant }: ParticipantItemProps) => {
  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-xl',
      'hover:bg-[var(--color-bg-tertiary)]',
      'transition-colors group'
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          'text-sm font-bold text-white shadow-md',
          getAvatarGradient(participant.name)
        )}>
          {getAvatarInitial(participant.name)}
        </div>
        <div>
          <div className="font-medium text-[var(--color-text-normal)]">
            {participant.name}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {participant.isSharingScreen ? '正在分享屏幕' : '观看中'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-2.5 h-2.5 rounded-full',
          statusColorMap[participant.status]
        )} />
        {participant.isSharingScreen && (
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            'bg-[var(--color-online)]/10',
            'text-[var(--color-online)]'
          )}>
            分享中
          </span>
        )}
      </div>
    </div>
  )
}
