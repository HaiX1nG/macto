import { useState, useRef, useEffect, useCallback } from 'react'
import { GiftOutlined, PictureOutlined, FileAddOutlined, SendOutlined, PlusOutlined, CloseOutlined, LoadingOutlined, QuestionCircleOutlined, EyeOutlined, EditOutlined, ReloadOutlined, InboxOutlined, DeleteOutlined, ReloadOutlined as RetryOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { EmojiPicker } from '@renderer/components/ui/EmojiPicker'
import { MarkdownRenderer } from '@renderer/components/ui/MarkdownRenderer'
import { MentionAutocomplete } from './MentionAutocomplete'
import { uploadService } from '@renderer/services'
import { Tooltip } from 'antd'
import type { MessageSendStatus } from '@renderer/stores/chatStore'

interface MentionUser {
  id: number | string
  username: string
  displayName?: string
  avatar?: string
}

interface UploadItem {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  result?: {
    url: string
    type: 'image' | 'video' | 'audio' | 'file'
    filename: string
    size: number
  }
}

interface MessageInputProps {
  onSend: (content: string, attachments?: { url: string; type: 'image' | 'video' | 'audio' | 'file'; filename: string; size: number }[]) => void
  channelName: string
  replyingTo?: { name: string; content: string } | null
  onCancelReply?: () => void
  members?: MentionUser[]
  sendStatus?: MessageSendStatus
  onRetry?: () => void
}

const generateUploadId = () => `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export function MessageInput({ onSend, channelName, replyingTo, onCancelReply, members = [], sendStatus, onRetry }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)

  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)

  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyingTo])

  const calculateMentionPosition = useCallback(() => {
    if (!textareaRef.current || !containerRef.current) {
      return { top: 0, left: 0 }
    }

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()

    return {
      top: containerRect.top - 260,
      left: containerRect.left + 10,
    }
  }, [])

  const handleMentionDetection = useCallback((value: string, cursorPos: number) => {
    const textBeforeCursor = value.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionStartIndex(lastAtIndex)
        setMentionSearch(textAfterAt)
        setShowMentions(true)
        setMentionPosition(calculateMentionPosition())
        return
      }
    }

    setShowMentions(false)
    setMentionStartIndex(-1)
  }, [calculateMentionPosition])

  const handleSubmit = () => {
    const trimmed = message.trim()
    const successfulUploads = uploads.filter(u => u.status === 'success' && u.result)
    if ((!trimmed && successfulUploads.length === 0) || isSending) return

    setIsSending(true)

    const attachments = successfulUploads.map(u => u.result!)

    onSend(trimmed, attachments.length > 0 ? attachments : undefined)
    setMessage('')
    setUploads([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setShowMentions(false)
    setIsSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape')) {
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart || 0

    setMessage(value)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }

    handleMentionDetection(value, cursorPos)
  }

  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current || !showMentions) return

    const cursorPos = textareaRef.current.selectionStart
    handleMentionDetection(message, cursorPos)
  }, [message, showMentions, handleMentionDetection])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [handleSelectionChange])

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setMessage(prev => prev + emoji)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newMessage = message.slice(0, start) + emoji + message.slice(end)
    setMessage(newMessage)

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
      textarea.focus()
    }, 0)
  }

  const handleMentionSelect = (user: MentionUser) => {
    const textarea = textareaRef.current
    if (!textarea || mentionStartIndex === -1) return

    const before = message.slice(0, mentionStartIndex)
    const after = message.slice(textarea.selectionStart)
    const newMessage = `${before}@${user.username} ${after}`
    setMessage(newMessage)
    setShowMentions(false)
    setMentionStartIndex(-1)

    setTimeout(() => {
      textarea.focus()
      const newPos = before.length + user.username.length + 2
      textarea.selectionStart = textarea.selectionEnd = newPos
    }, 0)
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await addFilesToUploadQueue([file])
        }
        break
      }
    }
  }

  const addFilesToUploadQueue = async (files: File[]) => {
    const newUploads: UploadItem[] = files.map(file => ({
      id: generateUploadId(),
      file,
      progress: 0,
      status: 'pending' as const,
    }))

    setUploads(prev => [...prev, ...newUploads])

    for (const upload of newUploads) {
      await processUpload(upload)
    }
  }

  const processUpload = async (uploadItem: UploadItem) => {
    setUploads(prev => prev.map(u =>
      u.id === uploadItem.id ? { ...u, status: 'uploading', progress: 10 } : u
    ))

    const simulateProgress = () => {
      const interval = setInterval(() => {
        setUploads(prev => prev.map(u => {
          if (u.id === uploadItem.id && u.status === 'uploading' && u.progress < 90) {
            return { ...u, progress: Math.min(u.progress + 10, 90) }
          }
          return u
        }))
      }, 200)
      return () => clearInterval(interval)
    }

    const clearProgress = simulateProgress()

    try {
      const isImage = uploadItem.file.type.startsWith('image/')
      const result = await (isImage
        ? uploadService.uploadImage(uploadItem.file)
        : uploadService.uploadAttachment(uploadItem.file))

      clearProgress()

      setUploads(prev => prev.map(u =>
        u.id === uploadItem.id
          ? { ...u, status: 'success', progress: 100, result }
          : u
      ))
    } catch (err) {
      clearProgress()
      const errorMessage = err instanceof Error ? err.message : '上传失败'
      setUploads(prev => prev.map(u =>
        u.id === uploadItem.id
          ? { ...u, status: 'error', error: errorMessage }
          : u
      ))
    }
  }

  const retryUpload = (uploadItem: UploadItem) => {
    const newUpload: UploadItem = {
      ...uploadItem,
      status: 'pending',
      progress: 0,
      error: undefined,
    }
    setUploads(prev => prev.map(u => u.id === uploadItem.id ? newUpload : u))
    processUpload(newUpload)
  }

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id))
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length > 0) {
        addFilesToUploadQueue(files)
      }
    }
    input.click()
  }

  const handleFileUploadClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length > 0) {
        addFilesToUploadQueue(files)
      }
    }
    input.click()
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropAreaRef.current && !dropAreaRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      addFilesToUploadQueue(files)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isUploading = uploads.some(u => u.status === 'uploading' || u.status === 'pending')

  return (
    <div ref={containerRef} className="px-4 pb-6 pt-2 flex-shrink-0 relative bg-[var(--color-bg-base)] border-t border-[var(--color-border)]">
      <MentionAutocomplete
        users={members}
        searchText={mentionSearch}
        position={mentionPosition}
        onSelect={handleMentionSelect}
        onClose={() => setShowMentions(false)}
        visible={showMentions}
      />

      {replyingTo && (
        <div className="mb-2 px-3 py-2 bg-[var(--color-bg-tertiary)] rounded-t-lg flex items-center gap-2 border border-b-0 border-[var(--color-border)]">
          <div className="w-1 h-8 bg-[var(--color-primary)] rounded-full" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[var(--color-primary)] font-medium">
              回复 {replyingTo.name}
            </div>
            <div className="text-sm text-[var(--color-text-muted)] truncate">
              {replyingTo.content}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="w-6 h-6 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] rounded hover:bg-[var(--color-bg-darker)]"
          >
            <CloseOutlined className="text-xs" />
          </button>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="mb-2 space-y-2">
          {uploads.map(upload => (
            <div
              key={upload.id}
              className={cn(
                "px-3 py-2 rounded-lg flex items-center gap-3",
                upload.status === 'error' && "bg-[var(--color-dnd)]/10 border border-[var(--color-dnd)]/30",
                upload.status !== 'error' && "bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]"
              )}
            >
              <div className="w-10 h-10 rounded bg-[var(--color-bg-darker)] flex items-center justify-center flex-shrink-0">
                {upload.file.type.startsWith('image/') ? (
                  <PictureOutlined className="text-[var(--color-primary)]" />
                ) : (
                  <FileAddOutlined className="text-[var(--color-text-muted)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-sm truncate",
                  upload.status === 'error' ? "text-[var(--color-dnd)]" : "text-[var(--color-text-normal)]"
                )}>
                  {upload.file.name}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {formatFileSize(upload.file.size)}
                  {upload.status === 'uploading' && ` - 上传中 ${upload.progress}%`}
                  {upload.status === 'success' && ' - 上传完成'}
                  {upload.status === 'error' && ` - ${upload.error || '上传失败'}`}
                </div>
                {(upload.status === 'uploading' || upload.status === 'pending') && (
                  <div className="mt-1 h-1 bg-[var(--color-bg-darker)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-primary)] transition-all duration-200"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {upload.status === 'error' && (
                  <Tooltip title="重试">
                    <button
                      onClick={() => retryUpload(upload)}
                      className="w-7 h-7 flex items-center justify-center text-[var(--color-dnd)] hover:bg-[var(--color-dnd)]/20 rounded"
                    >
                      <RetryOutlined className="text-sm" />
                    </button>
                  </Tooltip>
                )}
                <Tooltip title="移除">
                  <button
                    onClick={() => removeUpload(upload.id)}
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded",
                      upload.status === 'error'
                        ? "text-[var(--color-dnd)] hover:bg-[var(--color-dnd)]/20"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-dnd)] hover:bg-[var(--color-bg-darker)]"
                    )}
                  >
                    <DeleteOutlined className="text-sm" />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        ref={dropAreaRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative bg-[var(--color-bg-darker)] rounded-lg transition-all duration-200",
          replyingTo && "rounded-t-none",
          isDragOver && "ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-bg-base)]"
        )}
      >
        {isDragOver && (
          <div className="absolute inset-0 bg-[var(--color-primary)]/10 rounded-lg flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center">
              <InboxOutlined className="text-3xl text-[var(--color-primary)] mb-2" />
              <div className="text-sm text-[var(--color-primary)] font-medium">拖放文件到此处上传</div>
            </div>
          </div>
        )}

        <Tooltip title="更多选项">
          <button className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] rounded hover:bg-[var(--color-bg-tertiary)]">
            <PlusOutlined className="text-xl" />
          </button>
        </Tooltip>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={`在 #${channelName} 发送消息`}
          rows={1}
          disabled={isSending}
          className="w-full bg-transparent pl-14 pr-36 py-3 text-[var(--color-text-normal)] placeholder-[var(--color-text-muted)] outline-none resize-none min-h-[44px] max-h-[200px] disabled:opacity-50"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Tooltip title="礼物">
            <button onClick={() => {}} className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] rounded hover:bg-[var(--color-bg-tertiary)]">
              <GiftOutlined className="text-lg" />
            </button>
          </Tooltip>
          <Tooltip title="上传图片">
            <button onClick={handleImageUpload} disabled={isUploading} className={cn(
              "w-8 h-8 flex items-center justify-center rounded",
              isUploading
                ? "text-[var(--color-text-muted)] cursor-not-allowed opacity-50"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] hover:bg-[var(--color-bg-tertiary)]"
            )}>
              <PictureOutlined className="text-lg" />
            </button>
          </Tooltip>
          <Tooltip title="上传文件">
            <button onClick={handleFileUploadClick} disabled={isUploading} className={cn(
              "w-8 h-8 flex items-center justify-center rounded",
              isUploading
                ? "text-[var(--color-text-muted)] cursor-not-allowed opacity-50"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] hover:bg-[var(--color-bg-tertiary)]"
            )}>
              <FileAddOutlined className="text-lg" />
            </button>
          </Tooltip>
          <EmojiPicker onSelect={handleEmojiSelect} />
          <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
          {isUploading ? (
            <div className="flex items-center gap-1 px-2 text-xs text-[var(--color-text-muted)]">
              <LoadingOutlined className="animate-spin" />
              <span>上传中</span>
            </div>
          ) : sendStatus === 'failed' ? (
            <Tooltip title="发送失败，点击重试">
              <button
                onClick={onRetry}
                className="w-8 h-8 flex items-center justify-center rounded text-[var(--color-dnd)] hover:bg-[var(--color-bg-tertiary)]"
              >
                <ReloadOutlined className="text-lg" />
              </button>
            </Tooltip>
          ) : (
            <Tooltip title="发送 (Enter)">
              <button
                onClick={handleSubmit}
                disabled={(!message.trim() && uploads.filter(u => u.status === 'success').length === 0) || isSending || isUploading}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded",
                  "transition-colors duration-150 active:scale-95",
                  (message.trim() || uploads.filter(u => u.status === 'success').length > 0) && !isSending && !isUploading
                    ? "text-[var(--color-primary)] hover:bg-[var(--color-bg-tertiary)]"
                    : "text-[var(--color-text-muted)] cursor-not-allowed"
                )}
              >
                {isSending ? (
                  <LoadingOutlined className="text-lg animate-spin" />
                ) : (
                  <SendOutlined className="text-lg" />
                )}
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="mt-1 px-2 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>按 Enter 发送，Shift + Enter 换行，输入 @ 提及成员</span>
        <div className="flex items-center gap-2">
          <Tooltip
            title={
              <div className="text-xs space-y-1">
                <p><code className="bg-white/20 px-1 rounded">**粗体**</code> <strong>粗体</strong></p>
                <p><code className="bg-white/20 px-1 rounded">*斜体*</code> <em>斜体</em></p>
                <p><code className="bg-white/20 px-1 rounded">~~删除线~~</code> <del>删除线</del></p>
                <p><code className="bg-white/20 px-1 rounded">`代码`</code> <code>代码</code></p>
                <p><code className="bg-white/20 px-1 rounded">```代码块```</code></p>
                <p><code className="bg-white/20 px-1 rounded">[链接](url)</code></p>
                <p><code className="bg-white/20 px-1 rounded">- 列表项</code></p>
                <p><code className="bg-white/20 px-1 rounded">{`>`} 引用</code></p>
              </div>
            }
            placement="top"
          >
            <span className="flex items-center gap-1 cursor-help hover:text-[var(--color-text-normal)]">
              <QuestionCircleOutlined />
              Markdown 支持
            </span>
          </Tooltip>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              "flex items-center gap-1 hover:text-[var(--color-text-normal)]",
              showPreview && "text-[var(--color-primary)]"
            )}
          >
            {showPreview ? <EditOutlined /> : <EyeOutlined />}
            {showPreview ? "编辑" : "预览"}
          </button>
        </div>
      </div>

      {showPreview && message.trim() && (
        <div className="mt-2 px-4 py-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]">
          <div className="text-xs text-[var(--color-text-muted)] mb-2">预览</div>
          <div className="text-[var(--color-text-normal)]">
            <MarkdownRenderer content={message} />
          </div>
        </div>
      )}
    </div>
  )
}
