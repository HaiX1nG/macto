import { useState } from 'react'
import { cn } from '@renderer/utils/cn'
import { Button } from '@renderer/components/ui/Button'
import { PlaylistItem } from './PlaylistItem'
import { AddPlaylistItemModal } from './AddPlaylistItemModal'
import { usePlaylistStore } from '@renderer/stores/playlistStore'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'

interface PlaylistPanelProps {
  roomId: number
  className?: string
}

export const PlaylistPanel = ({ roomId, className }: PlaylistPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const {
    playlist,
    playlistLoading,
    fetchPlaylist,
    playPlaylist,
    pausePlaylist,
    skipPlaylist,
  } = usePlaylistStore()

  const isPlaying = playlist.some(i => i.status === 2)
  const currentItem = playlist.find(i => i.status === 2)

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pausePlaylist(roomId)
    } else {
      await playPlaylist(roomId)
    }
  }

  const handleSkip = async () => {
    await skipPlaylist(roomId)
  }

  const handleAddSuccess = async () => {
    await fetchPlaylist(roomId)
    setIsAddModalOpen(false)
  }

  return (
    <div
      className={cn(
        'bg-[var(--color-bg-base)] rounded-2xl',
        'border border-[var(--color-border)]',
        'transition-all duration-300',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'border-b border-[var(--color-border)]',
          'cursor-pointer select-none'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
            )}
          >
            {isExpanded ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-normal)]">
              播放列表
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {playlist.length} 首歌曲
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {playlist.some(i => i.status === 2) && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--color-online)]/10 text-[var(--color-online)] text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-[var(--color-online)] rounded-full animate-pulse" />
              播放中
            </span>
          )}
          <Button
            variant="ghost"
            icon={<PlusOutlined />}
            className="px-3 py-1.5 text-xs rounded-lg"
            onClick={(e) => {
              e.stopPropagation()
              setIsAddModalOpen(true)
            }}
          >
            添加
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {currentItem && (
            <div
              className={cn(
                'mb-4 p-3 rounded-xl',
                'bg-[var(--color-primary)]/5',
                'border border-[var(--color-primary)]/20'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--color-primary)]">
                    正在播放
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePlayPause}
                    disabled={playlistLoading}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      'text-[var(--color-primary)]',
                      'hover:bg-[var(--color-primary)]/10',
                      'transition-colors duration-150',
                      'disabled:opacity-50'
                    )}
                  >
                    {isPlaying ? (
                      <PauseCircleOutlined className="text-xl" />
                    ) : (
                      <PlayCircleOutlined className="text-xl" />
                    )}
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={playlistLoading}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      'text-[var(--color-text-muted)]',
                      'hover:bg-[var(--color-bg-tertiary)]',
                      'transition-colors duration-150',
                      'disabled:opacity-50'
                    )}
                  >
                    <StepForwardOutlined className="text-lg" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center',
                    'bg-[var(--color-primary)]/10'
                  )}
                >
                  <svg
                    className="w-6 h-6 text-[var(--color-primary)]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-normal)] truncate">
                    {currentItem.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    {currentItem.artist || '未知艺术家'}
                  </p>
                </div>
                {currentItem.duration > 0 && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {formatDuration(currentItem.duration)}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {playlist.length === 0 ? (
              <div className="py-8 text-center">
                <div
                  className={cn(
                    'w-16 h-16 mx-auto mb-4 rounded-full',
                    'bg-[var(--color-bg-tertiary)]',
                    'flex items-center justify-center'
                  )}
                >
                  <svg
                    className="w-8 h-8 text-[var(--color-text-muted)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  播放列表为空
                </p>
                <Button
                  variant="primary"
                  className="mt-4 px-3 py-1.5 text-xs rounded-lg"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  添加第一首歌曲
                </Button>
              </div>
            ) : (
              playlist.map((item, index) => (
                <PlaylistItem
                  key={item.id}
                  item={item}
                  index={index}
                  roomId={roomId}
                  isCurrentItem={item.status === 2}
                />
              ))
            )}
          </div>
        </div>
      )}

      <AddPlaylistItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        roomId={roomId}
        onSuccess={handleAddSuccess}
      />
    </div>
  )
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
