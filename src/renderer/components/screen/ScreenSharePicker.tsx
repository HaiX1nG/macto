import { useState, useEffect } from 'react'
import { Modal, Spin } from 'antd'
import { DesktopOutlined, AppstoreOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import type { ScreenSource } from '@shared/types/ipc'

interface ScreenSharePickerProps {
  open: boolean
  onSelect: (sourceId: string) => void
  onCancel: () => void
}

export function ScreenSharePicker({ open, onSelect, onCancel }: ScreenSharePickerProps) {
  const [sources, setSources] = useState<ScreenSource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setLoading(true)
      setError(null)
      setSelectedId(null)

      // Check if electronAPI is available
      if (!window.electronAPI?.getScreenSources) {
        console.error('electronAPI.getScreenSources is not available')
        setError('屏幕捕获功能不可用')
        setLoading(false)
        return
      }

      // Get screen sources from Electron
      window.electronAPI.getScreenSources()
        .then((result: ScreenSource[]) => {
          setSources(result || [])
          setLoading(false)
        })
        .catch((err: unknown) => {
          console.error('Failed to get screen sources:', err)
          setError('获取屏幕源失败: ' + (err instanceof Error ? err.message : String(err)))
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
      title="选择要共享的屏幕"
      onCancel={onCancel}
      onOk={handleConfirm}
      okText="开始共享"
      cancelText="取消"
      okButtonProps={{ disabled: !selectedId }}
      width={700}
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
          没有可用的屏幕源
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* Screens */}
          {sources.filter(s => s.id.startsWith('screen:')).length > 0 && (
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-2 text-sm text-[var(--color-text-muted)]">
                <DesktopOutlined />
                <span>屏幕</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {sources.filter(s => s.id.startsWith('screen:')).map(source => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    selected={selectedId === source.id}
                    onClick={() => setSelectedId(source.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Windows */}
          {sources.filter(s => s.id.startsWith('window:')).length > 0 && (
            <div className="col-span-2 mt-4">
              <div className="flex items-center gap-2 mb-2 text-sm text-[var(--color-text-muted)]">
                <AppstoreOutlined />
                <span>窗口</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {sources.filter(s => s.id.startsWith('window:')).map(source => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    selected={selectedId === source.id}
                    onClick={() => setSelectedId(source.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

function SourceCard({ source, selected, onClick }: { source: ScreenSource; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-lg overflow-hidden border-2 transition-all",
        selected ? "border-[var(--color-primary)]" : "border-transparent hover:border-[var(--color-border)]"
      )}
    >
      <img
        src={source.thumbnail}
        alt={source.name}
        className="w-full h-auto aspect-video object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
        <span className="text-xs text-white truncate block">{source.name}</span>
      </div>
      {selected && (
        <div className="absolute inset-0 bg-[var(--color-primary)]/20 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </button>
  )
}