import { useState, useRef } from 'react'
import { cn } from '@renderer/utils/cn'
import { usePlaylistStore } from '@renderer/stores/playlistStore'
import {
  DeleteOutlined,
  PlayCircleOutlined,
  HolderOutlined,
} from '@ant-design/icons'
import type { PlaylistItemResponse } from '@shared/types/api'

interface PlaylistItemProps {
  item: PlaylistItemResponse
  index: number
  roomId: number
  isCurrentItem: boolean
}

export const PlaylistItem = ({
  item,
  index,
  roomId,
  isCurrentItem,
}: PlaylistItemProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragNodeRef = useRef<HTMLDivElement>(null)

  const { removeItem, isLoading } = usePlaylistStore()

  const handleRemove = async () => {
    try {
      await removeItem(roomId, item.id)
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(item.id))
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId === String(item.id)) return

    const playlist = usePlaylistStore.getState().playlist
    const draggedIndex = playlist.findIndex((p) => String(p.id) === draggedId)
    const targetIndex = index

    if (draggedIndex === -1 || draggedIndex === targetIndex) return

    const newPlaylist = [...playlist]
    const [draggedItem] = newPlaylist.splice(draggedIndex, 1)
    newPlaylist.splice(targetIndex, 0, draggedItem)

    const itemIds = newPlaylist.map((p) => p.id)
    try {
      const { playlistService } = await import('@renderer/services')
      await playlistService.reorder(roomId, { itemIds })
      usePlaylistStore.getState().fetchPlaylist(roomId)
    } catch (error) {
      console.error('Failed to reorder playlist:', error)
    }
  }

  const getStatusStyles = () => {
    if (item.status === 2) {
      return cn(
        'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/20'
      )
    }
    if (item.status === 3) {
      return cn('opacity-50')
    }
    return cn('hover:bg-[var(--color-bg-tertiary)]')
  }

  const getStatusIcon = () => {
    if (item.status === 2) {
      return (
        <span className="flex items-center gap-0.5">
          <span className="w-0.5 h-3 bg-[var(--color-primary)] rounded-full animate-equalizer-1" />
          <span className="w-0.5 h-3 bg-[var(--color-primary)] rounded-full animate-equalizer-2" />
          <span className="w-0.5 h-3 bg-[var(--color-primary)] rounded-full animate-equalizer-3" />
        </span>
      )
    }
    if (item.status === 3) {
      return <span className="w-3 h-3 rounded-full bg-[var(--color-text-muted)]/30" />
    }
    return <span className="text-xs text-[var(--color-text-muted)]">{index + 1}</span>
  }

  return (
    <div
      ref={dragNodeRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-xl',
        'border border-transparent',
        'transition-all duration-150',
        'cursor-grab active:cursor-grabbing',
        getStatusStyles(),
        isDragging && 'opacity-50 scale-95',
        isDragOver && 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
      )}
    >
      <div
        className={cn(
          'w-6 h-6 flex items-center justify-center',
          'text-[var(--color-text-muted)]',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-150'
        )}
      >
        <HolderOutlined className="text-sm" />
      </div>

      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          item.status === 2
            ? 'bg-[var(--color-primary)]/10'
            : 'bg-[var(--color-bg-tertiary)]'
        )}
      >
        {getStatusIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            isCurrentItem
              ? 'text-[var(--color-primary)]'
              : 'text-[var(--color-text-normal)]'
          )}
        >
          {item.title}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] truncate">
          {item.artist || '未知艺术家'}
        </p>
      </div>

      {item.duration > 0 && (
        <span className="text-xs text-[var(--color-text-muted)]">
          {formatDuration(item.duration)}
        </span>
      )}

      <div
        className={cn(
          'flex items-center gap-1',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-150'
        )}
      >
        {item.status !== 2 && (
          <button
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center',
              'text-[var(--color-text-muted)]',
              'hover:bg-[var(--color-bg-tertiary)]',
              'hover:text-[var(--color-primary)]',
              'transition-colors duration-150'
            )}
          >
            <PlayCircleOutlined className="text-base" />
          </button>
        )}
        <button
          onClick={handleRemove}
          disabled={isLoading}
          className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center',
            'text-[var(--color-text-muted)]',
            'hover:bg-[var(--color-dnd)]/10',
            'hover:text-[var(--color-dnd)]',
            'transition-colors duration-150',
            'disabled:opacity-50'
          )}
        >
          <DeleteOutlined className="text-base" />
        </button>
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
