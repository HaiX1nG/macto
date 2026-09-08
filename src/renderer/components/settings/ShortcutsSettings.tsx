/**
 * ShortcutsSettings Component
 *
 * Provides a UI for viewing, editing, and resetting keyboard shortcuts.
 * Includes conflict detection and a recording mode for capturing new shortcuts.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Button, Modal, Tooltip, Alert } from 'antd'
import {
  ReloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@renderer/utils/cn'
import {
  type ShortcutDefinition,
  type ShortcutCategory,
  SHORTCUT_CATEGORIES,
  formatKeysForDisplay,
} from '@renderer/config/shortcuts'
import {
  useKeyboardShortcuts,
  type ShortcutConflict,
} from '@renderer/hooks/useKeyboardShortcuts'

interface ShortcutsSettingsProps {
  /** Whether the settings panel is visible */
  open?: boolean
  /** Callback when settings are closed */
  onClose?: () => void
}

/** Group shortcuts by category */
function groupShortcutsByCategory(
  shortcuts: ShortcutDefinition[]
): Record<ShortcutCategory, ShortcutDefinition[]> {
  const grouped = {} as Record<ShortcutCategory, ShortcutDefinition[]>

  for (const category of Object.keys(SHORTCUT_CATEGORIES) as ShortcutCategory[]) {
    grouped[category] = []
  }

  for (const shortcut of shortcuts) {
    if (grouped[shortcut.category]) {
      grouped[shortcut.category].push(shortcut)
    }
  }

  return grouped
}

