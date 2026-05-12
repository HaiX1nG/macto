import { useState, useRef, useEffect, useCallback } from 'react'
import { GiftOutlined, PictureOutlined, FileAddOutlined, SendOutlined, PlusOutlined, CloseOutlined, LoadingOutlined, QuestionCircleOutlined, EyeOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { EmojiPicker } from '@renderer/components/ui/EmojiPicker'
import { MarkdownRenderer } from '@renderer/components/ui/MarkdownRenderer'
import { MentionAutocomplete } from './MentionAutocomplete'
import { uploadService } from '@renderer/services'
import { App, Tooltip } from 'antd'
import type { MessageSendStatus } from '@renderer/stores/chatStore'

interface MentionUser {
  id: number | string
  username: string
  displayName?: string
  avatar?: string
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

export function MessageInput({ onSend, channelName, replyingTo, onCancelReply, members = [], sendStatus, onRetry }: MessageInputProps) {
  const { message: messageApi } = App.useApp()
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Mention autocomplete state
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)

  // Focus textarea when reply changes
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyingTo])

  // Calculate mention popup position
  const calculateMentionPosition = useCallback(() => {
    if (!textareaRef.current || !containerRef.current) {
      return { top: 0, left: 0 }
    }

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()

    // Approximate position - show above the input
    return {
      top: containerRect.top - 260,
      left: containerRect.left + 10,
    }
  }, [])

  // Handle mention detection
  const handleMentionDetection = useCallback((value: string, cursorPos: number) => {
    // Find @ symbol before cursor
    const textBeforeCursor = value.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      // Check if there's a space between @ and cursor (would cancel mention)
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
    if (!trimmed || isSending) return

    setIsSending(true)
    onSend(trimmed)
    setMessage('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setShowMentions(false)
    setIsSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If mention autocomplete is open, let it handle navigation
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

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }

    // Check for mention trigger
    handleMentionDetection(value, cursorPos)
  }

  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current || !showMentions) return

    const cursorPos = textareaRef.current.selectionStart
    handleMentionDetection(message, cursorPos)
  }, [message, showMentions, handleMentionDetection])

  // Listen for selection changes
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

    // Move cursor after emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
      textarea.focus()
    }, 0)
  }

  const handleMentionSelect = (user: MentionUser) => {
    const textarea = textareaRef.current
    if (!textarea || mentionStartIndex === -1) return

    // Replace @mention with @username
    const before = message.slice(0, mentionStartIndex)
    const after = message.slice(textarea.selectionStart)
    const newMessage = `${before}@${user.username} ${after}`
    setMessage(newMessage)
    setShowMentions(false)
    setMentionStartIndex(-1)

    // Focus textarea
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
          await handleFileUpload(file, true)
        }
        break
      }
    }
  }

  const handleFileUpload = async (file: File, isImage = false) => {
    setIsUploading(true)
    setUploadProgress(isImage ? '上传图片中...' : '上传文件中...')

    try {
      const result = await (isImage ? uploadService.uploadImage(file) : uploadService.uploadAttachment(file))

      // Send message with attachment
      onSend('', [{
        url: result.url,
        type: result.type,
        filename: result.filename,
        size: result.size,
      }])
      messageApi.success(isImage ? '图片上传成功' : '文件上传成功')
    } catch (err) {
      console.error('Upload failed:', err)
      messageApi.error(err instanceof Error ? err.message : '上传失败')
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFileUpload(file, true)
      }
    }
    input.click()
  }

  const handleFileUploadClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFileUpload(file, false)
      }
    }
    input.click()
  }

  return (
    <div ref={containerRef} className="px-4 pb-6 pt-2 flex-shrink-0 relative">
      {/* Mention Autocomplete */}
      <MentionAutocomplete
        users={members}
        searchText={mentionSearch}
        position={mentionPosition}
        onSelect={handleMentionSelect}
        onClose={() => setShowMentions(false)}
        visible={showMentions}
      />

      {/* Reply indicator */}
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

      <div className={cn(
        "relative bg-[var(--color-bg-darker)] rounded-lg",
        replyingTo && "rounded-t-none"
      )}>
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
            <button onClick={handleImageUpload} className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] rounded hover:bg-[var(--color-bg-tertiary)]">
              <PictureOutlined className="text-lg" />
            </button>
          </Tooltip>
          <Tooltip title="上传文件">
            <button onClick={handleFileUploadClick} className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] rounded hover:bg-[var(--color-bg-tertiary)]">
              <FileAddOutlined className="text-lg" />
            </button>
          </Tooltip>
          <EmojiPicker onSelect={handleEmojiSelect} />
          <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
          {isUploading ? (
            <div className="flex items-center gap-1 px-2 text-xs text-[var(--color-text-muted)]">
              <LoadingOutlined className="animate-spin" />
              <span>{uploadProgress}</span>
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
                disabled={!message.trim() || isSending || isUploading}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded transition-colors",
                  message.trim() && !isSending && !isUploading
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

      {/* Typing hint */}
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

      {/* Markdown Preview */}
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
