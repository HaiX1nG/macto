import { useState } from 'react'
import { Modal } from '@renderer/components/ui/Modal'
import { Button } from '@renderer/components/ui/Button'
import { Input } from '@renderer/components/ui/Input'
import { usePlaylistStore } from '@renderer/stores/playlistStore'
import { cn } from '@renderer/utils/cn'
import type { AddPlaylistItemRequest } from '@shared/types/api'

interface AddPlaylistItemModalProps {
  isOpen: boolean
  onClose: () => void
  roomId: number
  onSuccess: () => void
}

export const AddPlaylistItemModal = ({
  isOpen,
  onClose,
  roomId,
  onSuccess,
}: AddPlaylistItemModalProps) => {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [musicUrl, setMusicUrl] = useState('')
  const [duration, setDuration] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { addItem, isLoading, clearError } = usePlaylistStore()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = '请输入歌曲标题'
    }

    if (!musicUrl.trim()) {
      newErrors.musicUrl = '请输入音乐 URL'
    } else {
      try {
        new URL(musicUrl)
      } catch {
        newErrors.musicUrl = '请输入有效的 URL'
      }
    }

    if (duration) {
      const durationNum = parseInt(duration, 10)
      if (isNaN(durationNum) || durationNum <= 0) {
        newErrors.duration = '时长必须为正整数（秒）'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    const data: AddPlaylistItemRequest = {
      title: title.trim(),
      artist: artist.trim() || undefined,
      musicUrl: musicUrl.trim(),
      duration: duration ? parseInt(duration, 10) : undefined,
    }

    try {
      clearError()
      await addItem(roomId, data)
      resetForm()
      onSuccess()
    } catch (error) {
      console.error('Failed to add item:', error)
    }
  }

  const resetForm = () => {
    setTitle('')
    setArtist('')
    setMusicUrl('')
    setDuration('')
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="添加歌曲"
      description="添加一首新歌曲到播放列表"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isLoading}
          >
            添加
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="歌曲标题"
          placeholder="输入歌曲标题"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (errors.title) {
              setErrors((prev) => ({ ...prev, title: '' }))
            }
          }}
          error={errors.title}
          required
        />

        <Input
          label="艺术家"
          placeholder="输入艺术家名称（可选）"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
        />

        <Input
          label="音乐 URL"
          placeholder="https://example.com/music.mp3"
          value={musicUrl}
          onChange={(e) => {
            setMusicUrl(e.target.value)
            if (errors.musicUrl) {
              setErrors((prev) => ({ ...prev, musicUrl: '' }))
            }
          }}
          error={errors.musicUrl}
          required
        />

        <Input
          label="时长（秒）"
          placeholder="例如: 180（可选）"
          value={duration}
          onChange={(e) => {
            setDuration(e.target.value.replace(/[^0-9]/g, ''))
            if (errors.duration) {
              setErrors((prev) => ({ ...prev, duration: '' }))
            }
          }}
          error={errors.duration}
          hint="歌曲时长，单位为秒"
        />

        <div
          className={cn(
            'p-3 rounded-xl',
            'bg-[var(--color-bg-tertiary)]',
            'border border-[var(--color-border)]'
          )}
        >
          <p className="text-xs text-[var(--color-text-muted)]">
            提示：支持 MP3、WAV、OGG 等常见音频格式的直链 URL
          </p>
        </div>
      </div>
    </Modal>
  )
}