export const ShortcutsSettings: React.FC<ShortcutsSettingsProps> = ({
  open: _open = true,
  onClose: _onClose,
}) => {
  const {
    conflicts: _conflicts,
    isRecording,
    recordingId: _recordingId,
    startRecording,
    stopRecording,
    updateShortcut,
    resetShortcut,
    resetAllShortcuts,
    getShortcuts,
    detectConflicts,
  } = useKeyboardShortcuts([])

  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>([])
  const [localConflicts, setLocalConflicts] = useState<ShortcutConflict[]>([])
  const [recordingShortcutId, setRecordingShortcutId] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Load shortcuts on mount
  useEffect(() => {
    setShortcuts(getShortcuts())
    setLocalConflicts(detectConflicts())
  }, [getShortcuts, detectConflicts])

  const groupedShortcuts = useMemo(() => groupShortcutsByCategory(shortcuts), [shortcuts])

  /** Handle starting shortcut recording */
  const handleStartRecording = useCallback(
    async (shortcutId: string) => {
      setRecordingShortcutId(shortcutId)
      try {
        const keys = await startRecording(shortcutId)
        updateShortcut(shortcutId, keys)
        setShortcuts(getShortcuts())
        setLocalConflicts(detectConflicts())
      } finally {
        setRecordingShortcutId(null)
      }
    },
    [startRecording, updateShortcut, getShortcuts, detectConflicts]
  )

  /** Handle resetting a single shortcut */
  const handleResetShortcut = useCallback(
    (shortcutId: string) => {
      resetShortcut(shortcutId)
      setShortcuts(getShortcuts())
      setLocalConflicts(detectConflicts())
    },
    [resetShortcut, getShortcuts, detectConflicts]
  )

  /** Handle resetting all shortcuts */
  const handleResetAll = useCallback(() => {
    resetAllShortcuts()
    setShortcuts(getShortcuts())
    setLocalConflicts(detectConflicts())
    setShowResetConfirm(false)
  }, [resetAllShortcuts, getShortcuts, detectConflicts])

  /** Check if a shortcut has conflicts */
  const getConflictsForShortcut = useCallback(
    (shortcutId: string) => {
      return localConflicts.filter(conflict =>
        conflict.shortcutIds.includes(shortcutId)
      )
    },
    [localConflicts]
  )

  const categoryEntries = Object.entries(SHORTCUT_CATEGORIES)
    .sort((a, b) => a[1].order - b[1].order)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
            )}
          >
            <KeyOutlined className="text-lg" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-normal)]">
              键盘快捷键
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              自定义您的键盘快捷键
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowResetConfirm(true)}
          icon={<ReloadOutlined />}
          className="rounded-xl"
        >
          恢复默认
        </Button>
      </div>

      {/* Conflict Warning */}
      <AnimatePresence>
        {localConflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Alert
              message="快捷键冲突"
              description={`检测到 ${localConflicts.length} 个快捷键冲突。请修改冲突的快捷键设置。`}
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
              className="rounded-xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Status */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'p-4 rounded-xl border-2 border-dashed',
              'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/30',
              'flex items-center gap-3'
            )}
          >
            <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] animate-pulse" />
            <span className="text-sm text-[var(--color-text-normal)]">
              按下一个按键组合以设置快捷键...
            </span>
            <button
              onClick={() => {
                stopRecording()
                setRecordingShortcutId(null)
              }}
              className="ml-auto text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              取消
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcuts List */}
      <div className="space-y-6">
        {categoryEntries.map(([category, config]) => {
          const categoryShortcuts = groupedShortcuts[category as ShortcutCategory]
          if (!categoryShortcuts || categoryShortcuts.length === 0) return null

          return (
            <div key={category}>
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 px-1">
                {config.label}
              </h3>
              <div className="space-y-1">
                {categoryShortcuts.map(shortcut => (
                  <ShortcutRow
                    key={shortcut.id}
                    shortcut={shortcut}
                    isRecording={isRecording && recordingShortcutId === shortcut.id}
                    onStartRecording={() => handleStartRecording(shortcut.id)}
                    onReset={() => handleResetShortcut(shortcut.id)}
                    conflicts={getConflictsForShortcut(shortcut.id)}
                    isDefault={
                      shortcut.currentKeys === undefined ||
                      shortcut.currentKeys === shortcut.defaultKeys
                    }
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        title="确认恢复默认"
        open={showResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        onOk={handleResetAll}
        okText="恢复默认"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p className="text-[var(--color-text-normal)]">
          确定要将所有快捷键恢复为默认设置吗？此操作不可撤销。
        </p>
      </Modal>
    </div>
  )
}

/** Individual shortcut row component */
interface ShortcutRowProps {
  shortcut: ShortcutDefinition
  isRecording: boolean
  onStartRecording: () => void
  onReset: () => void
  conflicts: ShortcutConflict[]
  isDefault: boolean
}

const ShortcutRow: React.FC<ShortcutRowProps> = ({
  shortcut,
  isRecording,
  onStartRecording,
  onReset,
  conflicts,
  isDefault,
}) => {
  const displayKeys = shortcut.currentKeys || shortcut.defaultKeys
  const hasConflicts = conflicts.length > 0

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-xl transition-all duration-200',
        'hover:bg-[var(--color-bg-tertiary)]',
        isRecording && 'bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]/20',
        hasConflicts && 'bg-amber-500/5'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text-normal)]">
            {shortcut.description}
          </span>
          {hasConflicts && (
            <Tooltip title={conflicts.map(c => c.description).join('\n')}>
              <ExclamationCircleOutlined className="text-amber-500 text-sm" />
            </Tooltip>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Key display */}
        <div
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-mono',
            'border transition-all duration-200',
            isRecording
              ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]'
              : hasConflicts
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                : 'bg-[var(--color-bg-darker)] border-[var(--color-border)] text-[var(--color-text-muted)]'
          )}
        >
          {isRecording ? '按下一个按键组合...' : formatKeysForDisplay(displayKeys)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Tooltip title="修改快捷键">
            <button
              onClick={onStartRecording}
              disabled={isRecording}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                'text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-tertiary)]',
                isRecording && 'opacity-50 cursor-not-allowed'
              )}
            >
              <EditOutlined className="text-sm" />
            </button>
          </Tooltip>

          {!isDefault && (
            <Tooltip title="恢复默认">
              <button
                onClick={onReset}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                  'text-[var(--color-text-muted)] hover:text-[var(--color-dnd)] hover:bg-[var(--color-bg-tertiary)]'
                )}
              >
                <ReloadOutlined className="text-sm" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShortcutsSettings
