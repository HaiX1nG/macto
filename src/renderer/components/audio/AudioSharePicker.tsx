import { useState, useEffect } from 'react'
import { Modal, Spin } from 'antd'
import { SoundOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

interface AudioSource {
  id: string
  name: string
}

interface AudioSharePickerProps {
  open: boolean
  onSelect: (sourceId: string) => void
  onCancel: () => void
}

export function AudioSharePicker({ open, onSelect, onCancel }: AudioSharePickerProps) {
  const [sources, setSources] = useState<AudioSource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setLoading(true)
      setError(null)
      setSelectedId(null)

      // Get desktop audio sources via IPC
      window.electronAPI.getAudioSources()
        .then((audioSources: AudioSource[]) => {
          setSources(audioSources || [])
          setLoading(false)
        })
        .catch((err: Error) => {
          console.error('Failed to get audio sources:', err)
          setError('获取音频源失败: ' + err.message)
          setLoading(false)
        })
    }
  }, [open])

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId)
    }
  }

  return (
    <Modal
      open={open}
      title="选择音频源"
      onCancel={onCancel}
      onOk={handleConfirm}
      okText="开始分享"
      cancelText="取消"
      okButtonProps={{ disabled: !selectedId }}
      width={500}
      zIndex={2000}
      styles={{
        body: { backgroundColor: 'var(--color-bg-secondary)', maxHeight: '400px', overflowY: 'auto' }
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spin />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-[var(--color-dnd)]">
          {error}
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-muted)]">
          没有可用的音频源
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3 text-sm text-[var(--color-text-muted)]">
            <SoundOutlined />
            <span>应用程序音频</span>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mb-4 p-2 rounded bg-[var(--color-bg-tertiary)]">
            提示：只能检测当前桌面上的窗口。如果目标应用在其他桌面，请将其移动到当前桌面。
          </div>
          {sources.map((source) => (
            <button
              key={source.id}
              onClick={() => setSelectedId(source.id)}
              className={cn(
                "w-full p-3 rounded-lg border-2 transition-all text-left",
                "flex items-center gap-3",
                selectedId === source.id
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                  : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                selectedId === source.id
                  ? "bg-[var(--color-primary)]"
                  : "bg-[var(--color-bg-tertiary)]"
              )}>
                <SoundOutlined className={cn(
                  selectedId === source.id
                    ? "text-white"
                    : "text-[var(--color-text-muted)]"
                )} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-[var(--color-text-normal)]">
                  {source.name}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  应用程序音频
                </div>
              </div>
              {selectedId === source.id && (
                <div className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
