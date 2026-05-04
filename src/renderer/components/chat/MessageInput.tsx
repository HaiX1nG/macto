import { useState, useRef, useEffect } from 'react'
import { GiftOutlined, PictureOutlined, FileAddOutlined, SendOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { EmojiPicker } from '@renderer/components/ui/EmojiPicker'

interface MessageInputProps {
  onSend: (content: string) => void
  channelName: string
  replyingTo?: { name: string; content: string } | null
  onCancelReply?: () => void
}

export function MessageInput({ onSend, channelName, replyingTo, onCancelReply }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when reply changes
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyingTo])

  const handleSubmit = () => {
    const trimmed = message.trim()
    if (!trimmed || isSending) return

    setIsSending(true)
    onSend(trimmed)
    setMessage('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji)
    textareaRef.current?.focus()
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        // TODO: Handle image paste - upload and send
      }
    }
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // TODO: Upload image and send
      }
    }
    input.click()
  }

  const handleFileUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // TODO: Upload file and send
      }
    }
    input.click()
  }

  return (
    <div className="px-4 pb-6 pt-2 flex-shrink-0">
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
        <button className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] rounded hover:bg-[var(--color-bg-tertiary)]" title="更多">
          <PlusOutlined className="text-xl" />
        </button>
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
          <button onClick={() => {}} className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] rounded hover:bg-[var(--color-bg-tertiary)]" title="礼物">
            <GiftOutlined className="text-lg" />
          </button>
          <button onClick={handleImageUpload} className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] rounded hover:bg-[var(--color-bg-tertiary)]" title="图片">
            <PictureOutlined className="text-lg" />
          </button>
          <button onClick={handleFileUpload} className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] rounded hover:bg-[var(--color-bg-tertiary)]" title="文件">
            <FileAddOutlined className="text-lg" />
          </button>
          <EmojiPicker onSelect={handleEmojiSelect} />
          <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || isSending}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded",
              message.trim() && !isSending
                ? "text-[var(--color-primary)] hover:bg-[var(--color-bg-tertiary)]"
                : "text-[var(--color-text-muted)] cursor-not-allowed"
            )}
            title="发送"
          >
            <SendOutlined className="text-lg" />
          </button>
        </div>
      </div>

      {/* Typing hint */}
      <div className="mt-1 px-2 text-xs text-[var(--color-text-muted)]">
        按 Enter 发送，Shift + Enter 换行
      </div>
    </div>
  )
}
