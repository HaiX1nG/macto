import { useState, useRef } from 'react'
import { GiftOutlined, PictureOutlined, FileAddOutlined, SendOutlined, PlusOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { EmojiPicker } from '@renderer/components/ui/EmojiPicker'

interface MessageInputProps {
  onSend: (content: string) => void
  channelName: string
}

export function MessageInput({ onSend, channelName }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmed = message.trim()
    if (trimmed) {
      onSend(trimmed)
      setMessage('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }
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
        // TODO: Handle image paste
      }
    }
  }

  return (
    <div className="px-4 pb-6 pt-2 flex-shrink-0">
      <div className="relative bg-[var(--color-bg-darker)] rounded-lg">
        <button className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] rounded hover:bg-[var(--color-bg-tertiary)]">
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
          className="w-full bg-transparent pl-14 pr-36 py-3 text-[var(--color-text-normal)] placeholder-[var(--color-text-muted)] outline-none resize-none min-h-[44px] max-h-[200px]"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] rounded hover:bg-[var(--color-bg-tertiary)]" title="礼物"><GiftOutlined className="text-lg" /></button>
          <button className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] rounded hover:bg-[var(--color-bg-tertiary)]" title="图片"><PictureOutlined className="text-lg" /></button>
          <button className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] rounded hover:bg-[var(--color-bg-tertiary)]" title="文件"><FileAddOutlined className="text-lg" /></button>
          <EmojiPicker onSelect={handleEmojiSelect} />
          <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
          <button onClick={handleSubmit} disabled={!message.trim()} className={cn("w-8 h-8 flex items-center justify-center rounded", message.trim() ? "text-[var(--color-primary)] hover:bg-[var(--color-bg-tertiary)]" : "text-[var(--color-text-muted)] cursor-not-allowed")} title="发送">
            <SendOutlined className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  )
}
